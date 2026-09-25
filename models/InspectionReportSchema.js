import mongoose from "mongoose";
const { Schema } = mongoose;

const InspectionReportSchema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    TeamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teamlead",
      required: true,
    },
    InspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inspector",
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    vin: {
      type: String,
      required: true,
    },
    EngineCondition: {
      type: String,
      required: true,
    },
    BodyCondition: {
      type: String,
      required: true,
    },
    TiresCondition: {
      type: String,
      default: "Not Inspected",
    },
    BrakesCondition: {
      type: String,
      default: "Not Inspected",
    },
    LightsCondition: {
      type: String,
      default: "Not Inspected",
    },
    InteriorCondition: {
      type: String,
      default: "Not Inspected",
    },
    Description: {
      type: String,
    },
    remarks: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    valid: {
      type: [String],
      enum: ["applicable", "Not-Applicable"],
      default: ["applicable"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("InspectionReport", InspectionReportSchema);
