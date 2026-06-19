import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/Apierror.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/Apiresponse.js";

const registerUser = asyncHandler(async (req, res) => {


/*
    these are the step for the register a user

    // get user details from frontend
    // validation details like they fill it or not
    // check if user already exists
    // check for images
    // upload avatar and cover image on cloudinary
    // create user object - create entry in db
    // remove password and token field from response
    // check for user creation
    // return response
*/

const { fullname, email, username, password } = req.body;

// used for request the parameter from the frontend

console.log("email:", email);

/*
    this is the method to check validation manually

    if(fullname === "")
    {
        throw new ApiError(400 ,"full name is required")
    }
*/

if (
    [fullname, email, username, password]
        .some((field) => field?.trim() === "")
) {
    throw new ApiError(400, "All fields are required");
}

// check if user already exists

const existedUser = await User.findOne({
    $or: [{ email }, { username }]
});

if (existedUser) {
    throw new ApiError(
        409,
        "User with email or username already exists"
    );
}

// for avatar and images handling with multer middleware

const avatarLocalPath =
    req.files?.avatar?.[0]?.path;
// these method is for the optional but it will show undefined later if we try without coverimage.
// const coverImageLocalPath =
//     req.files?.coverImage?.[0]?.path;
//these is for the " "in coverimage
    let coverImageLocalPath;

if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
) {
    coverImageLocalPath =
        req.files.coverImage[0].path;
}
// avatar is mandatory

if (!avatarLocalPath) {
    throw new ApiError(
        400,
        "Avatar file is required"
    );
}

// upload files to cloudinary

const avatar =
    await uploadOnCloudinary(
        avatarLocalPath
    );

const coverImage =
    await uploadOnCloudinary(
        coverImageLocalPath
    );

if (!avatar) {
    throw new ApiError(
        400,
        "Avatar upload failed"
    );
}

// now create user entry in database

const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage:
        coverImage?.url || "",
    email,
    password,
    username:
        username.toLowerCase()
});

// fetch created user without password and refresh token

const createdUser =
    await User.findById(
        user._id
    ).select(
        "-password -refreshToken"
    );

if (!createdUser) {
    throw new ApiError(
        500,
        "Something went wrong while creating user"
    );
}

// last part to obtain the response

return res.status(201).json(
    new ApiResponse(
        200,
        createdUser,
        "User registered successfully"
    )
);

// previous testing method

/*
res.status(200).json({
    message: "OK"
});
*/


});

export { registerUser }
