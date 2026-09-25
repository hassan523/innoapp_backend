import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const Admin = new Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "superAdmin",
    },
    email: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
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
    profileImage: {
      type: String,
      default:
        "https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps",
    },
    password: {
      type: String,
      required: true,
    },
    IsActive: {
      type: Boolean,
      default: true,
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
    kycVerification: {
      type: [String],
      enum: ["Not-submited","Pending", "Completed", "Rejected"],
      default: ["Not-submited"],
    },
    role: {
      type: [String],
      required: true,
      enum: ["Admin"],
      default: ["Admin"],
    },
    InvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "plan",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Admin", Admin);
