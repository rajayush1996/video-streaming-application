const swaggerAutogen = require('swagger-autogen')();
const outputFile = './swagger_output.json';
const endpointsFiles = [
    './src/app.js',
    './src/routes/*.js',
    './src/routes/**/*.js',
    './src/routes/v1/*.js',
    './src/routes/admin/*.js',
    './src/routes/user/*.js'
];
// const config = require('../config/config');
const metadata = require('./swaggerMetaData.json');

const doc = {
    info: {
        title: 'vsa API',
        description: 'Automatically generated API documentation',
    },
    host: 'localhost:5000',
    schemes: ['http'],
    paths: {}, // Ensure paths is initialized
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
};

function injectSwaggerMetadata(doc, metadata) {
    for (const path in metadata) {
        if (Object.prototype.hasOwnProperty.call(metadata, path)) {
            for (const method in metadata[path]) {
                if (Object.prototype.hasOwnProperty.call(metadata[path], method)) {
                    doc.paths = doc.paths || {};
                    doc.paths[path] = doc.paths[path] || {};
                    doc.paths[path][method] = doc.paths[path][method] || {};

                    // Inject summary, tags, and description from metadata
                    doc.paths[path][method].summary = metadata[path][method].summary || '';
                    doc.paths[path][method].tags = metadata[path][method].tags || [];
                    doc.paths[path][method].description = metadata[path][method].description || '';
                }
            }
        }
    }
}

injectSwaggerMetadata(doc, metadata);

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./app.js');
});
