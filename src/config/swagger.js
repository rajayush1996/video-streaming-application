const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Video Streaming API',
            version: '1.0.0',
            description: 'API documentation for Video Streaming Application',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js', './src/models/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 