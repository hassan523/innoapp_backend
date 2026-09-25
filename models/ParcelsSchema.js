import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const ParcelsSchema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    VehcileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicles",
      default: null,
    },
    VehicleCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleCategory",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    miles: {
      type: Number,
      required: true,
    },
    OTp: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
    },
    farePrice: {
      type: Number,
      required: true,
    },
    status: {
      type: [String],
      enum: ["pending", "delivering", "accepted", "completed", "cancelled"],
      default: "pending",
    },
    ReciverName: {
      type: String,
      required: true,
    },
    Reciverphone: {
      type: String,
      required: true,
    },
    ReciverSecondaryPhone: {
      type: String,
      required: false,
    },
    proofOfDelivery: {
      type: String,
      required: false,
    },
    Value: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add geospatial index to origin and destination fields for efficient querying
ParcelsSchema.index({ "origin.coordinates": "2dsphere" });
ParcelsSchema.index({ "destination.coordinates": "2dsphere" });

export default model("Parcels", ParcelsSchema);
