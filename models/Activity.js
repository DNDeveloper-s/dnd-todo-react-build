"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const activitySchema = new Schema({
    type: String,
    key: String,
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    label: {
        type: Schema.Types.ObjectId,
        ref: 'Label'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // message: {
    //     text: String,
    //     entity: [{
    //         index: Number,
    //         el: String,
    //         classes: [{type: String}],
    //         keys: [{type: String}],
    //         data: {
    //             project: {
    //                 type: Schema.Types.ObjectId,
    //                 ref: 'Project'
    //             },
    //             task: {
    //                 type: Schema.Types.ObjectId,
    //                 ref: 'Task'
    //             },
    //             label: {
    //                 type: Schema.Types.ObjectId,
    //                 ref: 'Label'
    //             },
    //             user: {
    //                 type: Schema.Types.ObjectId,
    //                 ref: 'User'
    //             },
    //         }
    //     }]
    // },
    timeStamp: String,
    oldData: String,
    updatedData: String
});
exports.default = mongoose_1.default.model('Activity', activitySchema);
