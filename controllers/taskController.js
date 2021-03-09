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
exports.updateTaskItem = exports.createTaskItem = exports.onDropTaskItem = exports.getTask = exports.dropTask = exports.updateTask = exports.createTask = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Task_1 = __importDefault(require("../models/Task"));
const constants_1 = require("../helpers/constants");
const Project_1 = __importDefault(require("../models/Project"));
const Activity_1 = __importDefault(require("../models/Activity"));
const TaskItem_1 = __importDefault(require("../models/TaskItem"));
const utils_1 = require("../helpers/utils");
const createError = require('http-errors');
exports.createTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, priority, deleted, isFullDay, projectId, labelIds, status, content, createType, startDate, inItemMode, items, childTasks, parentTask, reminders, } = req.body;
        const createdAt = new Date().toISOString();
        // @ts-ignore
        const curUserId = req.userId || '5ff5ae879539e3266439096b';
        // Creating new task by using the Mongoose Model Constructor
        // return res.json({
        // 	type: 'error',
        // 	message: 'This is just testing error. Nothing wrong in serious'
        // });
        const taskId = mongoose_1.default.Types.ObjectId(id);
        const newTaskObj = {
            _id: taskId,
            priority,
            deleted,
            isFullDay,
            projectId,
            labelIds,
            status,
            content,
            startDate,
            inItemMode,
            items,
            childTasks,
            parentTask,
            reminders,
            createdAt,
            creator: curUserId,
            subscribers: []
        };
        // Updating the newly created task into the user model
        const user = yield User_1.default.findById(curUserId);
        // Case 1. If task has been added without any reference
        // so it will be added just to the top of the array in the top level
        if (!createType) {
            user.appData.taskOrder.splice(0, 0, id);
        }
        // Case 2. If added as some extra info
        // like creating task with a reference
        // of its sibling or child
        if (createType) {
            const { path, as } = createType;
            // Here "path" is the tree path of the reference task
            // eg: ["task-1", "task-2"] is "path"
            // and "as" is the relation with the reference task
            // child or sibling
            // refTask is just the reference task
            // and grabbing the refTaskId from the path
            // its the last item in the path array
            const refTask = yield Task_1.default.findById(path[path.length - 1]);
            if (!refTask) {
                return next(createError(500, 'Reference Task is undefined', { errorKey: 'serverErr' }));
            }
            // Case 1. If added as sibling
            if (as === constants_1.constants.AS_SIBLING) {
                // In case of sibling
                // There are two cases also
                // Case 1. When the reference task lies on the top level
                // Hence refTask won't have any parent task
                // @ts-ignore
                if (!refTask.parentTask) {
                    // Get the index of the reference task on the top level [taskOrder]
                    const refIndex = user.appData.taskOrder.findIndex((c) => c.toString() === refTask._id.toString());
                    // and then add the newTask after the index of refTask to the top level [taskOrder]
                    // Adding next to the refIndex, so adding "1"
                    user.appData.taskOrder.splice(refIndex + 1, 0, newTaskObj._id.toString());
                }
                // Case 2. When the reference task lies somewhere in the inner level
                // @ts-ignore
                if (refTask.parentTask) {
                    // Get the parent task of the reference task
                    // @ts-ignore
                    const parentOfRefTask = yield Task_1.default.findById(refTask.parentTask);
                    if (!parentOfRefTask) {
                        return next(createError(500, 'Parent of Reference Task is undefined', { errorKey: 'serverErr' }));
                    }
                    // And get the index of the reference task
                    // @ts-ignore
                    const refTaskIndex = parentOfRefTask.childTasks.findIndex((c) => c.toString() === refTask._id.toString());
                    // and then add the newTask to the parentTasks's childTasks array
                    // after the index of reference task
                    // Adding next to the refIndex, so adding "1"
                    // @ts-ignore
                    parentOfRefTask.childTasks.splice(refTaskIndex + 1, 0, newTaskObj._id);
                    // Update the parent task
                    newTaskObj.parentTask = parentOfRefTask._id;
                    // Saving ParentOfRefTask
                    yield parentOfRefTask.save();
                }
            }
            // Case 2. If added as child
            if (as === constants_1.constants.AS_CHILD) {
                // Here, its so simple as we don't need to get any index to add
                // So, just add the newTask to top of the refTask's childTasks array
                // @ts-ignore
                refTask.childTasks.splice(0, 0, newTaskObj._id);
                // And Yes,
                // Update the parent task
                newTaskObj.parentTask = refTask._id;
            }
            // Saving RefTask
            yield refTask.save();
        }
        const task = new Task_1.default(newTaskObj);
        // Saving Data
        user.appData.tasks.push(taskId);
        // Tracking Activity
        // const message = {
        // 	text: " created the Task ",
        // 	entity: [
        // 		{index: 0, el: 'span', classes: ["highlight-blue"], key: 'user', data: {user: curUserId}},
        // 	]
        // };
        // const activityObj = {
        // 	key: 'task',
        // 	type: 'createTask',
        // 	task: taskId,
        // 	message: message,
        // 	timeStamp: new Date().toISOString(),
        // };
        //
        // const activity = new Activity(activityObj);
        // task.activities.push(activity._id);
        // await activity.save();
        yield task.save();
        yield user.save();
        // Sending it to all the collaborators if it is related to the project
        yield sendSubscriptionToUsers(req, res, next, { projectId, taskId, excludeOwner: true }, (userData, io) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield User_1.default.findById(userData.user._id);
            user.appData.tasks.push(taskId);
            if (!createType) {
                user.appData.taskOrder.splice(0, 0, taskId);
            }
            yield user.save();
            if (user.socketId)
                io.to(user.socketId).emit('task_created', { projectId, taskId });
        }));
        // Finally returning the response in json form
        return res.json({
            type: 'success',
            message: 'Task created successfully.',
            taskId: task._id
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
function omitUndefined(obj) {
    const resObj = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
            resObj[key] = obj[key];
        }
    }
    return resObj;
}
function objectString(obj) {
    let str = '';
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
            str += `${key}=${obj[key]}&`;
        }
    }
    return str.slice(0, -1);
}
/**
 *
 * @param req
 * @param res
 * @param next
 * @param projectId
 * @param excludeOwner
 * @param taskId
 * @param cb
 */
