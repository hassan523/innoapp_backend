import mongoose, { Schema } from 'mongoose';


const NotificationsSchema = new Schema({
    SupperAdminId: {
        type: mongoose.Schema.Types.ObjectId,
         ref:"superAdmin",
         default:null
    },
    AdminId: {
        type: mongoose.Schema.Types.ObjectId,
         ref:"Admin",
         default:null
    },
    DriverId: {
        type: mongoose.Schema.Types.ObjectId,
         ref:"Driver",
         default:null
    },
    TeamLeadId: {
        type: mongoose.Schema.Types.ObjectId,
         ref:"Teamlead",
         default:null
    },
    InspectorId: {
        type: mongoose.Schema.Types.ObjectId,
         ref:"Inspector",
         default:null
    },
    CleanerId: {
        type: mongoose.Schema.Types.ObjectId,
         ref:"Cleaner",
         default:null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
         ref:"Users",
         default:null
    },
    message: {
        type: String,
        required: true
    },
    notiftype: {
        type: [String],
        enum: ['Auth', 'subscription', "Invoice", "Vehicle"],
        default: ['none']
    },
}, { timestamps: true });

export default mongoose.model("notifications", NotificationsSchema);