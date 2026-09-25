import express from "express";
import {
  HandleDeleteStripeAcc,
  HandleGetKycReqs,
  HandleSubmitKYC,
  HandleUpdateKyc,
} from "../controller/KycController.js";

const router = express.Router();

router.post("/submit-kyc/:adminID", HandleSubmitKYC);

router.get("/get-kyc-requests/:superAdminID", HandleGetKycReqs);

router.patch("/update-kyc-status/:kycID/:superAdminID", HandleUpdateKyc);

router.delete("/delete-stripe-connected-account", HandleDeleteStripeAcc);

export default router;
