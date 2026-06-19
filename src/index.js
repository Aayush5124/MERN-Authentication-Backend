import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.js";
import app from "./app.js";


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MongoDB connection failed", err);
});



// require("dotenv").config({ path: "./.env" }); // Load environment variables from .env file  these is also a method to do 


// these is the another way to connect to the database using mongoose but we are not using it because we are using the dotenv package to load the environment variables from the .env file and we are using the MONGO_URI variable from the .env file to connect to the database. and we have create a another file int eh db that will help me in doing so.



// console.log(process.env.MONGO_URI); // Debug

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.log(err.message)

