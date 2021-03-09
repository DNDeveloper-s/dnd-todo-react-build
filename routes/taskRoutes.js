"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuth_1 = __importDefault(require("../middleware/isAuth"));
const router = express_1.default.Router();
const { createTask, createTaskItem, dropTask, getTask, onDropTaskItem, updateTask, updateTaskItem } = require('../controllers/taskController');
// These routes comes under 'task' namespace
router.get('/get', isAuth_1.default, getTask);
router.post('/create', isAuth_1.default, createTask);
router.post('/drop', isAuth_1.default, dropTask);
router.post('/update', isAuth_1.default, updateTask);
router.post('/create-task-item', isAuth_1.default, createTaskItem);
router.post('/update-task-item', isAuth_1.default, updateTaskItem);
router.post('/drop-task-item', isAuth_1.default, onDropTaskItem);
exports.default = router;
