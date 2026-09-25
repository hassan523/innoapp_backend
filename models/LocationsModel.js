import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const LocationsModel = new Schema(
  {
    location: {
      type: {
        type: String,
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    distance: {
      type: Number,
    },
    address: {
      type: String,
      required: true,
    },
    locationType: {
      enum: ["RideBooking", "ParcelBooking"],
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

LocationsModel.index({ location: "2dsphere" });

export default model("locations", LocationsModel);
