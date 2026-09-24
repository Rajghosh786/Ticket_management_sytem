import { connect } from "mongoose";
import dns from "node:dns";

dns.setServers(["1.1.1.1"]);
export const connectDB = async () => {
    try {
        await connect(process.env.ATLAS_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}