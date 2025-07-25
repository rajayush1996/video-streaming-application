
process.env.ALLOW_CONFIG_MUTATIONS = 'true';
/* eslint-disable camelcase */
const config = require('config');
const dotenv = require('dotenv');
const Joi = require('joi');
const { generateRefreshTokenSecretKey, generateRandomString } = require('../src/utils/utils');

dotenv.config();

const configEnv = config.get('config');

if (!configEnv.AUTHENTICATION.REFRESH_TOKEN_SECRET_KEY) {
    configEnv.AUTHENTICATION.REFRESH_TOKEN_SECRET_KEY = generateRefreshTokenSecretKey();
}

if (!configEnv.AUTHENTICATION.REFRESH_TOKEN_ISSUER) {
    configEnv.AUTHENTICATION.REFRESH_TOKEN_ISSUER = generateRefreshTokenSecretKey();
}

if (!configEnv.AUTHENTICATION.JWT_TOKEN_ISSUER) {
    configEnv.AUTHENTICATION.JWT_TOKEN_ISSUER = generateRandomString(12);
}

if (!configEnv.AUTHENTICATION.JWT_TOKEN_SECRET_KEY) {
    configEnv.AUTHENTICATION.JWT_TOKEN_SECRET_KEY = generateRefreshTokenSecretKey();
}
if (!configEnv.AUTHENTICATION.ENCRYPTION_SECRET) {
    configEnv.AUTHENTICATION.ENCRYPTION_SECRET = generateRefreshTokenSecretKey();
}

const envVarsSchema = Joi.object({
    ENV: Joi.object({
        APP_HOST: Joi.string().required().description('The application host URL'),
        VSA_HOST: Joi.string().required().description('The vsa host URL'),
        WEBHOOK_HOST: Joi.string().required().description('The webhook host URL'),
        PORT: Joi.string().required().description('The application port'),
        ENVIRONMENT: Joi.string().required().description('The environment of the app'),
        CLIENT_URL: Joi.string().required().description('The vsa host URL of client side'),
        SERVER_URL: Joi.string().required().description('The vsa host URL of server side'),
        ADMIN_URL: Joi.string().required().description('The admin host URL of admin side'),
    }).description('Environments setting'),
    DATABASE: Joi.object({
        TYPE: Joi.string().required().description('The type of database (e.g., mongodb)'),
        URL: Joi.string().required().description('The database connection URL'),
        PORT: Joi.number().required().description('The database port'),
        DBNAME: Joi.string().required().description('The name of the database'),
        MONGO_AUTHENTICATION_ENABLED: Joi.boolean().required().description('MongoDB authentication enabled'),
    }).description('Database settings'),
    DEBUG_MONGOOSE: Joi.boolean().required().description('Debug Mongoose enabled'),
    REDIS: Joi.object({
        HOST: Joi.string().required().description('Redis host'),
        PORT: Joi.number().required().description('Redis port'),
        PASSWORD: Joi.string().required().description('Redis password'),
        SSL_ENABLED: Joi.boolean().required().description('SSL for Redis enabled'),
    }).description('Redis settings'),
    KAFKA: Joi.object({
        HOST: Joi.string().required().description('Kafka host'),
        USER: Joi.string().required().description('Kafka username'),
        PASSWORD: Joi.string().required().description('Kafka password'),
        PORT: Joi.number().required().description('Kafka port'),
    }).description('Kafka settings'),
    RABBITMQ: Joi.object({
        HOST: Joi.string().required().description('Rabbitmq host'),
        USER: Joi.string().required().description('Rabbitmq username'),
        PASSWORD: Joi.string().required().description('Rabbitmq password'),
        PORT: Joi.number().required().description('Rabbitmq port'),
    }).description('Kafka settings'),
    SMTP: Joi.object({
        HOST: Joi.string().required().description('SMTP host'),
        PORT: Joi.number().required().description('SMTP port'),
        USERNAME: Joi.string().required().description('SMTP username'),
        PASSWORD: Joi.string().required().description('SMTP password'),
        EMAIL_FROM: Joi.string().required().description('Email sender address'),
        GMAIL_PROVIDER: Joi.object().required(),
        OUTLOOK_PROVIDER: Joi.object().required(),
        AWS_PROVIDER: Joi.object().required(),
    }).description('SMTP settings'),
    AUTHENTICATION: Joi.object({
        PRIVATE_KEY_PATH: Joi.string().required().description('private key path'),
        TOKEN_ALGORITHM: Joi.string().required().description('token algorithm'),
        REFRESH_TOKEN_SECRET_KEY: Joi.string().required().description('refresh token secret key'),
        REFRESH_TOKEN_ISSUER: Joi.string().required().description('refresh token issuer'),
        JWT_TOKEN_ISSUER: Joi.string().required().description('jwt token issuer'),
        JWT_TOKEN_SECRET_KEY: Joi.string().required().description('jwt token secret key'),
        ENCRYPTION_SECRET: Joi.string().required().description('encryption secret key'),
        ENCRYPTION_ALGORITHM: Joi.string().required().description('encryption algorithm'),

    }).description('authentication settings'),
    CDN: Joi.object({
        BUNNY: Joi.object({
            STORAGE_ZONE: Joi.string().required().description('storage url of bunny cdn'),
            ACCESS_KEY: Joi.string().required().description('access key of bunny cdn'),
            STORAGE_HOST: Joi.string().required().description('bunny cdn url'),
            PULL_ZONE: Joi.string().required().description("pull zone is for bunny cdn"),
            VID_CONTAINER_NAME: Joi.string().required().description("container name for bunny cdn"),
            THUMBNAIL_CONTAINER_NAME: Joi.string().required().description("container name for bunny cdn"),
            LOCAL_STORAGE_PATH: Joi.string().required().description("local storage path for bunny cdn"),
        })
    })
}).unknown(true);

