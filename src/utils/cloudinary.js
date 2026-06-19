import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Function to upload file on Cloudinary

const uploadOnCloudinary = async (localFilePath) => {
try {


    // Configure Cloudinary
    // done here so that env variables are definitely loaded

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Debug Cloudinary credentials

    console.log("Cloudinary Config:");
    console.log(
        "Cloud Name:",
        process.env.CLOUDINARY_CLOUD_NAME
    );

    console.log(
        "API Key:",
        process.env.CLOUDINARY_API_KEY
            ? "FOUND"
            : "MISSING"
    );

    console.log(
        "API Secret:",
        process.env.CLOUDINARY_API_SECRET
            ? "FOUND"
            : "MISSING"
    );

    // If no file path is provided

    if (!localFilePath) {
        console.log(
            "No file path provided"
        );

        return null;
    }

    // Debug file path received from multer

    console.log(
        "Uploading file:",
        localFilePath
    );

    // Upload file to Cloudinary

    const response =
        await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto", // image, video, pdf etc.
            }
        );

    // Success message

    console.log(
        "File uploaded successfully on Cloudinary"
    );

    console.log(
        "Cloudinary URL:",
        response.url
    );

    // Optional:
    // remove local file after successful upload

    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }

    // Return complete Cloudinary response

    return response;

} catch (error) {

    console.log(
        "=================================="
    );

    console.log(
        "Cloudinary Upload Error"
    );

    console.log(
        error.message
    );

    console.log(
        "=================================="
    );

    // Delete local file if upload failed

    if (
        localFilePath &&
        fs.existsSync(localFilePath)
    ) {
        fs.unlinkSync(localFilePath);
    }

    return null;
}


};

// Export function

export { uploadOnCloudinary };
