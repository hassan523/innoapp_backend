import { v2 as cloudinary } from "cloudinary";
import Admin from "../models/Admin.js";
import Vehicles from "../models/Vehicles.js";
import HandlePostNotification from "../utils/Notify.js";
import TaskSchema from "../models/TaskSchema.js";
import Teamlead from "../models/Teamlead.js";
import Cleaner from "../models/Cleaner.js";
import Inspector from "../models/Inspector.js";
import InspectionReportSchema from "../models/InspectionReportSchema.js";
import CleaningReportsSchema from "../models/CleaningReportsSchema.js";

const createTask = async (req, res) => {
  try {
    const { Admin_Id, TeamLeadId } = req.params;
    const {
      task_name,
      description,
      Vin_no,
      from_date,
      due_date,
      completed_date,
      type,
      isAssigned,
      assignedToID,
    } = req.body;

    const findAdmin = await Admin.findById(Admin_Id);

    const findTeamLead = await Teamlead.findById(TeamLeadId);

    const findVehicle = await Vehicles.findOne({ vin: Vin_no });

    const findTaskAlready = await TaskSchema.findOne({
      Vin_no: findVehicle.vin,
    });

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (!findTeamLead) {
      return res.status(404).json({ message: "Team-Lead Not Found!" });
    }
    if (findTeamLead.AdminId.toString() !== findAdmin._id.toString()) {
      return res
        .status(404)
        .json({ message: "This Team Lead is Not a valid Person!" });
    }
    if (findVehicle.AdminId.toString() !== findAdmin._id.toString()) {
      return res
        .status(404)
        .json({ message: "Vehicle is Not from your List!" });
    }
    if (findVehicle.IsAsigned === true) {
      return res
        .status(401)
        .json({ message: "This Vehicle is under work in progress state!" });
    }
    if (findTaskAlready && !findTaskAlready.task_status.includes("Completed")) {
      return res.status(400).json({
        message:
          "Vehicle is already is in task list. First they have to complete that task!",
      });
    }

    let task_status;
    if (isAssigned === true) {
      task_status = ["Ongoing"];
    } else {
      task_status = ["Assigned"];
    }

    const createtask = new TaskSchema({
      AdminId: findAdmin._id,
      TeamLeadId: findTeamLead._id,
      task_name: task_name,
      description: description,
      Vin_no: findVehicle.vin,
      from_date: from_date,
      due_date: due_date,
      completed_date: completed_date,
      type: type,
      isAssigned: isAssigned,
      assignedToID: assignedToID,
      task_status: task_status,
    });

    await createtask.save();

    return res
      .status(200)
      .json({ message: "Task Created Successfully!", createtask });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getTaskTeamLead = async (req, res) => {
  try {
    const { TeamLeadId } = req.params;

    const findTask = await TaskSchema.find({ TeamLeadId: TeamLeadId })
      .populate({
        path: "TeamLeadId",
        model: "Teamlead",
      })
      .populate({
        path: "assignedToID",
      });

    if (!findTask || findTask.length === 0) {
      return res.status(404).json({ message: "No tasks available!" });
    }

    const tasks = findTask.map((task) => ({
      ...task.toObject(),
      assignedToID: task.assignedToID || "Assignment is not assigned",
    }));

    return res.status(200).json({ message: "All Team lead tasks!", findTask });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getTaskAdmin = async (req, res) => {
  try {
    const { AdminId } = req.params;

    const findTask = await TaskSchema.find({ AdminId })
      .populate({
        path: "TeamLeadId",
        model: "Teamlead",
      })
      .populate({
        path: "assignedToID",
      });

    if (!findTask || findTask.length === 0) {
      return res.status(404).json({ message: "No tasks available!" });
    }

    const tasks = findTask.map((task) => ({
      ...task.toObject(),
      assignedToID: task.assignedToID || "Assignment is not assigned",
    }));

    return res.status(200).json({ message: "All Admin tasks!", tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const handleSubAssignTask = async (req, res) => {
  try {
    const { TeamLeadId, assignedToID, taskID } = req.params;

    const findTeamLead = await Teamlead.findById(TeamLeadId);
    if (!findTeamLead) {
      return res.status(400).json({ message: "Team Lead Not Found" });
    }

    const findAssignedTo =
      (await Cleaner.findById(assignedToID)) ||
      (await Inspector.findById(assignedToID));

    if (!findAssignedTo) {
      return res.status(400).json({ message: "Assigned Person Not Found" });
    }

    const findTask = await TaskSchema.findById(taskID);
    if (!findTask) {
      return res.status(400).json({ message: "Task Not Found" });
    }

    findTask.assignedToID = assignedToID;
    findTask.task_status = ["Assigned"];
    await findTask.save();

    res.status(200).json({ message: "Task Assigned Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getTaskAsingmentInspector = async (req, res) => {
  try {
    const { AdminId, inspectorId } = req.params;

    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const findInspector = await Inspector.findById(inspectorId);
    if (!findInspector) {
      return res.status(404).json({ message: "Inspector not found" });
    }

    const findTasks = await TaskSchema.find({ assignedToID: findInspector._id })
      .populate({
        path: "TeamLeadId",
        model: "Teamlead",
        select: "-password",
      })
      .lean();

    if (!findTasks || findTasks.length === 0) {
      return res
        .status(404)
        .json({ message: "No tasks found for this Inspector" });
    }

    const populatedTasks = await Promise.all(
      findTasks.map(async (task) => {
        if (task.Vin_no) {
          const vehicleData = await Vehicles.findOne({ vin: task.Vin_no });
          return {
            ...task,
            vehicle: vehicleData || null,
          };
        }
        return task;
      })
    );

    return res.status(200).json({
      message: "Tasks assigned to this Inspector",
      tasks: populatedTasks,
    });
  } catch (error) {
    console.error("Error fetching tasks for Inspector:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const getTaskAsingmentCleaner = async (req, res) => {
  try {
    const { AdminId, CleanerId } = req.params;

    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const findCleaner = await Cleaner.findById(CleanerId);
    if (!findCleaner) {
      return res.status(404).json({ message: "Cleaner not found" });
    }

    const findTasks = await TaskSchema.find({ assignedToID: findCleaner._id })
      .populate({
        path: "TeamLeadId",
        model: "Teamlead",
        select: "-password",
      })
      .lean();

    if (!findTasks || findTasks.length === 0) {
      return res
        .status(404)
        .json({ message: "No tasks found for this Cleaner" });
    }

    const populatedTasks = await Promise.all(
      findTasks.map(async (task) => {
        if (task.Vin_no) {
          const vehicleData = await Vehicles.findOne({ vin: task.Vin_no });
          return {
            ...task,
            vehicle: vehicleData || null,
          };
        }
        return task;
      })
    );

    return res.status(200).json({
      message: "Tasks assigned to this Cleaner",
      tasks: populatedTasks,
    });
  } catch (error) {
    console.error("Error fetching tasks for Cleaner:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const createInspectionReport = async (req, res) => {
  try {
    const { AdminId, TeamLeadId, InspectorId, taskId } = req.params;
    const {
      EngineCondition,
      BodyCondition,
      Description,
      remarks,
      rating,
      TiresCondition,
      BrakesCondition,
      LightsCondition,
      InteriorCondition,
    } = req.body;

    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const findTeamLead = await Teamlead.findById(TeamLeadId);
    if (!findTeamLead) {
      return res.status(404).json({ message: "Team Lead not found" });
    }

    const findInspector = await Inspector.findById(InspectorId);
    if (!findInspector) {
      return res.status(404).json({ message: "Inspector not found" });
    }

    const findTask = await TaskSchema.findById(taskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (findTask.task_status.includes("Completed")) {
      return res.status(400).json({
        message: "Task is already completed and cannot have a new report",
      });
    }

    const newInspectionReport = new InspectionReportSchema({
      AdminId,
      TeamLeadId,
      InspectorId,
      taskId,
      vin: findTask.Vin_no,
      EngineCondition,
      BodyCondition,
      TiresCondition,
      BrakesCondition,
      LightsCondition,
      InteriorCondition,
      Description,
      remarks,
      rating,
      valid: "applicable",
    });

    await newInspectionReport.save();

    // findTask.task_status = "Review";
    // findTask.completed_date = new Date();
    // await findTask.save();

    return res.status(201).json({
      message: "Inspection report created successfully",
      report: newInspectionReport,
    });
  } catch (error) {
    console.error("Error creating inspection report:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error!", error: error.message });
  }
};

const createCleaningReport = async (req, res) => {
  try {
    const { AdminId, TeamLeadId, CleanerId, taskId } = req.params;
    const { Description, remarks } = req.body;

    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const findTeamLead = await Teamlead.findById(TeamLeadId);
    if (!findTeamLead) {
      return res.status(404).json({ message: "Team Lead not found" });
    }

    const findCleaner = await Cleaner.findById(CleanerId);
    if (!findCleaner) {
      return res.status(404).json({ message: "Cleaner not found" });
    }

    const findTask = await TaskSchema.findById(taskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (findTask.task_status.includes("Completed")) {
      return res.status(400).json({
        message: "Task is already completed and cannot have a new report",
      });
    }

    const newCleanningReport = new CleaningReportsSchema({
      AdminId,
      TeamLeadId,
      CleanerId,
      taskId,
      vin: findTask.Vin_no,
      Description,
      remarks,
      valid: "applicable",
    });

    await newCleanningReport.save();

    return res.status(201).json({
      message: "Cleaning report created successfully",
      report: newCleanningReport,
    });
  } catch (error) {
    console.error("Error creating inspection report:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error!", error: error.message });
  }
};

const updateInspectionreportbyInspector = async (req, res) => {
  try {
    const { AdminId, InspectorId, taskId, InspectionReportId } = req.params;
    const {
      EngineCondition,
      BodyCondition,
      Description,
      remarks,
      rating,
      TiresCondition,
      BrakesCondition,
      LightsCondition,
      InteriorCondition,
    } = req.body;
    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    const findInspector = await Inspector.findById(InspectorId);
    if (!findInspector) {
      return res.status(404).json({ message: "Inspector Not Found!" });
    }
    const findTask = await TaskSchema.findById(taskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task Not Avalaible!" });
    }
    if (findTask.task_status.includes("Ongoing")) {
      return res
        .status(403)
        .json({ message: "This task is in Ongoing state!" });
    }
    if (findTask.task_status.includes("Review")) {
      return res.status(403).json({ message: "This task is in Review state!" });
    }
    if (findTask.task_status.includes("Completed")) {
      return res
        .status(403)
        .json({ message: "This task is in Completed state!" });
    }
    const findInspectionreport = await InspectionReportSchema.findById(
      InspectionReportId
    );

    if (!findInspectionreport) {
      return res.status(404).json({ message: "Inspection Report Not Found" });
    }
    if (
      findInspectionreport.InspectorId.toString() !==
      findInspector._id.toString()
    ) {
      return res.status(401).json({ message: "Unauthorized Inspector" });
    }
    (findInspectionreport.EngineCondition =
      EngineCondition || findInspectionreport.EngineCondition),
      (findInspectionreport.BodyCondition =
        BodyCondition || findInspectionreport.BodyCondition),
      (findInspectionreport.Description =
        Description || findInspectionreport.Description),
      (findInspectionreport.remarks = remarks || findInspectionreport.remarks),
      (findInspectionreport.rating = rating || findInspectionreport.rating),
      (findInspectionreport.TiresCondition =
        TiresCondition || findInspectionreport.TiresCondition),
      (findInspectionreport.BrakesCondition =
        BrakesCondition || findInspectionreport.BrakesCondition),
      (findInspectionreport.LightsCondition =
        LightsCondition || findInspectionreport.LightsCondition),
      (findInspectionreport.InteriorCondition =
        InteriorCondition || findInspectionreport.InteriorCondition);

    findInspectionreport.save();
    return res.status(201).json({ message: "Report Updated Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const updateCleanningreportbyCleaner = async (req, res) => {
  try {
    const { AdminId, CleanerId, taskId, CleaningReportId } = req.params;
    const { Description, remarks } = req.body;
    const findAdmin = await Admin.findById(AdminId);
    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    const findCleaner = await Cleaner.findById(CleanerId);
    if (!findCleaner) {
      return res.status(404).json({ message: "Inspector Not Found!" });
    }
    const findTask = await TaskSchema.findById(taskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task Not Avalaible!" });
    }
    if (!findTask.task_status.includes("Assigned")) {
      return res
        .status(403)
        .json({ message: "This task has been Moved from this status!" });
    }
    const findCleaningreport = await CleaningReportsSchema.findById(
      CleaningReportId
    );

    if (!findCleaningreport) {
      return res.status(404).json({ message: "Inspection Report Not Found" });
    }
    if (
      findCleaningreport.CleanerId.toString() !== findCleaner._id.toString()
    ) {
      return res.status(401).json({ message: "Unauthorized Inspector" });
    }

    (findCleaningreport.Description =
      Description || findCleaningreport.Description),
      (findCleaningreport.remarks = remarks || findCleaningreport.remarks),
      findCleaningreport.save();
    return res.status(201).json({ message: "Report Updated Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const maketaskonReview = async (req, res) => {
  try {
    const { assignedToID, AdminId, taskId } = req.params;

    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    const findTask = await TaskSchema.findById(taskId);

    if (!findTask) {
      return res.status(404).json({ message: "Task Not Found!" });
    }
    if (findTask.assignedToID.toString() !== assignedToID) {
      return res.status(400).json({ message: "Unauthorized Person!" });
    }
    const findInspector = await Inspector.findById(assignedToID);
    const findCleaner = await Cleaner.findById(assignedToID);

    if (!findInspector && !findCleaner) {
      return res.status(404).json({ message: "Assignee Not Found!" });
    }

    if (!findInspector || findCleaner) {
      findTask.task_status = "Review";
      await findTask.save();
      return res.status(200).json({ message: "Cleaner task is Completed!" });
    }
    if (findInspector || !findCleaner) {
      findTask.task_status = "Review";
      await findTask.save();
      return res.status(200).json({ message: "Inspector task is Completed!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const ReAssignTask = async (req, res) => {
  try {
    const { taskId, TeamLeadId, AdminId } = req.params;

    // Validate Admin and TeamLead existence
    const findAdmin = await Admin.findById(AdminId);
    const findTeamLead = await Teamlead.findById(TeamLeadId);

    if (!findAdmin || !findTeamLead) {
      return res.status(404).json({ message: "Invalid Admin or Team Lead!" });
    }

    // Validate Task existence
    const findTask = await TaskSchema.findById(taskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task not found!" });
    }

    // Fetch related reports
    const findInspectionReports = await InspectionReportSchema.find({
      taskId: findTask._id,
    });
    const findCleaningReports = await CleaningReportsSchema.find({
      taskId: findTask._id,
    });

    // Validate reports existence
    if (!findInspectionReports.length && !findCleaningReports.length) {
      return res
        .status(404)
        .json({ message: "No reports found for this task!" });
    }

    // Update validity of reports based on their existence
    if (findInspectionReports.length > 0) {
      await InspectionReportSchema.updateMany(
        { taskId: findTask._id },
        { valid: "Not-Applicable" }
      );
    }
    if (findCleaningReports.length > 0) {
      await CleaningReportsSchema.updateMany(
        { taskId: findTask._id },
        { valid: "Not-Applicable" }
      );
    }

    // Update task status
    findTask.task_status = "Re-Assigned";
    await findTask.save();

    return res.status(200).json({ message: "Task reassigned successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getReportbyTaskID = async (req, res) => {
  try {
    const { TaskId } = req.params;

    const findTask = await TaskSchema.findById(TaskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task Not Found!" });
    }

    const findInspectionReport = await InspectionReportSchema.find({
      taskId: findTask._id,
    }).populate({
      path: "taskId",
      model: "Task",
    });
    const findCleaningReport = await CleaningReportsSchema.find({
      taskId: findTask._id,
    }).populate({
      path: "taskId",
      model: "Task",
    });

    if (
      (!findInspectionReport || findInspectionReport.length === 0) &&
      (!findCleaningReport || findCleaningReport.length === 0)
    ) {
      return res.status(404).json({ message: "No Reports Found!" });
    }

    if (findCleaningReport && findCleaningReport.length > 0) {
      return res
        .status(200)
        .json({ message: "Cleaning Report", findCleaningReport });
    }

    if (findInspectionReport && findInspectionReport.length > 0) {
      return res
        .status(200)
        .json({ message: "Inspection Report", findInspectionReport });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getReportbyTaskIDOnlyValids = async (req, res) => {
  try {
    const { TaskId } = req.params;

    const findTask = await TaskSchema.findById(TaskId);
    if (!findTask) {
      return res.status(404).json({ message: "Task Not Found!" });
    }

    const findInspectionReport = await InspectionReportSchema.find({
      taskId: findTask._id,
      valid: "applicable",
    });
    const findCleaningReport = await CleaningReportsSchema.find({
      taskId: findTask._id,
      valid: "applicable",
    });

    if (
      (!findInspectionReport || findInspectionReport.length === 0) &&
      (!findCleaningReport || findCleaningReport.length === 0)
    ) {
      return res.status(404).json({ message: "No Reports Found!" });
    }

    if (findCleaningReport && findCleaningReport.length > 0) {
      return res
        .status(200)
        .json({ message: "Cleaning Report", findCleaningReport });
    }

    if (findInspectionReport && findInspectionReport.length > 0) {
      return res
        .status(200)
        .json({ message: "Inspection Report", findInspectionReport });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getallTeamleadReports = async (req, res) => {
  try {
    const { TeamLeadId } = req.params;

    const findTeamLead = await Teamlead.findById(TeamLeadId);
    if (!findTeamLead) {
      return res.status(404).json({ message: "Team Lead Not Found!" });
    }

    const findInspectionReport = await InspectionReportSchema.find({
      TeamLeadId: findTeamLead._id,
    }).populate({
      path: "taskId",
      model: "Task",
    });
    const findCleaningReport = await CleaningReportsSchema.find({
      TeamLeadId: findTeamLead._id,
    }).populate({
      path: "taskId",
      model: "Task",
    });

    if (
      (!findInspectionReport || findInspectionReport.length === 0) &&
      (!findCleaningReport || findCleaningReport.length === 0)
    ) {
      return res.status(404).json({ message: "No Reports Found!" });
    }

    const response = {};
    if (findCleaningReport && findCleaningReport.length > 0) {
      response.cleaningReports = findCleaningReport;
    }
    if (findInspectionReport && findInspectionReport.length > 0) {
      response.inspectionReports = findInspectionReport;
    }

    return res.status(200).json({ message: "Reports Found!", data: response });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const getallAdminsReports = async (req, res) => {
  try {
    const { AdminId } = req.params;

    const findAdmin = await Admin.findById(AdminId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }

    const findInspectionReport = await InspectionReportSchema.find({
      AdminId: findAdmin._id,
    }).populate({
      path: "taskId",
      model: "Task",
    });
    const findCleaningReport = await CleaningReportsSchema.find({
      AdminId: findAdmin._id,
    }).populate({
      path: "taskId",
      model: "Task",
    });

    if (
      (!findInspectionReport || findInspectionReport.length === 0) &&
      (!findCleaningReport || findCleaningReport.length === 0)
    ) {
      return res.status(404).json({ message: "No Reports Found!" });
    }

    const response = {};
    if (findCleaningReport && findCleaningReport.length > 0) {
      response.cleaningReports = findCleaningReport;
    }
    if (findInspectionReport && findInspectionReport.length > 0) {
      response.inspectionReports = findInspectionReport;
    }

    return res.status(200).json({ message: "Reports Found!", data: response });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

const TaskComplete = async (req, res) => {
  try {
    const { taskID, AdminId, TeamLeadId } = req.params;

    const findTask = await TaskSchema.findById(taskID);
    const findAdmin = await Admin.findById(AdminId);
    const findTeamLead = await Teamlead.findById(TeamLeadId);

    if (!findAdmin) {
      return res.status(404).json({ message: "Admin Not Found!" });
    }
    if (!findTeamLead) {
      return res.status(404).json({ message: "Team Lead Not Found!" });
    }
    if (!findTask) {
      return res.status(404).json({ message: "Task Not Found!" });
    }
    if (findTask.AdminId.toString() !== findAdmin._id.toString()) {
      return res
        .status(404)
        .json({ message: "Task Not belongs to this Admin!" });
    }
    if (findTask.TeamLeadId.toString() !== findTeamLead._id.toString()) {
      return res
        .status(404)
        .json({ message: "Task Not belongs to this Team Lead!" });
    }

    findTask.task_status = "Completed";
    await findTask.save();
    return res.status(200).json({ message: "Task Completed!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

export {
  createTask,
  getTaskTeamLead,
  getTaskAdmin,
  handleSubAssignTask,
  getTaskAsingmentInspector,
  createInspectionReport,
  maketaskonReview,
  updateInspectionreportbyInspector,
  getReportbyTaskID,
  getReportbyTaskIDOnlyValids,
  createCleaningReport,
  updateCleanningreportbyCleaner,
  getallTeamleadReports,
  ReAssignTask,
  getTaskAsingmentCleaner,
  TaskComplete,
  getallAdminsReports,
};
