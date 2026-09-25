import mongoose from "mongoose";
const { Schema } = mongoose;

const RatingReviewSchema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    DriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    RideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ridebooking",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default:1
    },
    review: {
        type: String,
        default:"No Review"
      },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("RatingReviews", RatingReviewSchema);
