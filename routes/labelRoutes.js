"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuth_1 = __importDefault(require("../middleware/isAuth"));
const router = express_1.default.Router();
const { createLabel, updateLabel } = require('../controllers/labelController');
// These routes comes under 'auth' namespace
router.post('/create', isAuth_1.default, createLabel);
router.post('/update', isAuth_1.default, updateLabel);
exports.default = router;
