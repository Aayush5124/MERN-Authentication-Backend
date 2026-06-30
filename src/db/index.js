import mongoose from "mongoose";
import db_name from "../constants.js";

const connectDB = async () => {
  // console.log(process.env.MONGO_URI);
  try {
   const connection = await mongoose.connect(process.env.MONGO_URI, {
      dbName: db_name
    });
    console.log("MongoDB Connected");
    console.log("Connection Host:", connection.connection.host);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

export default connectDB;