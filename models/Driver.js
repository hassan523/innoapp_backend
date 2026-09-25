import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const Driver = new Schema(
  {
    AdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
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
    // cordinates:{
    //   latitude:{
    //     type: Number,
    //     default:0
    //   },
    //   longitude:{
    //     type: Number,
    //     default:0
    //   },
    // },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number],
    },
    
    IsOnline: {
      type: Boolean,
      default: false,
    },
    carAssingned: {
      type: Boolean,
      default: false,
    }, 

    role: {
      type: [String],
      required: true,
      enum: ["Driver"],
      default: ["Driver"],
    },
  },
  {
    timestamps: true,
  }
);

Driver.index({ location: "2dsphere" });


export default model("Driver", Driver);
