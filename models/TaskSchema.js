import mongoose from "mongoose";
const { Schema, model } = mongoose;

const TaskSchema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    TeamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teamlead",
    },
    assignedToID: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "type", 
      default: null,
    },
    type: {
      type: String,
      enum: ["Inspector", "Cleaner", null],
      required: true,
    },
    task_name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    Vin_no: {
      type: String,
      required: true,
    },
    from_date: {
      type: Date,
      required: true,
    },
    due_date: {
      type: Date,
      required: true,
    },
    completed_date: {
      type: Date,
      default: null,
    },
    task_status: {
      type: [String],
      enum: ["Ongoing", "Assigned","Re-Assigned","Review", "Completed"],
      default: ["Ongoing"],
      required: true,
    },
    isAssigned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


export default model("Task", TaskSchema); // "Task" as the collection name
