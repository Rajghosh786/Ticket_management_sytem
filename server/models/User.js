import mongoose from "mongoose";

const ROLES = ["STUDENT", "STAFF", "DEPARTMENT_ADMIN", "ADMIN"];

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ROLES,
            default: "STUDENT",
        },
        department: {
            type: String,
            default: "General",
        },
        rollNo: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model("User", userSchema);
