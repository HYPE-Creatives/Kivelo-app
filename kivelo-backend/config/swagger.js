//config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kivelo API',
            version: '1.0.0',
            description: 'API documentation for Kivelo project with an extra focus on Security Audit logs — allows fetching, creating, and exporting security audit records.',
        },
        servers: [
            {
                url: 'https://family-wellness.onrender.com',
                description: 'Production server (Render)',
            },
            {
                url: 'http://localhost:5000',
                description: 'Local development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            { bearerAuth: [] }
        ],
    },
    apis: ['./routes/*.js', './models/*.js'],  //path to API route files
};

const swaggerSpec = swaggerJSDoc(options);
export const swaggerDocs = (app, port) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
};

export default swaggerSpec;