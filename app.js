"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const socketIo = require('socket.io');
const app = express_1.default();
const port = process.env.PORT || 5000;
require("dotenv").config();
// MongoDB URI | Special
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}cluster0-zlxgj.mongodb.net/${process.env.MONGODB_DB_NAME}`;
// Imported Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const apiRoutes_1 = __importDefault(require("./routes/apiRoutes"));
const labelRoutes_1 = __importDefault(require("./routes/labelRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const swaggerRoutes_1 = __importDefault(require("./routes/swaggerRoutes"));
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'DND Todo React Api',
            description: 'Fully fledged todo application built on top of the react.',
            contact: {
                name: 'DNDeveloper'
            },
            servers: ['http://localhost:' + port]
        }
    },
    apis: ['app.ts']
};
const swaggerDocs = swagger_jsdoc_1.default(swaggerOptions);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
// Setting up api access permissions
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
// Setting up json parser
app.use(body_parser_1.default.json());
// Serving static files with express
app.use(express_1.default.static("public"));
// Setting up routes with some default
/**
 * @swagger
 *
 *   paths:
 *   /hello:
 *     # binds swagger app logic to a route
 *     x-swagger-router-controller: hello_world
 *     get:
 *       description: Returns 'Hello' to the caller
 *       # used as the method name of the controller
 *       operationId: hello
 *       parameters:
 *         - name: name
 *           in: query
 *           description: The name of the person to whom to say hello
 *           required: false
 *           type: string
 *       responses:
 *         "200":
 *           description: Success
 *         # responses may fall through to errors
 *         default:
 *           description: Error
 *           schema:
 *             $ref: "#/models/Label"
 */
app.use("/auth", authRoutes_1.default);
app.use('/api', apiRoutes_1.default);
app.use('/label', labelRoutes_1.default);
app.use('/project', projectRoutes_1.default);
app.use('/task', taskRoutes_1.default);
app.use(swaggerRoutes_1.default);
// Setting up special error middleware
app.use((err, req, res, next) => {
    res.status = err.status || 500;
    res.send({
        type: "error",
        status: err.status || 500,
        message: err.message,
        errorKey: err.errorKey
    });
});
// Setting up connection to MongoDB
mongoose_1.default.set("useNewUrlParser", true);
mongoose_1.default.set("useUnifiedTopology", true);
mongoose_1.default.connect(uri, { useFindAndModify: false }).then(() => {
    const server = app.listen(port);
    // Setting up connection to Socket.io
    // const io = require("./socket.ts")(server);
    const io = require("./socket")(server);
    app.set("socket.io", io);
    console.log("Sever listening to " + process.env.PORT || 5000);
});
