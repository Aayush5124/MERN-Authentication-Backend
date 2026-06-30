import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const comments = await Comment.find({
        video: videoId
    })
        .populate("owner", "username fullname avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const totalComments = await Comment.countDocuments({
        video: videoId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                totalComments,
                currentPage: Number(page),
                totalPages: Math.ceil(totalComments / limit)
            },
            "Comments fetched successfully"
        )
    );
});

const addComment = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment cannot be empty");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            comment,
            "Comment added successfully"
        )
    );
});

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment Id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own comment");
    }

    comment.content = content;

    await comment.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    );
});

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment Id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};