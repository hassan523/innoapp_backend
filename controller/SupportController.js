import { v2 as cloudinary } from "cloudinary";
import HandlePostNotification from "../utils/Notify.js";
import SuperAdmin from "../models/SuperAdmin.js";
import SupportSchema from "../models/SupportSchema.js";
import Admin from "../models/Admin.js";

const CreateSupportTicket = async (req, res) => {
  try {
    const { AdminId, superAdminId } = req.params;
    const { reason, Description } = req.body;

    const generateSixDigitsNumber = () => {
      return Math.floor(100000 + Math.random() * 900000);
    };
    console.log(generateSixDigitsNumber());
    const VerifySixdigits = generateSixDigitsNumber();

    // if(VerifySixdigits.length !== 6){
    //     return res.status(403).json({message:"Invalid Request!"})
    // }

    const findSuperAdmin = await SuperAdmin.findById(superAdminId);

    if (!findSuperAdmin) {
      return res.status(404).json({ message: "Super Admin Not Found!" });
    }
    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    const createTicket = new SupportSchema({
      superAdminId: findSuperAdmin._id,
      AdminId: findAdmin._id,
      TicketNumber: VerifySixdigits,
      Description: Description,
      reason: reason,
    });
    await createTicket.save();

    return res
      .status(200)
      .json({ message: "Ticket Created Successfully!", createTicket });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getSuportTicket = async (req, res) => {
  try {
    const { superAdminId } = req.params;
    const findSuperAdmin = await SuperAdmin.findById(superAdminId);

    if (!findSuperAdmin) {
      return res.status(400).json({ message: "Super Admin Not Found!" });
    }
    const SupportTickets = await SupportSchema.find();

    return res.status(200).json({ message: "Suport Tickets", SupportTickets });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleGetSingleSupport = async (req, res) => {
  try {
    const { supportID } = req.params;

    const findTicket = await SupportSchema.findById(supportID)
      .populate({
        path: "superAdminId",
        model: "superAdmin",
        select: "-password",
      })
      .populate({
        path: "AdminId",
        model: "Admin",
        select: "-password",
      });

    if (!findTicket) {
      return res.status(404).json({ message: "Ticket Not Found!" });
    }

    return res
      .status(200)
      .json({ message: "Ticket Details", ticket: findTicket });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleUpdateSupportStatus = async (req, res) => {
  try {
    const { supportID } = req.params;
    const { status } = req.body;
    const statusArr = Array.isArray(status) ? status : [status];
    if (statusArr.length === 0) {
      return res.status(400).json({ message: "Status is required!" });
    }

    if (
      !statusArr.includes("Pending") &&
      !statusArr.includes("In-Progress") &&
      !statusArr.includes("Resolved")
    ) {
      return res.status(400).json({ message: "Invalid Status!" });
    }
    const findTicket = await SupportSchema.findById(supportID);
    if (!findTicket) {
      return res.status(404).json({ message: "Ticket Not Found!" });
    }
    findTicket.status = statusArr;
    await findTicket.save();
    return res.status(200).json({ message: "Status updated successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const HandleDeleteSupportTicket = async (req, res) => {
  try {
    const { supportID } = req.params;
    const findTicket = await SupportSchema.findByIdAndDelete(supportID);
    if (!findTicket) {
      return res.status(404).json({ message: "Ticket Not Found!" });
    }
    return res.status(200).json({ message: "Ticket deleted successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

export {
  CreateSupportTicket,
  getSuportTicket,
  HandleGetSingleSupport,
  HandleUpdateSupportStatus,
  HandleDeleteSupportTicket,
};
