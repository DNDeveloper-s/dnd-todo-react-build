"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const isAuth = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        return next(createError(401, 'Not authorized!'));
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    }
    catch (e) {
        return next(createError(500, 'Something went wrong with decoding token!'));
    }
    if (!decodedToken) {
        return next(createError(401, 'Not authorized!'));
    }
    // @ts-ignore
    req.userId = decodedToken.userId;
    // @ts-ignore
    next();
};
exports.default = isAuth;
