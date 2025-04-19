/* eslint-disable no-unused-vars */
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const v1Routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');
const cors = require('cors');
const fileUpload = require("express-fileupload");
const { runSeeders } = require('./database/seeders');


// global features importing
// const usersRouter = require('./routes/users');
// const authRouter = require('./routes/auth.route');
const { errorConverter, errorHandler } = require('./features/error');
const configuration = require('../config');

const app = express();

app.use(helmet()); // Set various HTTP headers for security

app.use(logger('dev'));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(cors({
    origin: configuration
}));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is healthy',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/v1', v1Routes);

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Initialize database seeders
runSeeders().catch((error) => {
    logger.error('Error running seeders:', error);
});

app.use(errorConverter);
app.use(errorHandler);
module.exports = app;
