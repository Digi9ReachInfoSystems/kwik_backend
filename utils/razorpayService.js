const Razorpay = require('razorpay')
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAYKEY_ID_DEV,//developmet
    // key_id:'rzp_live_nmEtTvImeXIvf7',//production
    key_secret: process.env.RAZORPAYKEY_SECRET_DEV, //developmet
    // key_secret:'u4QbAJziwXhGYmdFWamz2KkZ',//production
    course_payment:'FPs-kRnkuFXq8tG-course-Payment',
    custom_packages:'bq3es79LTfQn.SH-custom-package',
})

module.exports = razorpayInstance;