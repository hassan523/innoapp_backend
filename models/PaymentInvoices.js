import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const PaymentInvoices = new Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    DriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ridebooking",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    rideType: {
      type: String,
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    receivingAccount: {
      type: String,
      required: true,
    },
    paidByUser: {
      type: String,
      required: true,
    },
    platformFee: {
      type: String,
      required: true,
    },
    totalReceiving: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("PaymentInvoices", PaymentInvoices);
