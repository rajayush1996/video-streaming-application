/* eslint-disable no-unused-vars */
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('../config');
// const morgan = require('./config/morgan');
// const { jwtStrategy } = require('./config/passport');
// const { authLimiter } = require('./middlewares/rateLimiter');
// const routes = require('./routes/v1');
const AppError = require('./features/error');
const { ApiError } = require('./features/error');

const v1Routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
// const swaggerFile = require('./swagger_output.json');
const cors = require('cors');
const fileUpload = require("express-fileupload");
const { runSeeders } = require('./database/seeders');
const swaggerSpec = require('./config/swagger');

// global features importing
// const { errorConverter: globalErrorConverter, errorHandler: globalErrorHandler } = require('./features/error');
// const configuration = require('../config');

// Import notification services
const eventBus = require('./services/eventBus.service');
const notificationProcessor = require('./services/notificationProcessor.service');
const digestManager = require('./services/notificationChannel/digestManager.service');

// Import audit middleware
const auditContextMiddleware = require('./middlewares/auditContext.middleware');

const interactionRoute = require('./routes/interaction/interaction.route');

const app = express();

// if we're in development, use morgan logger
// if (config.env !== 'test') {
//     app.use(morgan.successHandler);
//     app.use(morgan.errorHandler);
// }

app.use(helmet()); // Set various HTTP headers for security

app.use(logger('dev'));
app.use(fileUpload());
const rawExcludedPaths = [
    /^\/api\/v1\/admin\/upload\/chunk\//,
];

// Conditionally apply JSON parser
app.use((req, res, next) => {
    const isRawRoute = rawExcludedPaths.some((pattern) => pattern.test(req.path));

    if (isRawRoute) {
    // Skip JSON parser for binary routes
        return next();
    }

    // Apply JSON parser otherwise
    express.json({ limit: '50mb' })(req, res, next);
});
app.use((req, res, next) => {
    const isRawRoute = rawExcludedPaths.some((pattern) => pattern.test(req.path));

    if (isRawRoute) return next();

    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
});


app.use(cookieParser());

// CORS configuration
// app.use(cors({
//     origin: '*',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

const allowedOrigins = [
    'https://lust-hub.netlify.app',
    'https://admin.lustyhub.com',
    'https://video-streaming-lusty.netlify.app',
    'https://lustyhub.com',
    'https://cool-sorbet-889dc8.netlify.app',
    'https://desi-bhabhi.netlify.app',
    'https://admin-desibhabhi.netlify.app',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:8085',
    'http://localhost:8888',

];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Required if you're using cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// app.options('*', cors());

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


app.use(express.static(path.join(__dirname, 'public')));

// Apply audit context middleware
app.use(auditContextMiddleware());

// gzip compression
app.use(compression());

// jwt authentication
// app.use(passport.initialize());
// passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
// if (config.env === 'production') {
//     app.use('/v1/auth', authLimiter);
// }

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is healthy',
        timestamp: new Date().toISOString()
    });
});

// All routes are handled through the main routes index
app.use('/uploads', cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}), express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1', v1Routes);
app.use('/api/v1/interactions', interactionRoute);

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize database seeders
runSeeders().catch((error) => {
    logger.error('Error running seeders:', error);
});

// Initialize event bus and notification services
eventBus.initialize();
notificationProcessor.initialize();
digestManager.initialize();

// Root path handler
app.get('/', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.redirect('/signin');
    }
    res.redirect('/dashboard');
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(AppError.errorConverter);

// handle error
app.use(AppError.errorHandler);

module.exports = app;

