import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const Users = new Schema(
  {
    customerID: {
      type: String,
      default: "",
    },
    paymentMethodID: {
      type: String,
      default: "",
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
      default:
        "https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps",
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: Number,
    },
    otpExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    cordinates: {
      latitude: {
        type: Number,
        default: 0,
      },
      longitude: {
        type: Number,
        default: 0,
      },
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number],
    },

    role: {
      type: [String],
      required: true,
      enum: ["Users"],
      default: ["Users"],
    },
  },
  {
    timestamps: true,
  }
);

Users.index({ location: "2dsphere" });

export default model("Users", Users);
