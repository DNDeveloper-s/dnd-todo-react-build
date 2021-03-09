"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const taskItemSchema = new Schema({
    status: Number,
    content: String,
    completedAt: String,
    id: Schema.Types.ObjectId,
    deleted: Number
});
exports.default = mongoose_1.default.model('TaskItem', taskItemSchema);
