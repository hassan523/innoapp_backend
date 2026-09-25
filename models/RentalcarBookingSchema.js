
import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const RentalcarBooking = new Schema(
  {
     AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
     userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    Idetification_no: {
      type: String,
      required: true,
    },   
    name: {
      type: String,
      required: true,
    },
    contact_no: {
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
    from_date:{
        type: Date,
        required: true, 
    },
   to_date :{
        type: Date,
        required: true, 
    },
    location: {
        type: String,
        required: true,
      },
      outofcity: {
        type: Boolean,
        required: true,
      },
      bookingstatus: {
        type: [String],
        required: true,
        enum: ["Pending", "Accepted", "Declined","Ongoing", "Completed"],
        default: ["Pending"],
      },
   
  },
  {
    timestamps: true,
  }
);

export default model("RentalcarBooking", RentalcarBooking);
