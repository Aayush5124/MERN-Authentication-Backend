import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id");
    }

    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const subscribed = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (subscribed) {
        await Subscription.findByIdAndDelete(subscribed._id);

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Channel unsubscribed successfully"
            )
        );
    }

    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            subscription,
            "Channel subscribed successfully"
        )
    );
});

// Get all subscribers of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
            },
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                _id: "$subscriber._id",
                username: "$subscriber.username",
                fullname: "$subscriber.fullname",
                avatar: "$subscriber.avatar",
                email: "$subscriber.email",
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    );
});

// Get all channels subscribed by a user
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber Id");
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
            },
        },
        {
            $unwind: "$channel",
        },
        {
            $project: {
                _id: "$channel._id",
                username: "$channel.username",
                fullname: "$channel.fullname",
                avatar: "$channel.avatar",
                email: "$channel.email",
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            channels,
            "Subscribed channels fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};