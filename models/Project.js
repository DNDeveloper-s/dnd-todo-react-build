"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const projectSchema = new Schema({
    type: String,
    color: String,
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    users: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            role: String
        }],
    deleted: Number
});
exports.default = mongoose_1.default.model('Project', projectSchema);
