import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const RateListSchema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    categoryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleCategory",
    },
    ratepermile:{
      type:Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("RateList", RateListSchema);