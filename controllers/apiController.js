"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationStatus = exports.getNotifications = exports.handleUserSearch = exports.validateToken = exports.postAppGlobalData = exports.getAppData = exports.getCurrentUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const constants_1 = require("../helpers/constants");
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
exports.getCurrentUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const curUserId = req.userId || '5ff5ae879539e3266439096b';
    try {
        const user = yield User_1.default.findById(curUserId);
        if (!user) {
            return next(createError(400, 'Invalid UserId request!'));
        }
        return res.json({
            type: 'success',
            message: 'User fetched successfully!',
            user: {
                fullName: user.fullName,
                email: user.email,
                image: user.image
            }
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.getAppData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const curUserId = req.userId || '5ff5ae879539e3266439096b';
    try {
        // const io = req.app.get('socket.io');
        const user = yield User_1.default.findById(curUserId)
            .populate({
            path: 'appData.tasks',
            populate: {
                path: 'items activities',
                populate: {
                    path: 'user',
                    select: 'fullName email image _id'
                }
            }
        })
            .populate({
            path: 'appData.projects',
            populate: {
                path: 'users.user',
                select: 'fullName email _id image status'
            }
        })
            .populate('appData.labels')
            .populate({
            path: 'notifications',
            model: 'Notification',
            populate: {
                path: 'fromUserId toUserId message.entity.data.project message.entity.data.user ticket',
                select: 'fullName email image _id content owner color deleted active'
            }
        });
        if (!user) {
            return next(createError(400, 'Invalid UserId request!'));
        }
        // const formTasks = user.appData.tasks.map(taskId => {})
        // io.emit('chat', {message: 'Thanks to all of you.'});
        return res.json({
            type: 'success',
            message: 'User App Data fetched successfully!',
            appData: user.appData,
            notifications: user.notifications
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.postAppGlobalData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { global, toggleCollapse = {} } = req.body;
    const { dragFrom, taskId, expanded } = toggleCollapse;
    try {
        // @ts-ignore
        const curUserId = req.userId || '5ff5ae879539e3266439096b';
        const user = yield User_1.default.findById(curUserId);
        if (!user) {
            return next(createError(400, 'Invalid UserId request!'));
        }
        user.appData.global = global;
        if (Object.keys(toggleCollapse).length > 0)
            user.appData.global.toggleCollapse[dragFrom + constants_1.constants.SEPARATOR + taskId] = expanded;
        yield user.save();
        return res.json({
            type: 'success',
            message: 'App Global Data posted successfully!',
            dragFrom, taskId, expanded
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.validateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        let decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decodedToken) {
            return next(createError(401, 'Not authorized!'));
        }
        // Fetching user from the database
        const user = yield User_1.default.findById(decodedToken.userId);
        if (!user) {
            return next(createError(401, 'Not authorized!'));
        }
        return res.json({
            type: 'success',
            message: 'Token is validated successfully!',
            info: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                image: user.image
            }
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.handleUserSearch = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { value } = req.body;
    // @ts-ignore
    const currentUserId = req.userId;
    try {
        if (value.trim().length === 0) {
            return res.json({
                type: 'success',
                message: 'Users searching have been done!',
                users: []
            });
        }
        const users = yield User_1.default.find({
            $or: [{ fullName: { $regex: value, $options: 'i' } }, { email: { $regex: value, $options: 'i' } }],
            $and: [{ _id: { $ne: currentUserId } }]
        })
            .limit(10)
            .select(['fullName', 'image', 'email']);
        return res.json({
            type: 'success',
            message: 'Users searching have been done!',
            users
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.getNotifications = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const curUserId = req.userId || '5ff5ae879539e3266439096b';
    try {
        const user = yield User_1.default.findById(curUserId)
            .populate({
            path: 'notifications',
            model: 'Notification',
            populate: {
                path: 'fromUserId toUserId message.entity.data.project message.entity.data.user ticket',
                select: 'fullName email image _id content owner color deleted active'
            }
        });
        if (!user) {
            return next(createError(404, 'User not found!'));
        }
        return res.json({
            type: 'success',
            message: 'Notifications fetched successfully',
            notifications: user.notifications
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.updateNotificationStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationIds } = req.body;
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
