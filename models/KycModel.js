import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const KycModel = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    dob: {
      type: String,
      required: true,
    },
    identity_back: {
      type: String,
      required: true,
    },
    identity_front: {
      type: String,
      required: true,
    },
    ssn_last_4: {
      type: Number,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    addressLine: {
      type: String,
      required: true,
    },
    postalCode: {
      type: Number,
      required: true,
    },
    accountID: {
      type: String,
      default: "",
    },
    cardID: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    status: {
      type: [String],
      enum: ["Pending", "Completed", "Rejected"],
      default: ["Pending"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("Kyc", KycModel);
