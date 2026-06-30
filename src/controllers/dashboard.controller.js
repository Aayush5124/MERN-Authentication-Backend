import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user?._id;

    if (!channelId) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Total Videos
    const totalVideos = await Video.countDocuments({
        owner: channelId,
    });

    // Total Views
    const totalViewsResult = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views",
                },
            },
        },
    ]);

    const totalViews =
        totalViewsResult.length > 0 ? totalViewsResult[0].totalViews : 0;

    // Total Subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId,
    });

    // Get all videos uploaded by channel
    const channelVideos = await Video.find({
        owner: channelId,
    }).select("_id");

    const videoIds = channelVideos.map((video) => video._id);

    // Total Likes
    const totalLikes = await Like.countDocuments({
        video: {
            $in: videoIds,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews,
                totalSubscribers,
                totalLikes,
            },
            "Channel stats fetched successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user?._id;

    if (!channelId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const videos = await Video.find({
        owner: channelId,
    })
        .populate("owner", "username fullname avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    );
});

export {
    getChannelStats,
    getChannelVideos,
};