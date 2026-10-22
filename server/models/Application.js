import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: true,
            trim: true
        },
        position: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            required: true,
            enum: ["Applied", "Interview", "Offer", "Rejected"],
            default: "Applied"
        },
        dateApplied: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
