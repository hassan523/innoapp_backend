import express from "express";
import { AdminApplySubscription, AdminPurchasedSubscription, Create_Subscription, get_Subscriptions, getadminplan, UpdateRateSetforAdmins } from "../controller/SubscriptionController.js";

const router = express.Router();

router.post("/create_subscription/:SuperAdminId", Create_Subscription);

router.patch("/update_subscription/:SuperAdminId/:subscriptionId", UpdateRateSetforAdmins);

router.get("/get_subscription", get_Subscriptions);
router.post("/buy-subscription/:AdminId/:subscriptionId", AdminApplySubscription);
router.get("/get-admin-invoices/:AdminId", getadminplan);
router.get("/get-admin-stats/:AdminId", AdminPurchasedSubscription);




export default router;