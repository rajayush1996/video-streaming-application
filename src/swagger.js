const swaggerAutogen = require('swagger-autogen')();
const outputFile = './swagger_output.json';
const endpointsFiles = ['./app.js'];
const config = require('../config/config');
const metadata = require('./swaggerMetaData.json');

const doc = {
    info: {
        title: 'Starzopp API',
        description: 'Automatically generated API documentation',
    },
    host: `${config.env.starzopp_host}:${config.env.port}`,
    schemes: ['http'],
    paths: {}, // Ensure paths is initialized
};

console.log("🚀 ~ file: swagger.js:14 ~ config.env.starzopp_host:", config.env.starzopp_host);
console.log("🚀 ~ file: swagger.js:14 ~ config.env.port:", config.env.port);

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
    require('./app.js', './routes/*.js');
});