function sendSubscriptionToUsers(req, res, next, { projectId, taskId, excludeOwner }, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        const curUserId = req.userId;
        // Sending it to all the collaborators if it is related to the project
        if (projectId) {
            const project = yield Project_1.default.findById(projectId);
            const io = req.app.get('socket.io');
            if (project) {
                for (let i = 0; i < project.users.length; i++) {
                    const userData = project.users[i];
                    if ((excludeOwner && userData.user._id.toString() !== curUserId.toString()) || !excludeOwner) {
                        yield cb(userData, io);
                    }
                }
            }
        }
    });
}
exports.updateTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId, priority, isFullDay, projectId, labelIds, status, content, startDate, inItemMode, deleted, childTasks, parentTask, reminders, createdAt, } = req.body;
        // @ts-ignore | Current User id
        const curUserId = req.userId || '5ff5ae879539e3266439096b';
        const updatedObj = {
            priority,
            isFullDay,
            projectId,
            labelIds,
            deleted,
            status,
            content,
            startDate,
            inItemMode,
            childTasks,
            parentTask,
            reminders,
            createdAt,
        };
        let task = yield Task_1.default.findById(taskId);
        const curUser = yield User_1.default.findById(curUserId);
        // Tracking Activity
        const updatedObjWithOutUndefined = omitUndefined(updatedObj);
        function oldObj(obj) {
            const res = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    res[key] = task[key];
                }
            }
            return res;
        }
        const activityObj = {
            type: 'updateTask',
            key: 'task user',
            task: taskId,
            updatedData: objectString(updatedObjWithOutUndefined),
            oldData: objectString(oldObj(updatedObjWithOutUndefined)),
            user: curUserId,
            timeStamp: new Date().toISOString(),
        };
        // Switching task between projects
        // Case 1. Moving from the highest level taskOrder
        // In this case we don't need to anything special
        // Case 2. Moving from the lower level
        if (task.parentTask && projectId) {
            // Here, We need to do one thing before moving to new project
            // 1. Add the task to taskOrder
            // Adding it in the subscription of webSockets
            // 2. Remove the task from the parent's childTasks array
            const parentTask = yield Task_1.default.findById(task.parentTask);
            // a. firstly getting the index of taskId in the parentTask's childTasks  Array
            const indexOfTask = parentTask.childTasks.findIndex((c) => c === taskId);
            // b. now, its time to splice [remove] from the array
            parentTask.childTasks.splice(indexOfTask, 1);
            // 3. Update the parentTask of the task
            task.parentTask = null;
            yield parentTask.save();
            yield task.save();
        }
        if (projectId) {
            // This will happen no matter what eventually
            yield moveToProjectRecursively(taskId);
            function moveToProjectRecursively(taskId) {
                return __awaiter(this, void 0, void 0, function* () {
                    const curTask = yield Task_1.default.findByIdAndUpdate(taskId, { projectId }, { new: true, omitUndefined: true });
                    for (let childId of curTask.childTasks) {
                        yield moveToProjectRecursively(childId);
                    }
                });
            }
        }
        else {
            // Updating the task by finding the task by its id
            task = yield Task_1.default.findByIdAndUpdate(taskId, Object.assign(Object.assign({}, updatedObj), { updatedAt: new Date().toISOString() }), { new: true, omitUndefined: true });
        }
        // Deleting Items if task is coming off inItemMode
        if (utils_1.isDefined(inItemMode) && !inItemMode) {
            for (let item of task.items) {
                yield TaskItem_1.default.findByIdAndDelete(item);
            }
            task.items = [];
        }
        // Saving Activity Object
        const activity = new Activity_1.default(activityObj);
        task.activities.push(activity._id);
        yield activity.save();
        yield task.save();
        // @ts-ignore
        yield sendSubscriptionToUsers(req, res, next, { projectId: task.projectId, taskId }, (userData, io) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield User_1.default.findById(userData.user._id);
            console.log('[taskController.ts || Line no. 250 ....]', task);
            if (task.parentTask && projectId) {
                // Here, We need to do one thing before moving to new project
                // 1. Add the task to taskOrder
                user.appData.taskOrder.splice(0, 0, taskId);
                yield user.save();
            }
            if (user.socketId) { // @ts-ignore
                io.to(user.socketId).emit('task_updated', { projectId: task.projectId, taskId });
            }
        }));
        // Finally returning the response in json form
        return res.json({
            type: 'success',
            message: 'Task updated successfully.',
            task
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.dropTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { source, destination: dest, dropAsType, dragFrom, } = req.body;
        // @ts-ignore
        const curUserId = req.userId || '5ff5ae879539e3266439096b';
        console.log(source, dest, dropAsType, dragFrom);
        const draggedId = source.id;
        const droppedId = dest.id;
        function addToInnerLevel() {
            return __awaiter(this, void 0, void 0, function* () {
                // Adding to Inner Level
                // 1. Adding to Child Tasks
                const droppedToParentId = dest.path[dest.path.length - 2];
                const droppedToParentTask = yield Task_1.default.findById(droppedToParentId);
                if (!droppedToParentTask) {
                    return next(createError(500, 'Dropped to Parent Task is undefined', { errorKey: 'serverErr' }));
                }
                // @ts-ignore
                const droppedIndex = droppedToParentTask.childTasks.findIndex((c) => c.toString() === dest.id);
                // @ts-ignore
                droppedToParentTask.childTasks.splice(droppedIndex + 1, 0, draggedId);
                // 2. Updating the expand Count
                // const poppedDestPath = [...dest.path];
                // poppedDestPath.pop();
                // console.log(poppedDestPath);
                // poppedDestPath.forEach((destId) => {
                //   state.tasks[destId].expandCount +=
                //     state.tasks[draggedId].expandCount + 1;
                // });
                // 3. Updating the parent task
                const draggedTask = yield Task_1.default.findById(draggedId);
                if (!draggedTask) {
                    return next(createError(500, 'Dragged task is undefined', { errorKey: 'serverErr' }));
                }
                // @ts-ignore
                draggedTask.parentTask = droppedToParentId;
                // Saving both the task
                yield droppedToParentTask.save();
                yield draggedTask.save();
            });
        }
        function removeFromInnerLevel() {
            return __awaiter(this, void 0, void 0, function* () {
                // Removing from Inner Level
                const draggedFromParentId = source.path[source.path.length - 2];
                const draggedFromParentTask = yield Task_1.default.findById(draggedFromParentId);
                if (!draggedFromParentTask) {
                    return next(createError(500, 'Dragged from Parent Task is undefined', { errorKey: 'serverErr' }));
                }
                // @ts-ignore
                const draggedIndex = draggedFromParentTask.childTasks.findIndex((c) => c.toString() === draggedId);
                // @ts-ignore
                draggedFromParentTask.childTasks.splice(draggedIndex, 1);
                // 2. Updating the expand Count
                // const poppedSrcPath = [...source.path];
                // poppedSrcPath.pop();
                // console.log(poppedSrcPath);
                // poppedSrcPath.forEach((srcId) => {
                //   state.tasks[srcId].expandCount -=
                //     state.tasks[draggedId].expandCount + 1;
                // });
                // Saving the task
                yield draggedFromParentTask.save();
            });
        }
        // Case 1 - Moving inside Top Level
        if (source.path.length === 1 && dest.path.length === 1) {
            // Fetching the user appData
            const user = yield User_1.default.findById(curUserId);
            if (!user) {
                return next(createError(500, 'Invalid UserId Request!', { errorKey: 'serverErr' }));
            }
            // Removing Part
            // Removing from taskOrder
            const draggedIndex = user.appData.taskOrder.findIndex((c) => c.toString() === draggedId);
            user.appData.taskOrder.splice(draggedIndex, 1);
            // Adding Part
            if (dropAsType === constants_1.constants.AS_SIBLING) {
                const droppedIndex = user.appData.taskOrder.findIndex((c) => c.toString() === droppedId);
                user.appData.taskOrder.splice(droppedIndex + 1, 0, draggedId);
            }
            // Saving it to the appData
            yield user.save();
        }
        // Case 2 - Moving from Top Level to Inner Level
        else if (source.path.length === 1 && dest.path.length >= 2) {
            // Fetching the user appData
            const user = yield User_1.default.findById(curUserId);
            if (!user) {
                return next(createError(500, 'Invalid UserId Request!', { errorKey: 'serverErr' }));
            }
            // Removing Part
            // Removing from taskOrder
            const draggedIndex = user.appData.taskOrder.findIndex((c) => c.toString() === draggedId);
            user.appData.taskOrder.splice(draggedIndex, 1);
            // Adding Part
            if (dropAsType === constants_1.constants.AS_SIBLING) {
                yield addToInnerLevel();
            }
            // Saving it to the appData
            yield user.save();
        }
        // Case 3 - Moving from Inner Lever to Top Level
        else if (source.path.length >= 2 && dest.path.length === 1) {
            // Fetching the user appData
            const user = yield User_1.default.findById(curUserId);
            if (!user) {
                return next(createError(500, 'Invalid UserId Request!', { errorKey: 'serverErr' }));
            }
            // Removing Part
            yield removeFromInnerLevel();
            // Adding Part
            if (dropAsType === constants_1.constants.AS_SIBLING) {
                // Adding to Top Level
                // 1. Adding to Task Order
                const droppedIndex = user.appData.taskOrder.findIndex((c) => c.toString() === droppedId);
                user.appData.taskOrder.splice(droppedIndex + 1, 0, draggedId);
                // 2. Updating the parent task
                const draggedTask = yield Task_1.default.findById(draggedId);
                if (!draggedTask) {
                    return next(createError(500, 'Dragged task is undefined', { errorKey: 'serverErr' }));
                }
                // @ts-ignore
                draggedTask.parentTask = null;
                // Saving the Task
                yield draggedTask.save();
                // Saving it to the appData
                yield user.save();
            }
        }
        // Case 4 - Moving inside Inner Level
        else if (source.path.length >= 2 && dest.path.length >= 2) {
            // Removing Part
            yield removeFromInnerLevel();
            // Adding Part
            if (dropAsType === constants_1.constants.AS_SIBLING) {
                // Adding to Inner Level
                yield addToInnerLevel();
            }
        }
        // Handling case for dropping as child
        if (dropAsType === constants_1.constants.AS_CHILD) {
            // Adding to childTasks array
            const droppedToParentId = dest.path[dest.path.length - 1];
            const droppedToParentTask = yield Task_1.default.findById(droppedToParentId);
            if (!droppedToParentTask) {
                return next(createError(500, 'Dropped to Parent Task is undefined', { errorKey: 'serverErr' }));
            }
            // @ts-ignore
            droppedToParentTask.childTasks.splice(0, 0, draggedId);
            // 2. Updating the expand Count
            // const poppedDestPath = [...dest.path];
            // console.log(poppedDestPath);
            // poppedDestPath.forEach((destId) => {
            //   state.tasks[destId].expandCount +=
            //     state.tasks[draggedId].expandCount + 1;
            // });
            // 3. Updating the parent task
            const draggedTask = yield Task_1.default.findById(draggedId);
            if (!draggedTask) {
                return next(createError(500, 'Dragged task is undefined', { errorKey: 'serverErr' }));
            }
            // @ts-ignore
            draggedTask.parentTask = droppedToParentId;
            // Saving both the task
            yield droppedToParentTask.save();
            yield draggedTask.save();
        }
        return res.json({
            type: 'success',
            message: 'Task dropped successfully!'
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
// TODO: Validate to get the task
exports.getTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.query;
        // @ts-ignore
        // const curUserId = req.userId;
        const task = yield Task_1.default.findById(taskId)
            .populate({
            path: 'items activities',
            populate: {
                path: 'user',
                select: 'fullName email image _id'
            }
        });
        if (!task) {
            return next(createError(404, 'Task not found!'));
        }
        return res.json({
            type: 'success',
            message: 'Task fetched successfully!',
            task
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.onDropTaskItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId, draggedId, droppedId } = req.body;
        const curTask = yield Task_1.default.findById(taskId);
        const curTaskItem = curTask.items.find((c) => c === draggedId);
        // Removing the dragged id from its initial position
        // Finding the index of the draggedId in array
        const draggedIndex = curTask.items.findIndex((c) => c === draggedId);
        curTask.items.splice(draggedIndex, 1);
        // Now its time to add it to the new place in the array
        // Finding the index of the droppedId in arrau
        // to be placed after the item
        const droppedIndex = curTask.items.findIndex((c) => c === droppedId);
        curTask.items.splice(droppedIndex + 1, 0, curTaskItem);
        yield curTask.save();
        // @ts-ignore
        yield sendSubscriptionToUsers(req, res, next, { projectId: curTask.projectId, taskId }, (userData, io) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield User_1.default.findById(userData.user._id);
            if (user.socketId) { // @ts-ignore
                io.to(user.socketId).emit('task_updated', { projectId: curTask.projectId, taskId });
            }
        }));
        return res.json({
            type: 'success',
            message: 'Task Item dropped successfully!',
            task: curTask
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.createTaskItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { itemId, taskId, items, createAfterItemId, content, status } = req.body;
        const curTask = yield Task_1.default.findById(taskId);
        if (items) {
            for (let item of items) {
                const taskItem = new TaskItem_1.default({
                    _id: item.id,
                    id: item.id,
                    content: item.content,
                    status: item.status
                });
                curTask.items.push(item.id);
                curTask.inItemMode = true;
                yield taskItem.save();
            }
        }
        else {
            const taskItem = new TaskItem_1.default({
                _id: itemId,
                id: itemId,
                content: content || '',
                status
            });
            if (!createAfterItemId) {
                curTask.items.push(itemId);
            }
            else {
                const createAfterItemIdIndex = curTask.items.findIndex(c => c === createAfterItemId);
                curTask.items.splice(createAfterItemIdIndex + 1, 0, itemId);
            }
            yield taskItem.save();
        }
        yield curTask.save();
        // @ts-ignore
        yield sendSubscriptionToUsers(req, res, next, { projectId: curTask.projectId, taskId }, (userData, io) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield User_1.default.findById(userData.user._id);
            if (user.socketId) { // @ts-ignore
                io.to(user.socketId).emit('task_updated', { projectId: curTask.projectId, taskId });
            }
        }));
        return res.json({
            type: 'success',
            message: 'Task Item created successfully!',
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.updateTaskItem = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { itemId, taskId, status, content, completedAt } = req.body;
        const curTask = yield Task_1.default.findById(taskId);
        const taskItem = yield TaskItem_1.default.findByIdAndUpdate(itemId, { status, content, completedAt }, { new: true, omitUndefined: true });
        // @ts-ignore
        yield sendSubscriptionToUsers(req, res, next, { projectId: curTask.projectId, taskId }, (userData, io) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield User_1.default.findById(userData.user._id);
            if (user.socketId) { // @ts-ignore
                io.to(user.socketId).emit('task_updated', { projectId: curTask.projectId, taskId });
            }
        }));
        return res.json({
            type: 'success',
            message: 'Task Item updated successfully!',
            taskItem
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
