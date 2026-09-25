import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const ParcelBidScehema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    DriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    ParcelBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcels",
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

export default model("ParcelBids", ParcelBidScehema);