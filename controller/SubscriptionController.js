import Admin from "../models/Admin.js";
import SuperAdmin from "../models/SuperAdmin.js";
import SubscriptionSchema from "../models/SubscriptionSchema.js";
import PlanSchema from "../models/PlanSchema.js";
import stripe from "../utils/StripeConfig.js";
import Teamlead from "../models/Teamlead.js";
import Driver from "../models/Driver.js";
import Inspector from "../models/Inspector.js";
import Cleaner from "../models/Cleaner.js";
import InspectionReportSchema from "../models/InspectionReportSchema.js";
import CleaningReportsSchema from "../models/CleaningReportsSchema.js";
import Vehicles from "../models/Vehicles.js";

import KycModel from "../models/KycModel.js";

//for Super Admin
const Create_Subscription = async (req, res) => {
  try {
    const { SuperAdminId } = req.params;

    const findSuperAdmin = await SuperAdmin.findById(SuperAdminId);

    if (!findSuperAdmin) {
      return res.status(400).json({ message: "Supper Admin Not Found!" });
    }
    const {
      PerAdminPrice,
      PerTeamLeadPrice,
      PerDriverPrice,
      PerInspectorPrice,
      PerCleanerPrice,
      PerInspectionReportPrice,
      PerCleaningReportPrice,
      PerVehiclePrice,
      RideFeturePrice,
      ParcelDeliveryFeature,
    } = req.body;

    if (
      !PerAdminPrice ||
      !PerTeamLeadPrice ||
      !PerDriverPrice ||
      !PerInspectorPrice ||
      !PerCleanerPrice ||
      !PerInspectionReportPrice ||
      !PerCleaningReportPrice ||
      !PerVehiclePrice ||
      !RideFeturePrice ||
      !ParcelDeliveryFeature
    ) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    const newSubscription = new SubscriptionSchema({
      superAdminId: findSuperAdmin._id,
      PerAdminPrice,
      PerTeamLeadPrice,
      PerDriverPrice,
      PerInspectorPrice,
      PerCleanerPrice,
      PerInspectionReportPrice,
      PerCleaningReportPrice,
      PerVehiclePrice,
      RideFeturePrice,
      ParcelDeliveryFeature,
    });

    await newSubscription.save();

    return res.status(201).json({
      message: "Subscription rates set successfully!",
      data: newSubscription,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};
//for Super Admin
const UpdateRateSetforAdmins = async (req, res) => {
  try {
    const { SuperAdminId, subscriptionId } = req.params;

    const findSuperAdmin = await SuperAdmin.findById(SuperAdminId);

    if (!findSuperAdmin) {
      return res.status(400).json({ message: "Supper Admin Not Found!" });
    }

    const {
      PerAdminPrice,
      PerTeamLeadPrice,
      PerDriverPrice,
      PerInspectorPrice,
      PerCleanerPrice,
      PerInspectionReportPrice,
      PerCleaningReportPrice,
      PerVehiclePrice,
      RideFeturePrice,
      ParcelDeliveryFeature,
    } = req.body;

    const existingSubscription = await SubscriptionSchema.findById(
      subscriptionId
    );
    if (!existingSubscription) {
      return res.status(404).json({ message: "Subscription not found!" });
    }

    let updateFields = {};
    if (PerAdminPrice) updateFields.PerAdminPrice = PerAdminPrice;
    if (PerTeamLeadPrice) updateFields.PerTeamLeadPrice = PerTeamLeadPrice;
    if (PerDriverPrice) updateFields.PerDriverPrice = PerDriverPrice;
    if (PerInspectorPrice) updateFields.PerInspectorPrice = PerInspectorPrice;
    if (PerCleanerPrice) updateFields.PerCleanerPrice = PerCleanerPrice;
    if (PerInspectionReportPrice)
      updateFields.PerInspectionReportPrice = PerInspectionReportPrice;
    if (PerCleaningReportPrice)
      updateFields.PerCleaningReportPrice = PerCleaningReportPrice;
    if (PerVehiclePrice) updateFields.PerVehiclePrice = PerVehiclePrice;
    if (RideFeturePrice) updateFields.RideFeturePrice = RideFeturePrice;
    if (ParcelDeliveryFeature)
      updateFields.ParcelDeliveryFeature = ParcelDeliveryFeature;

    const updatedSubscription = await SubscriptionSchema.findByIdAndUpdate(
      subscriptionId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Subscription updated successfully!",
      data: updatedSubscription,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};
//for Super Admin
const get_Subscriptions = async (req, res) => {
  try {
    const Subscription = await SubscriptionSchema.find();

    return res.status(200).json({ message: "All Subscription", Subscription });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};
//for Admin
const AdminApplySubscription = async (req, res) => {
  try {
    const { AdminId, subscriptionId } = req.params;

    const {
      checkType,
      TeamLeadQuantity,
      DriverQuantity,
      InspectorQuantity,
      CleanerQuantity,
      InspectionReportQuantity,
      CleaningReportQuantity,
      VehicleQuantity,
      RideFeture,
      ParcelDeliveryFeature,
    } = req.body;

    const requiredFields = [
      { name: "checkType", value: checkType },
      { name: "TeamLeadQuantity", value: TeamLeadQuantity },
      { name: "DriverQuantity", value: DriverQuantity },
      { name: "InspectorQuantity", value: InspectorQuantity },
      { name: "CleanerQuantity", value: CleanerQuantity },
      { name: "InspectionReportQuantity", value: InspectionReportQuantity },
      { name: "CleaningReportQuantity", value: CleaningReportQuantity },
      { name: "VehicleQuantity", value: VehicleQuantity },
      { name: "RideFeture", value: RideFeture },
      { name: "ParcelDeliveryFeature", value: ParcelDeliveryFeature },
    ];

    const missingFields = requiredFields.filter(
      (field) => field.value === undefined || field.value === null
    );

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields
        .map((field) => field.name)
        .join(", ");
      console.log(`${missingFieldNames} Missing required fields!`);
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // Find Admin
    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "You cannot buy the package!" });
    }

    // Find Kyc
    const findKyc = await KycModel.findOne({ AdminId: AdminId });
    if (!findKyc) {
      return res.status(404).json({ message: "Kyc incompleted!" });
    }

    // Find Subscription
    const findSubscription = await SubscriptionSchema.findById(subscriptionId);
    if (!findSubscription) {
      return res.status(404).json({ message: "Subscription not found!" });
    }

    // Function to get correct price based on discount
    const getPrice = (item, type) => {
      if (!item || !item.length) return 0;
      return type === "monthly"
        ? item[0].discounted_price_Monthly > 0
          ? item[0].discounted_price_Monthly
          : item[0].monthly_price
        : item[0].discounted_price_yearly > 0
        ? item[0].discounted_price_yearly
        : item[0].yearly_price;
    };

    // Calculate total price
    const totalPrice =
      TeamLeadQuantity *
        getPrice(findSubscription.PerTeamLeadPrice, checkType) +
      DriverQuantity * getPrice(findSubscription.PerDriverPrice, checkType) +
      InspectorQuantity *
        getPrice(findSubscription.PerInspectorPrice, checkType) +
      CleanerQuantity * getPrice(findSubscription.PerCleanerPrice, checkType) +
      InspectionReportQuantity *
        getPrice(findSubscription.PerInspectionReportPrice, checkType) +
      CleaningReportQuantity *
        getPrice(findSubscription.PerCleaningReportPrice, checkType) +
      VehicleQuantity * getPrice(findSubscription.PerVehiclePrice, checkType) +
      (RideFeture ? getPrice(findSubscription.RideFeturePrice, checkType) : 0) +
      (ParcelDeliveryFeature
        ? getPrice(findSubscription.ParcelDeliveryFeature, checkType)
        : 0);

    const date = new Date();
    const currentMonth = date.getMonth();

    let expirydate;

    if (checkType === "monthly") {
      expirydate = new Date(date.setMonth(currentMonth + 1));
    } else if (checkType === "yearly") {
      expirydate = new Date(date.setFullYear(date.getFullYear() + 1));
    }

    // Create Payout
    // const payout = await stripe.payouts.create({
    //   amount: totalPrice,
    //   currency: "usd",
    //   method: "instant",
    //   source_type: findKyc.cardID,
    // });
    // console.log("Payout:", payout);
    // Then Create Billing History

    // Create Invoice and Save the Plan
    const savePlan = new PlanSchema({
      AdminId: findAdmin._id,
      subscriptionId: findSubscription._id,
      price: totalPrice,
      type: checkType,
      expirydate: expirydate,
      TeamLeadQuantity: TeamLeadQuantity,
      DriverQuantity: DriverQuantity,
      InspectorQuantity: InspectorQuantity,
      CleanerQuantity: CleanerQuantity,
      InspectionReportQuantity: InspectionReportQuantity,
      CleaningReportQuantity: CleaningReportQuantity,
      VehicleQuantity: VehicleQuantity,
      RideFeture: RideFeture,
      ParcelDeliveryFeature: ParcelDeliveryFeature,
    });

    await savePlan.save();

    findAdmin.InvoiceId = savePlan._id;
    await findAdmin.save();

    const Token = {
      ...findAdmin.toObject(),
      InvoiceId: savePlan,
    };

    return res.status(200).json({
      message: `Your plan has been purchased for ${checkType} successfully!`,
      // invoice: savePlan,
      Token: Token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};
//for Indivisual Admin
const getadminplan = async (req, res) => {
  try {
    const { AdminId } = req.params;
    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    } else {
      const findplan = await PlanSchema.find({ AdminId: AdminId });
      return res
        .status(200)
        .json({ message: "All Invoices of this Admin", findplan });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const AdminPurchasedSubscription = async (req, res) => {
  try {
    const { AdminId } = req.params;

    const [findAdmin, findplan, globalSubscription] = await Promise.all([
      Admin.findById(AdminId),
      PlanSchema.findOne({ AdminId }),
      SubscriptionSchema.find(),
    ]);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    if (!findplan) {
      return res.status(404).json({ message: "No Plan Found for this Admin!" });
    }

    const subscriptionPrices = globalSubscription[0];

    const schemaDetails = [
      {
        name: "TeamLeads",
        schema: Teamlead,
        quantityKey: "TeamLeadQuantity",
        priceKey: "PerTeamLeadPrice",
      },
      {
        name: "Drivers",
        schema: Driver,
        quantityKey: "DriverQuantity",
        priceKey: "PerDriverPrice",
      },
      {
        name: "Inspectors",
        schema: Inspector,
        quantityKey: "InspectorQuantity",
        priceKey: "PerInspectorPrice",
      },
      {
        name: "Cleaners",
        schema: Cleaner,
        quantityKey: "CleanerQuantity",
        priceKey: "PerCleanerPrice",
      },
      {
        name: "InspectionReports",
        schema: InspectionReportSchema,
        quantityKey: "InspectionReportQuantity",
        priceKey: "PerInspectionReportPrice",
      },
      {
        name: "CleaningReports",
        schema: CleaningReportsSchema,
        quantityKey: "CleaningReportQuantity",
        priceKey: "PerCleaningReportPrice",
      },
      {
        name: "Vehicles",
        schema: Vehicles,
        quantityKey: "VehicleQuantity",
        priceKey: "PerVehiclePrice",
      },
    ];

    const countPromises = schemaDetails.map(({ schema, quantityKey }) =>
      schema
        .countDocuments({ AdminId })
        .then((count) => ({ count, quantityKey }))
    );

    const counts = await Promise.all(countPromises);

    const results = schemaDetails.map(
      ({ name, quantityKey, priceKey }, index) => {
        const count = counts[index].count;
        const totalQuantity = parseInt(findplan[quantityKey]);
        const totalPrice =
          (findplan.type === "yearly"
            ? subscriptionPrices[priceKey][0].discounted_price_yearly !== 0
              ? subscriptionPrices[priceKey][0].discounted_price_yearly
              : subscriptionPrices[priceKey][0].yearly_price
            : subscriptionPrices[priceKey][0].discounted_price_Monthly !== 0
            ? subscriptionPrices[priceKey][0].discounted_price_Monthly
            : subscriptionPrices[priceKey][0].monthly_price) * totalQuantity;
        return {
          name,
          used: count,
          total: totalQuantity,
          totalPrice,
          planType: findplan.type,
        };
      }
    );

    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

export {
  Create_Subscription,
  UpdateRateSetforAdmins,
  get_Subscriptions,
  AdminApplySubscription,
  getadminplan,
  AdminPurchasedSubscription,
};