const { error, value: envVars } = envVarsSchema.validate(configEnv);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const configuration = {
    env: {
        app_host: process.env.APP_HOST || envVars.ENV.APP_HOST,
        vsa_host: process.env.VSA_HOST || envVars.ENV.VSA_HOST,
        webhook_host: process.env.WEBHOOK_HOST || envVars.ENV.WEBHOOK_HOST,
        port: process.env.PORT || envVars.ENV.PORT,
        environment: process.env.ENVIRONMENT || envVars.ENV.ENVIRONMENT,
        client_url: process.env.CLIENT_URL || envVars.ENV.CLIENT_URL,
        server_url: process.env.SERVER_URL || envVars.ENV.SERVER_URL,
        admin_url: process.env.ADMIN_URL || envVars.ENV.ADMIN_URL
    },
    database: {
        type: process.env.DATABASE_TYPE || envVars.DATABASE.TYPE,
        url: process.env.DATABASE_URL || envVars.DATABASE.URL,
        port: process.env.DATABASE_PORT || envVars.DATABASE.PORT,
        dbname: process.env.DATABASE_DBNAME || envVars.DATABASE.DBNAME,
        mongo_authentication_enabled: process.env.DATABASE_MONGO_AUTHENTICATION_ENABLED || envVars.DATABASE.MONGO_AUTHENTICATION_ENABLED,
    },
    debug_mongoose: process.env.DEBUG_MONGOOSE || envVars.DEBUG_MONGOOSE,
    redis: {
        host: process.env.REDIS_HOST || envVars.REDIS.HOST,
        port: process.env.REDIS_PORT || envVars.REDIS.PORT,
        password: process.env.REDIS_PASSWORD || envVars.REDIS.PASSWORD,
        ssl_enabled: process.env.REDIS_SSL_ENABLED || envVars.REDIS.SSL_ENABLED,
    },
    kafka: {
        host: process.env.KAFKA_HOST || envVars.KAFKA.HOST,
        user: process.env.KAFKA_USER || envVars.KAFKA.USER,
        password: process.env.KAFKA_PASSWORD || envVars.KAFKA.PASSWORD,
        port: process.env.KAFKA_PORT || envVars.KAFKA.PORT,
    },
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || envVars.RABBITMQ.HOST,
        user: process.env.RABBITMQ_USER || envVars.RABBITMQ.USER,
        password: process.env.RABBITMQ_PASSWORD || envVars.RABBITMQ.PASSWORD,
        port: process.env.RABBITMQ_PORT || envVars.RABBITMQ.PORT,
    },
    smtp: {
        host: process.env.SMTP_HOST || envVars.SMTP.HOST,
        port: process.env.SMTP_PORT || envVars.SMTP.PORT,
        username: process.env.SMTP_USERNAME || envVars.SMTP.USERNAME,
        password: process.env.SMTP_PASSWORD || envVars.SMTP.PASSWORD,
        email_from: process.env.SMTP_EMAIL_FROM || envVars.SMTP.EMAIL_FROM,
    },
    internal_apis: {
        config_domain: process.env.CONFIG_DOMAIN || envVars.INTERNAL_APIS.CONFIG_DOMAIN,
        api_key: process.env.API_KEY || envVars.INTERNAL_APIS.API_KEY
    },
    authentication: {
        private_key_path: process.env.PRIVATE_KEY_PATH || envVars.AUTHENTICATION.PRIVATE_KEY_PATH,
        token_algortihm: process.env.TOKEN_ALGORITHM || envVars.AUTHENTICATION.TOKEN_ALGORITHM,
        salt_rounds: 10,
        jwt_token_expiration: '86000s',
        refresh_token_secret_key: process.env.REFRESH_TOKEN_SECRET_KEY || envVars.AUTHENTICATION.REFRESH_TOKEN_SECRET_KEY,
        refresh_token_issuer: process.env.REFRESH_TOKEN_ISSUER || envVars.AUTHENTICATION.REFRESH_TOKEN_ISSUER,
        refresh_token_expiration: "30d",
        jwt_token_issuer: process.env.JWT_TOKEN_ISSUER || envVars.AUTHENTICATION.JWT_TOKEN_ISSUER,
        jwt_token_secret_key: process.env.JWT_TOKEN_SECRET_KEY || envVars.AUTHENTICATION.JWT_TOKEN_SECRET_KEY,
        encryption_aglorithm: process.env.ENCRYPTION_ALGORITHM || envVars.AUTHENTICATION.ENCRYPTION_ALGORITHM,
        encryption_secret: process.env.ENCRYPTION_SECRET || envVars.AUTHENTICATION.ENCRYPTION_SECRET,
    },
    emailVerification: {
        verification_url: process.env.CLIENT_URL || envVars.ENV.CLIENT_URL
    },
    cdn: {
        bunny_storage_zone: process.env.BUNNY_STORAGE_ZONE || envVars.CDN.BUNNY.STORAGE_ZONE,
        bunny_access_key: process.env.BUNNY_ACCESS_KEY || envVars.CDN.BUNNY.ACCESS_KEY,
        bunny_storage_host: process.env.BUNNY_STORAGE_HOST || envVars.CDN.BUNNY.STORAGE_HOST,
        bunny_pull_zone: process.env.BUNNY_PULL_ZONE || envVars.CDN.BUNNY.PULL_ZONE,
        bunn_cdn_url: process.env.BUNNY_CDN_URL,
        bunny_cdn_vid_container_name: process.env.BUNNY_CDN_VID_CONTAINER_NAME || envVars.CDN.BUNNY.VID_CONTAINER_NAME,
        bunny_cdn_thumbnail_container_name: process.env.BUNNY_CDN_THUMBNAIL_CONTAINER_NAME || envVars.CDN.BUNNY.THUMBNAIL_CONTAINER_NAME,
        local_upload_path: process.env.LOCAL_STORAGE_PATH || envVars.CDN.BUNNY.LOCAL_STORAGE_PATH,
    }
};

module.exports = configuration;
