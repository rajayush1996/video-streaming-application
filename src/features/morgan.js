const morgan = require('morgan');
const config = require('config');
const logger = require('./logger')('morgan');

// Const environment = config.get();

morgan.token('message', (_req, res) => res.locals.errorMessage || '');
morgan.token('user-agent', (req, _res) => req.headers['user-agent'] || '');

const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message - user-agent: :user-agent - req-size: :req[content-length] - res-size: :res[content-length]`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message - user-agent: :user-agent - req-size: :req[content-length] - res-size: :res[content-length]`;

const customSuccessHandler = morgan(successResponseFormat, {
	skip: (_req, res) => res.statusCode >= 400,
	stream: {write: message => logger.info(message.trim())},
});

const customErrorHandler = morgan(errorResponseFormat, {
	skip: (_req, res) => res.statusCode < 400,
	stream: {write: message => logger.error(message.trim())},
});

module.exports = {
	customSuccessHandler,
	customErrorHandler,
};
