import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const Support = new Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "superAdmin",
    },
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    TicketNumber: {
      type: Number,
      required: true,
    },
    reason: {
        type: [String],
        required: true,
        enum: ["Technical Issues", "Payment Issues", "Account Issues", "Other"],
        default: ["Pending"],
      },
      Description: {
        type: String,
        required: true,
      },
    status: {
      type: [String],
      required: true,
      enum: ["Pending", "In-Progress", "Resolved"],
      default: ["Pending"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("support", Support);
