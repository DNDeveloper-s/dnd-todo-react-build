"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const notificationSchema = new Schema({
    flag: String,
    type: String,
    category: String,
    message: {
        text: String,
        entity: [{
                index: Number,
                el: String,
                classes: [{ type: String }],
                data: {
                    project: {
                        type: Schema.Types.ObjectId,
                        ref: 'Project'
                    },
                    user: {
                        type: Schema.Types.ObjectId,
                        ref: 'User'
                    },
                }
            }]
    },
    ticket: {
        type: Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    data: Object,
    unread: Boolean,
    fromUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    toUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    timeStamp: String
});
exports.default = mongoose_1.default.model('Notification', notificationSchema);
