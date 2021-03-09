"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuth_1 = __importDefault(require("../middleware/isAuth"));
const router = express_1.default.Router();
const { respondInvite, createProject, deleteProject, getProject, inviteCollaborator, updateProject } = require('../controllers/projectController');
// These routes comes under 'auth' namespace
router.get('/project', isAuth_1.default, getProject);
router.post('/respond-invite', isAuth_1.default, respondInvite);
router.post('/create', isAuth_1.default, createProject);
router.post('/delete', isAuth_1.default, deleteProject);
router.post('/update', isAuth_1.default, updateProject);
router.post('/invite-collaborator', isAuth_1.default, inviteCollaborator);
exports.default = router;
