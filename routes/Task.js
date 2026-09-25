import express from "express";
import {
  createCleaningReport,
  createInspectionReport,
  createTask,
  getallAdminsReports,
  getallTeamleadReports,
  getReportbyTaskID,
  getReportbyTaskIDOnlyValids,
  getTaskAdmin,
  getTaskAsingmentCleaner,
  getTaskAsingmentInspector,
  getTaskTeamLead,
  handleSubAssignTask,
  maketaskonReview,
  ReAssignTask,
  TaskComplete,
  updateCleanningreportbyCleaner,
  updateInspectionreportbyInspector,
} from "../controller/TaskController.js";

const router = express.Router();

router.post("/create-task/:Admin_Id/:TeamLeadId", createTask);
router.get("/gettaskadmin/:AdminId", getTaskAdmin);
router.get("/gettaskteamlead/:TeamLeadId", getTaskTeamLead);

router.get("/get-task-asingment-inspector/:AdminId/:inspectorId", getTaskAsingmentInspector);
router.get("/get-task-asingment-cleaner/:AdminId/:CleanerId", getTaskAsingmentCleaner);

router.patch("/:TeamLeadId/assgin-task/:assignedToID/:taskID",handleSubAssignTask);

// create inspection report 
router.post("/create-inspection-report/:AdminId/:TeamLeadId/:InspectorId/:taskId", createInspectionReport)
router.post("/create-cleaning-report/:AdminId/:TeamLeadId/:CleanerId/:taskId", createCleaningReport)
router.patch("/update-inspection-report/:AdminId/:InspectorId/:taskId/:InspectionReportId", updateInspectionreportbyInspector)


router.patch("/update-cleaning-report/:AdminId/:CleanerId/:taskId/:CleaningReportId", updateCleanningreportbyCleaner)

router.patch("/make-task-on-review/:assignedToID/:AdminId/:taskId", maketaskonReview)

router.get("/get-report-by-taskid/:TaskId", getReportbyTaskID)
router.get("/get-report-by-taskid-validonly/:TaskId", getReportbyTaskIDOnlyValids)
router.get("/get-report-by-teamlead/:TeamLeadId", getallTeamleadReports);

router.get("/get-report-by-admins/:AdminId", getallAdminsReports);


router.patch("/reassign-task/:AdminId/:TeamLeadId/:taskId", ReAssignTask);


router.patch("/complete-task/:AdminId/:TeamLeadId/:taskID", TaskComplete);



export default router;
