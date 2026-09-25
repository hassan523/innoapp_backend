import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const Vehicles = new Schema(
  {
    VehicleCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleCategory",
    },
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
     vehicleImages: {
      type: [String],
        default: ['']
    },   
    vin: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default:null
    },
    class: {
      type: String,
      default:null
    },
    region: {
      type: String,
      required: true,
    },
    wmi: {
      type: String,
      required: true,
    },

    vds: {
      type: String,
      required: true,
    },
    vis: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    // salman ne bola hay
    description: {
      type: String,
    },
    asingmenttype: {
      type: [String],
      enum: ["Public", "Private"],
      default: ["Public"],
    },
    // for driver Assigned in Public
    IsAsigned: {
      type: String,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Vehicles", Vehicles);
