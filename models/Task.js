"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const taskSchema = new Schema({
    priority: Number,
    deleted: Number,
    isFullDay: Boolean,
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    labelIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Label'
        }],
    status: {
        completed: Boolean,
        prevColumnId: String
    },
    activities: [{
            type: Schema.Types.ObjectId,
            ref: 'Activity'
        }],
    content: String,
    startDate: String,
    inItemMode: Boolean,
    items: [{
            type: Schema.Types.ObjectId,
            ref: 'TaskItem'
        }],
    childTasks: [{
            type: Schema.Types.ObjectId,
            ref: 'Task'
        }],
    parentTask: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    },
    subscribers: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reminders: Array,
    createdAt: String,
    updatedAt: String,
});
exports.default = mongoose_1.default.model('Task', taskSchema);
