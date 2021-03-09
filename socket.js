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
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User_1 = __importDefault(require("./models/User"));
// const options = {
//     allowUpgrades: true,
//     transports: [ 'polling', 'websocket' ],
//     pingTimeout: 9000,
//     pingInterval: 3000,
//     cookie: 'mycookie',
//     httpCompression: true,
//     origins: '*:*'
// };
module.exports = (server) => {
    const io = require('socket.io')(server, {
        cors: {
            origin: "http://localhost:3000",
            credentials: true
        }
    });
    // io.set('origins', 'http://192.168.1.8:* http://localhost:* http://domain.net:* http://domain.gov:*');
    io.use(function (socket, next) {
        if (socket.handshake.query && socket.handshake.query.token) {
            // console.log('[socket.ts || Line no. 10 ....]', socket.handshake.query);
            let decodedToken;
            try {
                decodedToken = jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET_KEY);
                socket.decodedToken = decodedToken;
            }
            catch (e) {
                return next(createError(500, 'Something went wrong!'));
            }
            if (!decodedToken) {
                return next(createError(401, 'Not authorized!'));
            }
            next();
        }
    })
        .on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const connectedUserId = socket.decodedToken.userId;
        const connectedUser = yield User_1.default.findById(connectedUserId);
        if (!connectedUser) {
            return;
        }
        console.log('[socket.js || Line no. 29 ....]', 'Connected to ' + socket.id);
        // return;
        connectedUser.status = 'online';
        connectedUser.activity = {
            status: 'online',
            lastOnline: Date.now()
        };
        connectedUser.socketId = socket.id;
        yield connectedUser.save();
        io.to(socket.id).emit('logged_in', {
            _id: connectedUser._id,
            fullName: connectedUser.fullName,
            email: connectedUser.email,
            image: connectedUser.image,
            notifications: {
                entities: {},
                results: connectedUser.notifications
            },
            conversations: {
                entities: {},
                results: connectedUser.conversations
            },
            friends: {
                entities: {},
                results: connectedUser.friends
            }
        });
        socket.broadcast.emit('user_status', { userId: connectedUser._id, status: connectedUser.status });
        socket.on('disconnect', (socket) => __awaiter(void 0, void 0, void 0, function* () {
            const connectedUser = yield User_1.default.findById(connectedUserId);
            console.log('[socket.js || Line no. 29 ....]', 'Disconnected');
            // if(connectedUser.status !== 'offline') {
            connectedUser.status = 'offline';
            connectedUser.activity = {
                status: 'offline',
                lastOnline: Date.now()
            };
            connectedUser.socketId = undefined;
            io.emit('user_status', { userId: connectedUser._id, status: "offline" });
            yield connectedUser.save();
            // }
        }));
    }));
    return io;
};
