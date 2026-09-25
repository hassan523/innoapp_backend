import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const SubscriptionSchema = new Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "superAdmin",
    },
    PerAdminPrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    PerTeamLeadPrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    PerDriverPrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    PerInspectorPrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    PerCleanerPrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    PerInspectionReportPrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    PerCleaningReportPrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    PerVehiclePrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    RideFeturePrice: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],
    ParcelDeliveryFeature: [{
      monthly_price: {
        type: Number,
       default: 0,
      },
      yearly_price: {
        type: Number,
       default: 0,
      },
      discounted_price_Monthly: {
        type: Number,
       default: 0,
      },
      discounted_price_yearly: {
        type: Number,
       default: 0,
      },
    }],

  },
  {
    timestamps: true,
  }
);

export default model("Subscription", SubscriptionSchema);
