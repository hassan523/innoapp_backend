import express from "express";
import {
  CreateSupportTicket,
  getSuportTicket,
  HandleDeleteSupportTicket,
  HandleGetSingleSupport,
  HandleUpdateSupportStatus,
} from "../controller/SupportController.js";

const router = express.Router();

router.post(
  "/create-support-ticket/:AdminId/:superAdminId",
  CreateSupportTicket
);
router.get("/get-support-ticket/:superAdminId", getSuportTicket);

router.get("/get-single-support-ticket/:supportID", HandleGetSingleSupport);

router.patch("/update-support-status/:supportID", HandleUpdateSupportStatus);
router.delete("/delete-support/:supportID", HandleDeleteSupportTicket);

export default router;
