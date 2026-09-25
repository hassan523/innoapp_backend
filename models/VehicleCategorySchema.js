
import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const VehicleCategorySchema = new Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "superAdmin",
    },
    CategoryName: {
      type: String,
      required: true,
    },   
    Thumnail: {
      type: String,
       default: ''
    },   
   
  },
  {
    timestamps: true,
  }
);

export default model("VehicleCategory", VehicleCategorySchema);
