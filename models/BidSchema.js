import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const BidScehema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    DriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    RideBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ridebooking",
    },
    VehicleId : {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicles",
    },
    bidamount:{
      type:Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Bids", BidScehema);