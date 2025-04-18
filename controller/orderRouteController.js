const OrderRoute = require("../models/orderRoute_model");
const mongoose = require("mongoose");
const User = require("../models/user_models");
const Warehouse = require("../models/warehouse_model");
const moment = require("moment");
const Order = require("../models/order_model");
const axios = require("axios");
const DeliveryAssignment = require("../models/deliveryAssignment_model");



exports.createOrderRoute = async (req, res) => {
    try {
        const { time } = req.query;
        const { warehouseId, delivery_type } = req.params;

        const found = await OrderRoute.findOne({
            tum_tumdelivery_start_time: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").startOf('hour').local().toDate(),
            tumtumdelivery_end_time: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").endOf('hour').local().toDate()
        })
        if (found) {
            return res.status(200).json({ success: true, message: "Order route already exists", data: found });
        }

        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) {
            return res.status(404).json({ success: false, message: "Warehouse not found" });
        }
        let timeFilter;

        if (time != 'null') {
            // If time is passed, set the time range for that specific hour
            timeFilter = {
                $match: {
                    selected_time_slot: {
                        $gte: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").startOf('hour').local().toDate(),
                        $lt: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").endOf('hour').local().toDate(),
                    },
                },
            };
        } else {
            timeFilter = {
                $match: {
                    selected_time_slot: {
                        $gte: moment().startOf('day').local().toDate(),  // Start of the current day (00:00 AM)
                        $lt: moment().endOf('day').local().toDate(),    // End of the current day (11:59 PM)
                    },
                },
            };
        }
        const orders = await Order.aggregate([
            // Match by user, warehouse, delivery type
            {
                $match: {
                    // user_ref: { $in: userIds },
                    warehouse_ref: new mongoose.Types.ObjectId(warehouseId),
                    type_of_delivery: delivery_type,
                    order_status: "Order placed",
                },
            },
            // Apply time filter
            timeFilter,
            // Count how many products are in each order
            {
                $addFields: {
                    numberOfProducts: { $size: "$products" },
                },
            },
            // Lookup the "Product" documents associated to each product_ref
            {
                $lookup: {
                    from: "products",
                    localField: "products.product_ref", // Field(s) in this Order doc
                    foreignField: "_id",                // Field in the Product collection
                    as: "populatedProducts",            // Temporarily store them here
                },
            },
            // Lookup to populate warehouse_ref from Warehouse collection
            {
                $lookup: {
                    from: "warehouses",
                    localField: "warehouse_ref",        // Reference to warehouse
                    foreignField: "_id",                // Match on warehouse _id
                    as: "warehouse_ref",                // Store result here
                },
            },
            // Lookup to populate user_ref from User collection
            {
                $lookup: {
                    from: "users",
                    localField: "user_ref",             // Reference to user
                    foreignField: "_id",                // Match on user _id
                    as: "user_ref",                     // Store result here
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "delivery_boy",         // Reference to delivery_boy
                    foreignField: "_id",                // Match on user _id
                    as: "delivery_boy",                 // Store result here
                },
            },
            // Re-map the products array so each product_ref is a single Product doc
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$products",
                            as: "oneProduct",
                            in: {
                                $mergeObjects: [
                                    // Keep all original fields in "oneProduct"
                                    "$$oneProduct",
                                    // Overwrite product_ref with the fully populated doc
                                    {
                                        product_ref: {
                                            // $arrayElemAt with $filter ensures we get a single matching doc
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$populatedProducts",
                                                        as: "popProd",
                                                        cond: { $eq: ["$$oneProduct.product_ref", "$$popProd._id"] },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            // We no longer need "populatedProducts" after merging
            {
                $project: {
                    populatedProducts: 0,
                },
            },
            // Optionally, you can include other fields in your projection
            {
                $project: {
                    warehouse_ref: 1,
                    user_ref: 1,
                    products: 1,
                    delivery_boy: 1,
                    order_status: 1,
                    user_address: 1,
                    user_contact_number: 1,
                    user_location: 1,
                    otp: 1,
                    order_placed_time: 1,
                    out_for_delivery_time: 1,
                    packing_time: 1,
                    completed_time: 1,
                    failed_time: 1,
                    payment_type: 1,
                    total_amount: 1,
                    total_saved: 1,
                    discount_price: 1,
                    profit: 1,
                    payment_id: 1,
                    type_of_delivery: 1,
                    selected_time_slot: 1,
                    delivery_charge: 1,
                    delivery_instructions: 1,
                    created_time: 1,
                    numberOfProducts: 1,
                },
            },
        ]);
        console.log(orders);
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const sourceLatitude = warehouse.warehouse_location.lat;
        const sourceLongitude = warehouse.warehouse_location.lng;
        const toleranceDistance = 1000;
        const destinations = orders.map(order => [order.user_location.lat, order.user_location.lang, order._id]);
        // res.status(200).json({ success: true, data: orders,sourceLatitude, sourceLongitude, destinations, toleranceDistance });
        //  const { sourceLatitude, sourceLongitude, destinations, toleranceDistance } = req.body;

        if (!sourceLatitude || !sourceLongitude || !Array.isArray(destinations) || destinations.length === 0 || toleranceDistance === undefined) {
            return res.status(400).json({ error: 'Invalid request parameters.' });
        }
        let distanceSource = [];
        for (const destination of destinations) {
            const [destLatitude, destLongitude, orderId] = destination;
            const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${sourceLatitude},${sourceLongitude}&destination=${destLatitude},${destLongitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
            const response = await axios.get(directionsUrl);
            distanceSource.push({
                // url: directionsUrl,
                latitude: destLatitude,
                longitude: destLongitude,
                orderId,
                distance: response.data.routes[0].legs[0].distance.value,
                // geocoded_waypoints: response.data.geocoded_waypoints,
                // legs: response.data.routes[0].legs,
                allocated: false
            });
        }
        let unallocatedItems = distanceSource.filter(item => !item.allocated);
        const closestUnallocated = unallocatedItems.length > 0
            ? unallocatedItems.reduce((closest, current) =>
                current.distance < closest.distance ? current : closest
            )
            : null;
        closestUnallocated.allocated = true;
        const routes = [[closestUnallocated]];

        unallocatedItems = distanceSource.filter(item => !item.allocated);
        while (unallocatedItems.length !== 0) {
            let lastRoute = routes[routes.length - 1][routes[routes.length - 1].length - 1];
            console.log("loop 1 lastRoute", lastRoute, "unallocatedItems", unallocatedItems)
            let routeDistances = [];
            for (const item of unallocatedItems) {
                const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${lastRoute.latitude},${lastRoute.longitude}&destination=${item.latitude},${item.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
                const response = await axios.get(directionsUrl);
                routeDistances.push({
                    latitude: item.latitude,
                    longitude: item.longitude,
                    orderId: item.orderId,
                    distance: response.data.routes[0].legs[0].distance.value,
                    allocated: false
                });
            }
            const closestUnallocated = routeDistances.length > 0
                ? routeDistances.reduce((closest, current) =>
                    current.distance < closest.distance ? current : closest
                )
                : null;
            closestUnallocated.allocated = true;
            routeDistances = routeDistances.find(item => item.latitude === closestUnallocated.latitude && item.longitude === closestUnallocated.longitude).allocated = true;
            distanceSource.find(item => item.latitude === closestUnallocated.latitude && item.longitude === closestUnallocated.longitude).allocated = true;
            routes[routes.length - 1].push(closestUnallocated);
            unallocatedItems = distanceSource.filter(item => !item.allocated);
            console.log("routes", routes, "distanceSource", distanceSource, "unallocatedItems", unallocatedItems)
            // console.log("routes", routes, "distanceSource", distanceSource)
            let runLoop = true;
            while (runLoop && unallocatedItems.length !== 0) {
                let lastRoute = routes[routes.length - 1][routes[routes.length - 1].length - 1];
                // console.log("loop 2 lastRoute", lastRoute)
                let routeDistances = [];
                for (const item of unallocatedItems) {
                    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${lastRoute.latitude},${lastRoute.longitude}&destination=${item.latitude},${item.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
                    const response = await axios.get(directionsUrl);
                    if (response.data.status === 'OK') {
                        routeDistances.push({
                            latitude: item.latitude,
                            longitude: item.longitude,
                            orderId: item.orderId,
                            distance: response.data.routes[0].legs[0].distance.value,
                            allocated: false,
                            allocatable: response.data.routes[0].legs[0].distance.value <= toleranceDistance
                        });
                    } else {
                        routeDistances.push({
                            latitude: item.latitude,
                            longitude: item.longitude,
                            orderId: item.orderId,
                            // distance: response.data.routes[0].legs[0].distance.value,
                            distance: null,
                            allocated: false,
                            allocatable: false
                        });
                    }
                }
                const allNonAllocatable = routeDistances.every(item => !item.allocated && !item.allocatable);

                if (allNonAllocatable) {

                    runLoop = false;
                    let unallocatedItems = distanceSource.filter(item => !item.allocated);
                    const closestUnallocated = unallocatedItems.length > 0
                        ? unallocatedItems.reduce((closest, current) =>
                            current.distance < closest.distance ? current : closest
                        )
                        : null;
                    if (unallocatedItems.length === 0) {
                        runLoop = false
                        continue;
                    }
                    closestUnallocated.allocated = true;
                    routes.push([closestUnallocated]);
                    unallocatedItems = distanceSource.filter(item => !item.allocated);
                    distanceSource.find(item => item.latitude === closestUnallocated.latitude && item.longitude === closestUnallocated.longitude).allocated = true;
                    console.log("routes 22 ", routes, "unallocatedItems", unallocatedItems)


                    continue;

                }
                // console.log("routeDistances", routeDistances)
                const validDistances = routeDistances.filter(item =>
                    item.allocatable &&
                    typeof item.distance === 'number'
                );

                let closestUnallocated;
                if (validDistances.length > 0) {
                    closestUnallocated = validDistances.reduce((closest, current) =>
                        current.distance < closest.distance ? current : closest
                    );
                }
                // console.log("closestUnallocated", closestUnallocated)
                if (closestUnallocated) {
                    closestUnallocated.allocated = true;
                    routes[routes.length - 1].push(closestUnallocated);
                    distanceSource.find(item => item.latitude === closestUnallocated.latitude && item.longitude === closestUnallocated.longitude).allocated = true;

                    unallocatedItems = distanceSource.filter(item => !item.allocated);
                    console.log("routes 11 ", routes, "unallocatedItems", unallocatedItems)
                }
                distanceSource.find(item => item.latitude === closestUnallocated.latitude && item.longitude === closestUnallocated.longitude).allocated = true;

            }
            unallocatedItems = distanceSource.filter(item => !item.allocated);
        }
        let routeOptimisation = [];
        for (const route of routes) {
            const tempRoute = route;
            console.log("tempRoute", tempRoute.length, "route", route)

            if (route.length > 1) {

                // const waypoints = route.slice(0, -1).map((dest) => `${dest.lat},${dest.lng}`);
                // const waypoints = route.slice(0, -1).map(dest => {
                //   const location = `${dest.latitude},${dest.longitude}`;
                //   const stopover = true;
                //   return { location, stopover };
                // });
                // console.log("waypoints", waypoints)
                const intermediatePoints = route.slice(0, -1);
                console.log("intermediatePoints", intermediatePoints)
                const waypointsString = intermediatePoints
                    .map(dest => `${dest.latitude},${dest.longitude}`)
                    .join('|');
                console.log("waypointsString", waypointsString)
                const waypointParam = waypointsString
                    ? `&waypoints=optimize:true|${waypointsString}`
                    : '';
                console.log("waypointParam", waypointParam)
                const response = await axios.get(
                    `https://maps.googleapis.com/maps/api/directions/json?` +
                    `origin=${sourceLatitude},${sourceLongitude}` +
                    `&destination=${tempRoute[tempRoute.length - 1].latitude},${tempRoute[tempRoute.length - 1].longitude}` + // Return to origin
                    waypointParam +
                    // `&waypoints[]:${waypoints}` +
                    // `&optimizeWaypoints:true` +
                    `&key=${process.env.GOOGLE_MAPS_API_KEY}`
                );
                console.log("map URL ", `https://maps.googleapis.com/maps/api/directions/json?` +
                    `origin=${sourceLatitude},${sourceLongitude}` +
                    `&destination=${tempRoute[tempRoute.length - 1].latitude},${tempRoute[tempRoute.length - 1].longitude}` + // Return to origin
                    waypointParam +
                    // `&waypoints[]:${waypoints}` +
                    `&optimizeWaypoints:true` +
                    `&key=${process.env.GOOGLE_MAPS_API_KEY}`)

                if (response.data.status === 'OK') {
                    console.log("response", response.data)
                    const optimizedOrder = response.data.routes[0].waypoint_order;
                    const optimizedDestinations = optimizedOrder.map(index => route[index]);
                    console.log("optimizedDestinations", optimizedDestinations)
                    let totalDistance = 0;
                    let totalDuration = 0;

                    response.data.routes[0].legs.forEach(leg => {
                        totalDistance += leg.distance.value;
                        totalDuration += leg.duration.value;
                    });

                    // Generate Google Maps URL
                    const mapsUrl = `https://www.google.com/maps/dir/?api=1` +
                        `&origin=${sourceLatitude},${sourceLongitude}` +
                        `&destination=${tempRoute[tempRoute.length - 1].latitude},${tempRoute[tempRoute.length - 1].longitude}` +
                        `&waypoints=${optimizedDestinations.map(d => `${d.latitude},${d.longitude}`).join('|')}` +
                        `&travelmode=driving` +
                        `&dir_action=navigate`;
                    console.log("mapsUrl", mapsUrl, "route", route)

                    routeOptimisation.push({
                        distance: totalDistance,
                        duration: totalDuration,
                        waypoints: optimizedDestinations,
                        mapsUrl: mapsUrl,
                        route: tempRoute
                    });
                }
            } else {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1` +
                    `&origin=${sourceLatitude},${sourceLongitude}` +
                    `&destination=${tempRoute[tempRoute.length - 1].latitude},${tempRoute[tempRoute.length - 1].longitude}` +
                    // `&waypoints=${optimizedDestinations.map(d => `${d.lat},${d.lng}`).join('|')}` +
                    `&travelmode=driving` +
                    `&dir_action=navigate`;

                routeOptimisation.push({
                    distance: tempRoute[0].distance,
                    duration: 0,
                    // waypoints: optimizedDestinations,
                    mapsUrl: mapsUrl,
                    route: tempRoute
                });
            }

        }
        const orderRoute = new OrderRoute({
            warehouse_ref: warehouse._id,
            tum_tumdelivery_start_time: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").startOf('hour').local().toDate(),
            tumtumdelivery_end_time: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").endOf('hour').local().toDate(),
            route: routeOptimisation.map(route => ({
                orders: route.route.map(order => order.orderId),
                map_url: route.mapsUrl
            })),

        })
        await orderRoute.save();
        // res.json({ distanceSource, routes, routeOptimisation });
        // res.status(200).json({ success: true, data: orders });
        res.status(200).json({ success: true, message: "Order route created successfully", data: orderRoute });
    } catch (error) {
        console.error("Error creating order route:", error);
        res.status(500).json({ message: "Failed to create order route", error: error.message });
    }
};

exports.assignDeliveryBoys = async (req, res) => {
    try {
        const { orderRouteId, routeId, deliveryBoyId } = req.body;
        const orderRoute = await OrderRoute.findById(orderRouteId).exec();
        if (!orderRoute) {
            return res.status(404).json({ success: false, message: "Order route not found" });
        }
        const route = orderRoute.route.find(route => route._id.equals(routeId)).assigned_delivery_boy = deliveryBoyId;
        if (!orderRoute.assigned_delivery_boy?.some(w => w.toString() === deliveryBoyId.toString())) {
            orderRoute.assigned_delivery_boy.push(deliveryBoyId);
        }
        const updateRoute = orderRoute.route.find(route => route._id.equals(routeId));
        await Promise.all(updateRoute.orders.map(async (orderId) => {
            const order = await Order.findById(orderId).exec();
            order.delivery_boy = deliveryBoyId;
            order.order_status = "Out for delivery",
            order.out_for_delivery_time = new Date();
            await order.save();
        }))


        await orderRoute.save();

        const  deliveryOrders=(updateRoute.orders.map(order => {
            return {
                orderId: order,
                status: "Pending"
            }
        }))
        const deliveryAssignment= new DeliveryAssignment({
            orderRoute_ref: orderRouteId,
            route_id: routeId,
            tum_tumdelivery_start_time: orderRoute.tum_tumdelivery_start_time,
            tumtumdelivery_end_time: orderRoute.tumtumdelivery_end_time,
            map_url: updateRoute.map_url,
            delivery_boy_ref: deliveryBoyId,
            orders: deliveryOrders
            
        })
        await deliveryAssignment.save();
        res.status(200).json({ success: true, message: "Delivery boys assigned successfully", data: orderRoute });
    } catch (error) {
        console.error("Error assigning delivery boys:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};