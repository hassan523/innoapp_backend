import Admin from "../models/Admin.js";
import KycModel from "../models/KycModel.js";
import stripe from "../utils/StripeConfig.js";

const HandleGetWallet = async (req, res) => {
  try {
    const { adminID } = req.params;
    const findAdmin = await Admin.findById(adminID).select("-password");
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    const findKyc = await KycModel.findOne({ AdminId: findAdmin._id });
    if (!findKyc) {
      return res.status(404).json({ message: "KYC Not Found!" });
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: findKyc.accountID,
    });
    const walletBalance = balance.available[0].amount / 100;
    return res.status(200).json({ message: "Wallet Balance", walletBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export { HandleGetWallet };
