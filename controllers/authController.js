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
const User_1 = __importDefault(require("../models/User"));
const bcrypt = require('bcrypt');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
module.exports.postSignup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { fullName, email, password } = req.body;
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(createError(401, errors.errors[0].msg, { errorKey: errors.errors[0].param }));
        }
        const hashedPw = yield bcrypt.hash(password, 12);
        // Fetching user
        // Checking if user is already exists
        let user = yield User_1.default.findOne({ email });
        if (user) {
            return next(createError(401, 'User with the email already exists', { errorKey: 'email' }));
        }
        user = new User_1.default({
            fullName,
            email,
            password: hashedPw,
            image: '/assets/images/default.jpg'
        });
        yield user.save();
        return res.json({
            type: 'success',
            message: 'User registered successfully.',
            user: {
                fullName,
                email
            }
        });
    }
    catch (error) {
        return next(createError(500, error.message, { errorKey: 'serverErr' }));
    }
});
module.exports.postLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(createError(401, errors.errors[0].msg, { errorKey: errors.errors[0].param }));
        }
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            return next(createError(401, 'User with the email not found!', { errorKey: 'email' }));
        }
        const doMatch = yield bcrypt.compare(password, user.password);
        if (!doMatch) {
            return next(createError(401, 'Password doesn\'t match', { errorKey: 'password' }));
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, // Data passed with the token
        process.env.JWT_SECRET_KEY, // Secret key
        { expiresIn: '2312h' } // Expiration time 
        );
        return res.json({
            type: 'success',
            message: 'Logged in successfully',
            token: token,
            userId: user._id.toString()
        });
    }
    catch (e) {
        return next(createError(500, e.message, { errorKey: 'serverErr' }));
    }
});
