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
exports.updateLabel = exports.createLabel = void 0;
const createError = require('http-errors');
const Label_1 = __importDefault(require("../models/Label"));
const User_1 = __importDefault(require("../models/User"));
exports.createLabel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, taskIds, color, content } = req.body;
        // @ts-ignore
        const curUserId = req.userId || '5ff5ae879539e3266439096b';
        // Creating new label by using the Mongoose Model Constructor
        const label = new Label_1.default({ _id: id, taskIds, color, content });
        // Updating the newly created label into the user model
        const user = yield User_1.default.findById(curUserId);
        user.appData.labels.push(label._id);
        // Saving Data
        yield label.save();
        yield user.save();
        // Finally returning the response in json form
        return res.json({
            type: 'success',
            message: 'Label created successfully.',
            labelId: label._id
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
exports.updateLabel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId, color, content } = req.body;
        // Updating the label by finding the label by its id
        const label = yield Label_1.default.findByIdAndUpdate(labelId, { color: color, content: content }, { new: true, omitUndefined: true });
        // Finally returning the response in json form
        return res.json({
            type: 'success',
            message: 'Label updated successfully.',
            label
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
