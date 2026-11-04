const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'API TPBackend',
        description: 'Documentación automática de la API para el TP Final'
    },
    host: 'localhost:3000',
    schemes: ['http'],
};

const outputFile = './swagger-output.json'; 
const endpointsFiles = ['./index.js']; // index.js donde estan las rutas

swaggerAutogen(outputFile, endpointsFiles, doc);