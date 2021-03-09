"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    activity: {
        status: String,
        lastOnline: Date,
    },
    socketId: String,
    image: String,
    status: String,
    appData: {
        inbox: [{
                type: Schema.Types.ObjectId,
                ref: 'Task'
            }],
        labels: [{
                type: Schema.Types.ObjectId,
                ref: 'Label'
            }],
        projects: [{
                type: Schema.Types.ObjectId,
                ref: 'Project'
            }],
        tasks: [{
                type: Schema.Types.ObjectId,
                ref: 'Task'
            }],
        taskOrder: [{
                type: Schema.Types.ObjectId,
                ref: 'Task'
            }],
        global: {
            toggleCollapse: Object
        }
    },
    friends: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    notifications: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Notification'
        }
    ],
    conversations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Conversation'
        }
    ]
}, { timeStamps: true });
userSchema.index({ fullName: 'text', email: 'text' });
exports.default = mongoose.model('User', userSchema);
