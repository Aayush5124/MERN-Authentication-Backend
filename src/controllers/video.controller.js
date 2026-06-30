import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {

    let {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const matchStage = {
        isPublished: true
    };

    if (query) {
        matchStage.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: query,
                    $options: "i"
                }
            }
        ];
    }

    if (userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const aggregate = Video.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        }
    ]);

    const options = {
        page,
        limit
    };

    const videos = await Video.aggregatePaginate(
        aggregate,
        options
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched successfully"
        )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(
            400,
            "Title and Description are required"
        );
    }

    const videoLocalPath =
        req.files?.videoFile?.[0]?.path;

    const thumbnailLocalPath =
        req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(
            400,
            "Video file is required"
        );
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(
            400,
            "Thumbnail is required"
        );
    }

    const uploadedVideo =
        await uploadOnCloudinary(videoLocalPath);

    const uploadedThumbnail =
        await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedVideo) {
        throw new ApiError(
            500,
            "Video upload failed"
        );
    }

    if (!uploadedThumbnail) {
        throw new ApiError(
            500,
            "Thumbnail upload failed"
        );
    }

    const video = await Video.create({
        title,
        description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        duration: uploadedVideo.duration,
        owner: req.user._id,
        isPublished: true
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            video,
            "Video uploaded successfully"
        )
    );
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId)
        .populate("owner", "username fullname avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Increase views
    video.views += 1;
    await video.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    );
});

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Only owner can update
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this video"
        );
    }

    // Upload new thumbnail if provided
    if (req.file?.path) {

        const thumbnail =
            await uploadOnCloudinary(req.file.path);

        if (!thumbnail) {
            throw new ApiError(
                500,
                "Thumbnail upload failed"
            );
        }

        video.thumbnail = thumbnail.url;
    }

    // Update title if provided
    if (title && title.trim() !== "") {
        video.title = title;
    }

    // Update description if provided
    if (description && description.trim() !== "") {
        video.description = description;
    }

    await video.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video updated successfully"
        )
    );
});

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Only owner can delete
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this video"
        );
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Video deleted successfully"
        )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Only owner can publish/unpublish
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this video"
        );
    }

    video.isPublished = !video.isPublished;

    await video.save({
        validateBeforeSave: false
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            `Video ${
                video.isPublished
                    ? "published"
                    : "unpublished"
            } successfully`
        )
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};