"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const ticketSchema = new Schema({
    data: {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project'
        }
    },
    timeStamp: String,
    active: Boolean,
    duration: String,
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    toUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
});
exports.default = mongoose_1.default.model('Ticket', ticketSchema);
