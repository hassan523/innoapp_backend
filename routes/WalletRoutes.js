import express from "express";
import { HandleGetWallet } from "../controller/Wallet.js";

const router = express.Router();

router.get("/wallet-balance/:adminID", HandleGetWallet);

export default router;
