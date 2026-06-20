import jwt from "jsonwebtoken";

import ApiError from "../utils/Apierror.js";
import asyncHandler from "../utils/asynchandler.js";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(
    async (req, res, next) => {

        try {

            // get token from cookie or Authorization header

            const token =
                req.cookies?.accessToken ||
                req.header("Authorization")?.replace(
                    "Bearer ",
                    ""
                );

            // if token not found

            if (!token) {

                throw new ApiError(
                    401,
                    "Unauthorized request"
                );
            }

            // verify token using secret key

            const decodedToken =
                jwt.verify(
                    token,
                    process.env.ACCESS_TOKEN_SECRET
                );

            // find user from database

            const user =
                await User.findById(
                    decodedToken?._id
                ).select(
                    "-password -refreshToken"
                );

            // if user not found

            if (!user) {

                throw new ApiError(
                    401,
                    "Invalid Access Token"
                );
            }

            // attach user to request object

            req.user = user;

            // move to next middleware

            next();

        } catch (error) {

            throw new ApiError(
                401,
                error?.message ||
                "Invalid access token"
            );
        }
    }
);