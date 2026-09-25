import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const RidebookingSchema = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    VehcileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicles",
      default: null,
    },
    VehicleCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleCategory",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    // orgin: {
    //   latitude: {
    //     type: Number,
    //     required: true,
    //     validate: {
    //       validator: function (v) {
    //         return v >= -90 && v <= 90;
    //       },
    //       message: "Latitude must be between -90 and 90 degrees",
    //     },
    //   },
    //   longitude: {
    //     type: Number,
    //     required: true,
    //     validate: {
    //       validator: function (v) {
    //         return v >= -180 && v <= 180;
    //       },
    //       message: "Longitude must be between -180 and 180 degrees",
    //     },
    //   },
    //   originAddressLine: {
    //     type: String,
    //     required: true,
    //   },
    // },
    // destination: {
    //   latitude: {
    //     type: Number,
    //     required: true,
    //     validate: {
    //       validator: function (v) {
    //         return v >= -90 && v <= 90;
    //       },
    //       message: "Latitude must be between -90 and 90 degrees",
    //     },
    //   },
    //   longitude: {
    //     type: Number,
    //     required: true,
    //     validate: {
    //       validator: function (v) {
    //         return v >= -180 && v <= 180;
    //       },
    //       message: "Longitude must be between -180 and 180 degrees",
    //     },
    //   },
    //   destinationAddressLine: {
    //     type: String,
    //     required: true,
    //   },
    // },

    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "locations",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "locations",
    },

    miles: {
      type: Number,
      required: true,
    },
    OTp: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
    },
    farePrice: {
      type: Number,
      required: true,
    },
    status: {
      type: [String],
      enum: ["pending", "ongoing", "accepted", "completed", "cancelled"],
      default: "pending",
    },
    booking_type: {
      type: [String],
      enum: ["Instant", "Scheduled"],
      default: "Instant",
    },
    rideTime: {
      startDate: {
        type: Date,
        default: 0,
      },
      EndDate: {
        type: Date,
        default: 0,
      },
    },
    // this field is use for sheduling
    sheduled_date: {
      startDate: {
        type: Date,
        default: 0,
      },
      EndDate: {
        type: Date,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);


RidebookingSchema.index({ location: "2dsphere" });

export default model("Ridebooking", RidebookingSchema);
