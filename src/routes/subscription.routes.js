import { Router } from "express";

import {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
} from "../controllers/subscription.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/:channelId")
    .post(toggleSubscription);

router.route("/channel/:channelId")
    .get(getUserChannelSubscribers);

router.route("/user/:subscriberId")
    .get(getSubscribedChannels);

export default router;