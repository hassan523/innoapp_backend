import Admin from "../models/Admin.js";
import KycModel from "../models/KycModel.js";
import fs from "fs";
import stripe from "../utils/StripeConfig.js";
import SuperAdmin from "../models/SuperAdmin.js";

// Submit KYC
const HandleSubmitKYC = async (req, res) => {
  try {
    const { adminID } = req.params;

    const {
      city,
      state,
      country,
      addressLine,
      phone,
      postalCode,
      dob,
      ssn_last_4,
      cardID,
      tokenID,
    } = req.body;

    const findAdmin = await Admin.findById(adminID);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    const validateKyc = await KycModel.findOne({ AdminId: adminID });
    if (validateKyc) {
      return res.status(409).json({ message: "KYC already submitted!" });
    }

    const identity_back = req.files.identity_back;
    const identity_front = req.files.identity_front;

    const backFileData = fs.readFileSync(identity_back.tempFilePath);
    const frontFileData = fs.readFileSync(identity_front.tempFilePath);

    const back = await stripe.files.create({
      purpose: "identity_document",
      file: {
        data: backFileData,
        name: identity_back.name,
        type: "application/octet-stream",
      },
    });

    const front = await stripe.files.create({
      purpose: "identity_document",
      file: {
        data: frontFileData,
        name: identity_front.name,
        type: "application/octet-stream",
      },
    });

    const fomrattedDob = dob.split("-");

    const kyc = new KycModel({
      AdminId: findAdmin._id,
      city,
      state,
      country,
      phone,
      addressLine,
      postalCode,
      dob,
      identity_back: back.id,
      identity_front: front.id,
      ssn_last_4,
    });

    console.log(tokenID, "tokenID");
    findAdmin.kycVerification = "Pending";
    findAdmin.save();

    // const paymentMethod = await stripe.paymentMethods.create({
    //   type: "card",
    //   card: { token: tokenID }, // Use the token sent from the client
    // });

    const account = await stripe.accounts.create({
      country: "US",
      type: "custom",
      email: findAdmin.email,
      business_type: "individual",
      business_profile: {
        url: findAdmin.profileImage,
      },
      individual: {
        first_name: findAdmin.name,
        last_name: " ",
        email: findAdmin.email,
        phone: Number(phone),
        dob: {
          day: Number(fomrattedDob[2]),
          month: Number(fomrattedDob[1]),
          year: Number(fomrattedDob[0]),
        },
        address: {
          line1: addressLine,
          city: city,
          state: state,
          country: country,
          postal_code: postalCode,
        },
        ssn_last_4: ssn_last_4,
        verification: {
          document: {
            back: back.id,
            front: front.id,
          },
        },
      },

      external_account: tokenID,

      capabilities: {
        transfers: {
          requested: true,
        },
      },

      settings: {
        payouts: {
          debit_negative_balances: true,
        },
      },
    });

    await stripe.accounts.update(account.id, {
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: "8.8.8.8",
      },
    });

    await stripe.accounts.updateCapability(account.id, "transfers", {
      requested: true,
    });
    await stripe.accounts.updateCapability(account.id, "card_payments", {
      requested: true,
    });

    // const attachedPaymentMethod = await stripe.paymentMethods.attach(
    //   paymentMethod.id,
    //   {
    //     stripeAccount: account.id,
    //   }
    // );

    await kyc.save();

    await KycModel.findByIdAndUpdate(kyc._id, {
      cardID: account.external_accounts.data[0].id,
      // paymentMethod: attachedPaymentMethod.id,
      accountID: account.id,
    });

    res.status(200).json({ message: "KYC Submitted Successfully!" });
  } catch (error) {
    console.log(error);
    switch (error.type) {
      case "StripeCardError":
        return res
          .status(500)
          .json({ message: `A payment error occurred: ${error.message}` });
      case "StripeInvalidRequestError":
        return res.status(500).json({ message: error.raw.message });
      default:
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// -------------------------------------------------------------------------
// If Kyc Submitted successfully then create an api to get tokenID from front-end and create the payment method with that stipe connect account then save payment method id in the database
// -------------------------------------------------------------------------

const HandleGetKycReqs = async (req, res) => {
  try {
    const { superAdminID } = req.params;
    const { status } = req.query;
    const findSuperAdmin = await SuperAdmin.findById(superAdminID);

    if (!findSuperAdmin) {
      return res.status(401).json({ message: "Unauthorized Request!" });
    }

    const filterStatus = status === "all" ? {} : { status: Array.isArray(status) ? status : [status] };

    const kycRequests = await KycModel.find(filterStatus).populate({
      path: "AdminId",
      model: "Admin",
    });

    return res.status(200).json({ kycRequests });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleUpdateKyc = async (req, res) => {
  try {
    const { kycID, superAdminID } = req.params;

    const status = !Array.isArray(req.body.status)
      ? [req.body.status]
      : req.body.status;

    const findSuperAdmin = await SuperAdmin.findById(superAdminID);
    if (!findSuperAdmin) {
      return res.status(401).json({ message: "Unauthorized Request!" });
    }
    const findKyc = await KycModel.findById(kycID);
    if (!findKyc) {
      return res.status(404).json({ message: "KYC Request Not Found!" });
    }

    if (findKyc.status.includes("Completed")) {
      return res.status(400).json({ message: "Already approved KYC request!" });
    }

    const findAdmin = await Admin.findById(findKyc.AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (findKyc.status.includes("Rejected")) {
      await KycModel.findByIdAndDelete(kycID);

      findAdmin.kycVerification = "Not-submited";
      await findAdmin.save();
      return res.status(404).json({ message: "Kyc Rejected" });
    }
    if (status.includes("Completed")) {
      findKyc.status = status;
      findAdmin.kycVerification = status;
      await findKyc.save();
      await findAdmin.save();
    } else {
      findKyc.status = status;
      await findKyc.save();
    }

    res
      .status(200)
      .json({ message: "KYC request updated successfully!", Token: findAdmin });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleDeleteStripeAcc = async (req, res) => {
  try {
    const { accountID } = req.body;
    const deleted = await stripe.accounts.del(accountID);
    res.status(200).json({ message: "Account deleted successfully!", deleted });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  HandleSubmitKYC,
  HandleGetKycReqs,
  HandleUpdateKyc,
  HandleDeleteStripeAcc,
};
