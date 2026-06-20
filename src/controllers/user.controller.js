import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/Apierror.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";
// generate access token and refresh token

const generateaccessandrefreshtoken = async (userId) => {
    try {

        // find user from database

        const user = await User.findById(userId);

        // generate both tokens

        const accessToken =
            user.generateAccessToken();

        const refreshToken =
            user.generateRefreshToken();

        // save refresh token in database

        user.refreshToken =
            refreshToken;

        await user.save({
            validateBeforeSave: false
        });

        // return both tokens

        return {
            accessToken,
            refreshToken
        };

    } catch (error) {

        throw new ApiError(
            500,
            "Something went wrong while generating token"
        );
    }
};

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

// login controller

const loginUser = asyncHandler(
    async (req, res) => {

        // req body -> data
        // username and email
        // find the user
        // password check
        // access and refresh token
        // send cookies

        const {
            email,
            username,
            password
        } = req.body;

        // username or email must be present

        if (!username && !email) {

            throw new ApiError(
                400,
                "Username or Email is required"
            );
        }

        // find user

        const user =
            await User.findOne({
                $or: [
                    { email },
                    { username }
                ]
            });

        if (!user) {

            throw new ApiError(
                404,
                "User does not exist"
            );
        }

        // password validation

        const ispasswordvalid =
            await user.isPasswordCorrect(
                password
            );

        if (!ispasswordvalid) {

            throw new ApiError(
                401,
                "Invalid details"
            );
        }

        // generate tokens

        const {
            accessToken,
            refreshToken
        } =
            await generateaccessandrefreshtoken(
                user._id
            );

        // remove password and refresh token from response

        const loggedinuser =
            await User.findById(
                user._id
            ).select(
                "-password -refreshToken"
            );

        // cookie options

        const options = {
            httpOnly: true,
            secure: true
        };

        // send cookies and response

        return res
            .status(200)
            .cookie(
                "accessToken",
                accessToken,
                options
            )
            .cookie(
                "refreshToken",
                refreshToken,
                options
            )
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedinuser,
                        accessToken,
                        refreshToken
                    },
                    "User logged in successfully"
                )
            );
    }
);
const logoutuser = asyncHandler(
    async (req, res) => {

        // remove refresh token from database

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        );

        // cookie options

        const options = {
            httpOnly: true,
            secure: true
        };

        // clear cookies and send response

        return res
            .status(200)
            .clearCookie(
                "accessToken",
                options
            )
            .clearCookie(
                "refreshToken",
                options
            )
            .json(
                new ApiResponse(
                    200,
                    {},
                    "User logged out successfully"
                )
            );
    }
);

const refreshAccessToken =asyncHandler(async (req, res) => {

    const incomingRefreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken;

//         console.log("Cookies:", req.cookies);
// console.log("Body:", req.body);
// console.log("Incoming Token:", incomingRefreshToken);

    if (!incomingRefreshToken) {

        throw new ApiError(
            401,
            "Unauthorized request"
        );
    }
// console.log(
//     "Incoming Refresh Token:",
//     incomingRefreshToken
// );
    const decodedToken =
        jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

    const user =
        await User.findById(
            decodedToken?._id
        );

    if (!user) {

        throw new ApiError(
            401,
            "Invalid refresh token"
        );
    }

    if (
        incomingRefreshToken !==
        user.refreshToken
    ) {

        throw new ApiError(
            401,
            "Refresh token expired"
        );
    }

    const {
        accessToken,
        refreshToken
    } =
        await generateaccessandrefreshtoken(
            user._id
        );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie(
            "accessToken",
            accessToken,
            options
        )
        .cookie(
            "refreshToken",
            refreshToken,
            options
        )
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token refreshed successfully"
            )
        );
});

// change current password controller

const changeCurrentPassword =asyncHandler(async (req, res) => {

    // get old password and new password
    // from request body

    const {
        oldPassword,
        newPassword
    } = req.body;

    // find current logged in user

    const user =
        await User.findById(
            req.user?._id
        );

    // check if old password is correct

    const isPasswordCorrect =
        await user.isPasswordCorrect(
            oldPassword
        );

    // if old password is wrong

    if (!isPasswordCorrect) {

        throw new ApiError(
            400,
            "Invalid old password"
        );
    }

    // assign new password

    user.password =
        newPassword;

    // save user
    // password will automatically hash
    // because of pre("save") middleware

    await user.save({
        validateBeforeSave: false
    });

    // send response

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        );
});

// update account details controller

const updateAccountDetails =asyncHandler(async (req, res) => {

    // get fullname and email
    // from request body

    const {
        fullName,
        email
    } = req.body;

    // validation

    if (!fullName || !email) {

        throw new ApiError(
            400,
            "All fields are required"
        );
    }

    // update user details

    const user =
        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email: email
                }
            },
            {
                new: true
            }
        ).select("-password");

    // return updated user

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account details updated successfully"
            )
        );
});

// update user avatar controller

const updateUserAvatar =asyncHandler(async (req, res) => {

    // get avatar path from multer

    const avatarLocalPath =
        req.file?.path;

    // check if avatar file exists

    if (!avatarLocalPath) {

        throw new ApiError(
            400,
            "Avatar file is missing"
        );
    }

    // upload avatar on cloudinary

    const avatar =
        await uploadOnCloudinary(
            avatarLocalPath
        );

    // check upload success

    if (!avatar?.url) {

        throw new ApiError(
            400,
            "Error while uploading avatar"
        );
    }

    // update avatar url in database

    const user =
        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {
                new: true
            }
        ).select("-password");

    // return updated user

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar updated successfully"
            )
        );
});

// update cover image controller

const updateUserCoverImage =
asyncHandler(async (req, res) => {

    // get cover image path from multer

    const coverImageLocalPath =
        req.file?.path;

    // check if cover image exists

    if (!coverImageLocalPath) {

        throw new ApiError(
            400,
            "Cover image file is missing"
        );
    }

    // upload cover image on cloudinary

    const coverImage =
        await uploadOnCloudinary(
            coverImageLocalPath
        );

    // check upload success

    if (!coverImage?.url) {

        throw new ApiError(
            400,
            "Error while uploading cover image"
        );
    }

    // update cover image url in database

    const user =
        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage:
                        coverImage.url
                }
            },
            {
                new: true
            }
        ).select("-password");

    // return updated user

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover image updated successfully"
            )
        );
});


export { registerUser , loginUser , logoutuser ,refreshAccessToken , changeCurrentPassword , updateAccountDetails , updateUserAvatar , updateUserCoverImage}
