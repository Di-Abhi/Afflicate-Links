const Razorpay = require('razorpay');
const crypto = require('crypto');
const { CREDIT_PACKS } = require('../constants/payments');
const Users = require('../model/Users');

const razorpay=new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentController = {

    createOrder: async (request, response)=>{
        try {
            const {credits}= request.body;
            //make sure user provided credits of the allowed values
            if(!CREDIT_PACKS[credits]){
                return response.status(400).json({
                    message: "Unsupported credit value"
                });
            }
            const amount = CREDIT_PACKS[credits] * 100; // Convert to paise

            const order = await razorpay.orders.create({
                amount: amount,
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            });
            response.json({
                order:order
            });

        }catch(error){
            console.error(error);
            response.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    },
    verifyOrder: async (request,response)=>{
        try{
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                credits
            }= request.body;
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString()).digest('hex');


                if(expectedSignature !== razorpay_signature){
                    return response.status(400).json({
                        message: "Invalid Signature"
                    });
                }

                const user = await Users.findById({_id: request.user._id});
                user.credits += Number(credits);
                await user.save();
                response.json({user :user});
        }catch(error){
            console.error(error);
            response.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
}
module.exports = paymentController;