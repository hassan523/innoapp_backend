import Notifications from "../models/Notifications.js";

const HandlePostNotification = async ({ 
    SupperAdminId,
    AdminId,
    DriverId,
    TeamLeadId,
    InspectorId,
    CleanerId,
    userId,
    message,
    notiftype, }) => {
    try {
        const createNofif = new Notifications({
    SupperAdminId,
      AdminId,
      DriverId,
      TeamLeadId,
      InspectorId,
      CleanerId,
      userId,
      message,
      notiftype,
        })
        await createNofif.save()

        return createNofif
    } catch (error) {
        console.log(error)
    }
}



export default HandlePostNotification;