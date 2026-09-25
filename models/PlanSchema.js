import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const PlanSchema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscriptions",
    },
    price: {
      type: Number,
      default: null,
    },
    type: {
      type: String,
      required: true,
    },
    expirydate: {
      type: Date,
      default: null,
    },
    TeamLeadQuantity: {
      type: String,
      required: true,
    },
    DriverQuantity: {
      type: String,
      required: true,
  },
    InspectorQuantity: {
      type: String,
      required: true,
    },
    CleanerQuantity: {
      type: String,
      required: true,
    },
    InspectionReportQuantity: {
      type: String,
      required: true,
    },
    CleaningReportQuantity: {
      type: String,
      required: true,
    },
    VehicleQuantity: {
      type: String,
      required: true,
    },
    RideFeture: {
      type: String,
      required: true,
    },
    ParcelDeliveryFeature: {
      type: String,
      required: true,
    },
    isActive : {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

export default model("plan", PlanSchema);
