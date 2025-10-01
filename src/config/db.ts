import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config()

const MONGO_URI: string = process.env.MONGO_URI!;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment");
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err: any) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
