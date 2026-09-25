import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const Inspector = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    TeamleadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teamlead",
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps"
    },
    password: {
      type: String,
      required: true,
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: [String],
      required: true,
      enum: ["Inspector"],
      default: ["Inspector"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("Inspector", Inspector);