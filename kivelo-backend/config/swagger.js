// config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Kivelo API",
      version: "1.0.0",
      description:
        "API documentation for the Kivelo project — including endpoints for authentication, user management, and a full-scale Security Audit module that allows fetching, creating, and exporting audit records securely.",
      contact: {
        name: "Kivelo Developer Team",
        email: "support@kivelo.app",
      },
    },
    servers: [
      {
        url: "https://family-wellness.onrender.com",
        description: "Production Server (Render)",
      },
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter a valid JWT token to authorize. Example: `Bearer eyJhbGciOiJI...`",
        },
      },
      schemas: {
        AuditLog: {
          type: "object",
          properties: {
            _id: { type: "string", example: "674a21a2f2a1e8b1..." },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2025-11-05T12:45:30.000Z",
            },
            actor: {
              type: "object",
              properties: {
                id: { type: "string", example: "67123abc90d..." },
                model: { type: "string", example: "Parent" },
                ip: { type: "string", example: "192.168.1.10" },
              },
            },
            action: { type: "string", example: "user.login" },
            outcome: {
              type: "string",
              enum: ["success", "failure", "unknown"],
              example: "success",
            },
            level: {
              type: "string",
              enum: ["info", "warning", "critical"],
              example: "info",
            },
            resource: {
              type: "object",
              properties: {
                type: { type: "string", example: "profile" },
                id: { type: "string", example: "user_87abc" },
              },
            },
            metadata: {
              type: "object",
              additionalProperties: true,
              example: { method: "POST", userAgent: "Mozilla/5.0" },
            },
          },
        },
        AuditLogInput: {
          type: "object",
          required: ["action"],
          properties: {
            actor: {
              type: "object",
              example: {
                id: "67123abc90d...",
                model: "User",
                ip: "192.168.1.5",
              },
            },
            action: { type: "string", example: "user.update.profile" },
            resource: {
              type: "object",
              example: { type: "profile", id: "user_87abc" },
            },
            outcome: {
              type: "string",
              enum: ["success", "failure", "unknown"],
              example: "success",
            },
            level: {
              type: "string",
              enum: ["info", "warning", "critical"],
              example: "info",
            },
            metadata: {
              type: "object",
              example: {
                browser: "Chrome",
                device: "Android",
              },
            },
          },
        },
      },
    },

    // Apply Bearer Auth globally
    security: [{ bearerAuth: [] }],
  },

  // Path to your route and model files (globs supported)
  apis: ["./routes/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export const swaggerDocs = (app, port) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Kivelo API Docs",
    })
  );

  console.log(
    `📘 Swagger docs available at: http://localhost:${port}/api-docs`
  );
};

export default swaggerSpec;
