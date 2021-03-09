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
exports.respondInvite = exports.inviteCollaborator = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = void 0;
const createError = require('http-errors');
const Project_1 = __importDefault(require("../models/Project"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const Task_1 = __importDefault(require("../models/Task"));
const Ticket_1 = __importDefault(require("../models/Ticket"));
exports.getProject = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.query;
        const project = yield Project_1.default.findById(projectId)
            .populate({
            path: 'owner',
            model: 'User',
            select: '_id fullName email image'
        })
            .populate({
            path: 'users',
            model: 'User',
            populate: {
                path: 'user',
                model: 'User',
                select: '_id fullName email image'
            }
        });
        if (!project) {
            return next(createError(404, 'Project not found!'));
        }
        const tasks = yield Task_1.default.find({ projectId: projectId });
        return res.json({
            type: 'success',
            message: 'Project has been fetched successfully!',
            project,
            tasksLength: tasks.length
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.createProject = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, color, content } = req.body;
        // @ts-ignore
        const curUserId = req.userId || '5ff5ae879539e3266439096b';
        // Creating new label by using the Mongoose Model Constructor
        const project = new Project_1.default({ _id: id, color, content });
        project.users.push({ user: curUserId, role: 'owner' });
        project.owner = curUserId;
        // Updating the newly created project into the user model
        const user = yield User_1.default.findById(curUserId);
        user.appData.projects.push(project._id);
        // Saving Data
        yield project.save();
        yield user.save();
        // Finally returning the response in json form
        return res.json({
            type: 'success',
            message: 'Project created successfully.',
            projectId: project.id
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.updateProject = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, color, content, taskIds } = req.body;
        // Updating the project by finding the project by its id
        const project = yield Project_1.default.findByIdAndUpdate(projectId, { color, content, taskIds }, { new: true, omitUndefined: true });
        // Finally returning the response in json form
        return res.json({
            type: 'success',
            message: 'Project updated successfully.',
            project
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.deleteProject = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.body;
        // Updating the project by finding the project by its id
        yield Project_1.default.findByIdAndRemove(projectId);
        // Finally returning the response in json form
        return res.json({
            type: 'success',
            message: 'Project deleted successfully.',
            projectId
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.inviteCollaborator = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, toUserId } = req.body;
        // @ts-ignore
        const currentUserId = req.userId;
        const io = req.app.get('socket.io');
        const toUser = yield User_1.default.findById(toUserId);
        const curUser = yield User_1.default.findById(currentUserId);
        const project = yield Project_1.default.findById(projectId);
        // If user is already the collaborator of the given project
        const isAlreadyCollaborator = project.users.some(c => c.user.toString() === toUserId.toString());
        if (isAlreadyCollaborator) {
            return res.json({
                type: 'error',
                // @ts-ignore
                message: `${toUser.fullName} is already the collaborator of the project ${project.content}`,
            });
        }
        // Checking if the notification has already being sent
        const doesExist = yield Notification_1.default.findOne({ type: 'invitation', toUserId: toUserId, fromUserId: currentUserId, data: { projectId: projectId } })
            .populate('ticket');
        console.log('[projectController.ts || Line no. 120 ....]', doesExist);
        // @ts-ignore
        if (doesExist && doesExist.ticket.active) {
            return res.json({
                type: 'error',
                // @ts-ignore
                message: `${toUser.fullName} has already been invited to the project ${project.content}`,
                // @ts-ignore
                notificationId: doesExist
            });
        }
        const ticket = new Ticket_1.default({
            active: true,
            data: { project: projectId },
            timeStamp: new Date().toISOString(),
            duration: '2d',
            owner: currentUserId,
            toUserId
        });
        const message = {
            text: " has been invited you to the project ",
            entity: [
                { index: 0, el: 'span', classes: ["highlight"], data: { user: currentUserId } },
                { index: -1, el: 'span', classes: ["highlight"], data: { project: projectId } },
            ]
        };
        const notification = new Notification_1.default({
            flag: 'important',
            type: 'invitation',
            category: 'project',
            timeStamp: new Date().toISOString(),
            unread: true,
            // @ts-ignore
            message: message,
            data: {
                projectId
            },
            fromUserId: currentUserId,
            toUserId,
            ticket: ticket._id
        });
        toUser.notifications.push(notification._id);
        if (toUser.socketId) {
            io.to(toUser.socketId).emit("notification", {
                // @ts-ignore
                message: `<span class="highlight">${curUser.fullName}</span> has been invited you to the project "<span class="highlight">${project.content}</span>".`
            });
        }
        yield ticket.save();
        yield notification.save();
        yield toUser.save();
        return res.json({
            type: 'success',
            message: 'Invitation sent successfully!',
            notificationId: notification._id
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.respondInvite = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ticketId, isAccept } = req.body;
        // @ts-ignore
        const currentUserId = req.userId;
        const curUser = yield User_1.default.findById(currentUserId);
        if (!curUser)
            return next(createError(404, 'User is invalid!'));
        const ticket = yield Ticket_1.default.findById(ticketId);
        if (!ticket)
            return next(createError(404, 'Ticket is not found!'));
        const project = yield Project_1.default.findById(ticket.data.project);
        if (!project)
            return next(createError(404, 'Project not found!'));
        if (!ticket.active)
            return next(createError(200, 'Ticket is not active now'));
        // Transferring the tasks of the projects to the invited user 
        const tasks = yield Task_1.default.find({ projectId: project._id });
        if (isAccept) {
            // project.users.push({
            // 	user: currentUserId,
            // 	role: 'can_view'
            // });
            yield Project_1.default.findByIdAndUpdate(ticket.data.project, {
                // @ts-ignore
                users: [...project.users, {
                        user: currentUserId,
                        role: 'can_view'
                    }]
            });
            yield User_1.default.findByIdAndUpdate(currentUserId, {
                appData: Object.assign(Object.assign({}, curUser.appData), { projects: [...curUser.appData.projects, project._id], tasks: [...curUser.appData.tasks, ...tasks], taskOrder: [...curUser.appData.taskOrder, ...tasks] })
            }, {
                upsert: true
            });
            yield project.save();
        }
        ticket.active = false;
        yield ticket.save();
        const message = isAccept ? 'Invitation accepted successfully!' : 'Invitation rejected successfully!';
        return res.json({
            type: 'success',
            message: message,
            isAccept,
            project
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
