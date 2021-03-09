"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');
router.use('/api-docs', swaggerUi.serve);
// router.get('/api-docs', swaggerUi.setup(swaggerDocument));
exports.default = router;
