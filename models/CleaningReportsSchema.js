import mongoose from "mongoose";
const { Schema } = mongoose;

const CleaningReportSchema = new Schema(
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
    CleanerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cleaner",
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
    Description: {
      type: String,
    },
    remarks: {
      type: String,
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

export default mongoose.model("CleaningReport", CleaningReportSchema);
