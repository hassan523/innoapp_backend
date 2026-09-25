import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const VehicleAsingment = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    DriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    VinNumber:{
        type:String,
        required:true
    },
    Active:{
        type:Boolean,
        default:true
    },
    createdate:{
      type:String,
      required: true,
    },
    expirydate:{
      type:String,
    },
  },
  {
    timestamps: true,
  }
);

export default model("VehicleAsingment", VehicleAsingment);
