// orderScheduler.js  (Packing-only, no length-1 cap)
/* eslint-disable no-console */
require("dotenv").config();
const cron = require("node-cron");
const mongoose = require("mongoose");
const admin = require("firebase-admin");

const Order = require("../models/order_model");
const User = require("../models/user_models");

////////////////////  CONFIG  ////////////////////
const MONGODB_URI = process.env.MONGODB_URI;
const MAX_PER_AGENT = 5; // max open instant orders
const BUNDLE_WINDOW_MIN = 5; // minutes to bundle with same rider
const BUNDLE_RADIUS_KM = 1.5; // km radius for bundling
const PACKING_TIME_LIMIT = 15; // minutes before re-assign
//////////////////////////////////////////////////

/* ────────────────────────────────────────────── */
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
/* ────────────────────────────────────────────── */
mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("[Scheduler] Mongo connected."))
    .catch((err) => {
        console.error("[Scheduler] Mongo connection failed", err);
        process.exit(1);
    });
/* ────────────────────────────────────────────── */
const toRad = (d) => (d * Math.PI) / 180;
const distanceKm = (a, b) => {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};
/* ────────────────────────────────────────────── */
async function assignInstantOrders() {
    console.log("\n==============================");
    console.log(`[Scheduler] Tick @ ${new Date().toISOString()}`);

    try {
        /* 1️⃣ fetch only Packing instant orders */
        const orders = await Order.find({
            type_of_delivery: "instant",
            order_status: "Packing",
            $or: [
                { delivery_boy: null },
                {
                    packing_time: {
                        $lte: new Date(Date.now() - PACKING_TIME_LIMIT * 60_000),
                    },
                },
            ],
        })
            .sort({ packing_time: 1 })
            .limit(100);

        console.log(`[Scheduler] Found ${orders.length} orders needing assignment`);

        for (const order of orders) {
            console.log(`[Order] ${order._id}`);

            /* 2️⃣ eligible riders – 🚫 no $size filter anymore */
            const riders = await User.find({
                is_deliveryboy: true,
                is_blocked: false,
                deliveryboy_day_availability_status: true,
                "deliveryboy_order_availability_status.instant.status": true,
                $or: [
                    { assigned_warehouse: order.warehouse_ref },
                    { selected_warehouse: order.warehouse_ref },
                ],
                $expr: { $lt: [{ $size: "$assigned_orders" }, 5] }
            });

            if (!riders.length) {
                console.log("[Order] ❌ No available riders");
                continue;
            }

            /* 3️⃣ choose rider */
            let chosen = null;
            const windowStart = new Date(Date.now() - BUNDLE_WINDOW_MIN * 60_000);

            for (const rider of riders) {
                const active = await Order.find({
                    delivery_boy: rider._id,
                    type_of_delivery: "instant",
                    order_status: { $in: ["Packing", "Out for delivery"] },
                });

                if (active.length >= MAX_PER_AGENT) continue;

                const recent = active.filter((o) => o.created_time >= windowStart);
                if (recent.length) {
                    const nearest = recent.reduce(
                        (best, cur) =>
                            distanceKm(
                                { lat: cur.user_location.lat, lng: cur.user_location.lang },
                                { lat: order.user_location.lat, lng: order.user_location.lang }
                            ) <
                                (best
                                    ? distanceKm(
                                        {
                                            lat: best.user_location.lat,
                                            lng: best.user_location.lang,
                                        },
                                        {
                                            lat: order.user_location.lat,
                                            lng: order.user_location.lang,
                                        }
                                    )
                                    : Infinity)
                                ? cur
                                : best,
                        null
                    );

                    if (
                        nearest &&
                        distanceKm(
                            {
                                lat: nearest.user_location.lat,
                                lng: nearest.user_location.lang,
                            },
                            { lat: order.user_location.lat, lng: order.user_location.lang }
                        ) <= BUNDLE_RADIUS_KM
                    ) {
                        chosen = rider;
                        break;
                    }
                }
                if (!chosen) chosen = rider; // first rider with spare capacity
            }

            if (!chosen) {
                console.log("[Order] ❌ No suitable rider after checks");
                continue;
            }

            /* 4️⃣ transaction – assign order & update rider */
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const updated = await Order.findOneAndUpdate(
                    { _id: order._id },
                    {
                        delivery_boy: chosen._id,
                        order_status: "Delivery Partner Assigned",
                        packing_time: new Date(),
                    },
                    { new: true, session }
                );
                if (!updated) throw new Error("Order update failed");

                await User.updateOne(
                    { _id: chosen._id },
                    {
                        $set: {
                            "deliveryboy_order_availability_status.instant.last_assigned_at":
                                new Date(),
                        },
                        $push: {
                            assigned_orders: {
                                order_ref: updated._id,
                                assigned_time: new Date(),
                                status: "assigned",
                            },
                        },
                    },
                    { session }
                );
                await session.commitTransaction();
                console.log(`[✔] Order ${updated._id} → ${chosen.displayName}`);

                if (chosen.fcm_token) {
                    admin
                        .messaging()
                        .send({
                            token: chosen.fcm_token,
                            notification: {
                                title: "New Instant Order",
                                body: `Order #${updated._id} added to your route`,
                            },
                            data: { orderId: updated._id.toString(), type: "instant" },
                        })
                        .catch((err) => console.error("[Notify] Failed:", err.message));
                }
            } catch (e) {
                await session.abortTransaction();
                console.error("[Transaction] Failed:", e.message);
            } finally {
                session.endSession();
            }
        }
    } catch (err) {
        console.error("[Scheduler] Loop error:", err);
    }

    console.log("[Scheduler] Tick complete.");
}
/* ────────────────────────────────────────────── */
cron.schedule("*/1 * * * *", () =>
    assignInstantOrders().catch((e) => console.error("[Scheduler] Fatal:", e))
);

module.exports = {
    assignInstantOrders,
}; // harmless import