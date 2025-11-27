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
        "API documentation for the Kivelo project — including endpoints for authentication, user management, AI chat functionality, and a full-scale Security Audit module that allows fetching, creating, and exporting audit records securely.",
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
      {
        url: "https://interangular-hattie-unreforming.ngrok-free.dev",
        description: "Ngrok Tunnel",
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
        /* ======================
           EXISTING AUDIT SCHEMAS
           ====================== */
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

        /* ======================
           NEW AI SCHEMAS
           ====================== */

        ChatRequest: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              example: "Hello, how are you?",
            },
          },
        },

        ChatResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            response: {
              type: "string",
              example: "I'm doing great, thanks for asking!",
            },
          },
        },

        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "string",
              example: "An unexpected error occurred",
            },
          },
        },

        HistoryItem: {
          type: "object",
          properties: {
            user: { type: "string", example: "Hi there" },
            ai: { type: "string", example: "Hello! How can I help today?" },
            time: {
              type: "string",
              format: "date-time",
              example: "2025-02-20T10:00:00.000Z",
            },
          },
        },

        HistoryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            history: {
              type: "array",
              items: { $ref: "#/components/schemas/HistoryItem" },
            },
          },
        },

        ClearHistoryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Chat history cleared successfully",
            },
          },
        },

        InsightRequest: {
          type: "object",
          properties: {
            mood: { type: "string", example: "sad" },
            activity: { type: "string", example: "self isolation" },
            behavior: { type: "string", example: "not talking much" },
          },
        },

        InsightResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            insight: {
              type: "string",
              example: "The child appears withdrawn and may benefit from emotional support...",
            },
          },
        },

        RecommendationRequest: {
          type: "object",
          properties: {
            childName: { type: "string", example: "John" },
            age: { type: "number", example: 12 },
            context: {
              type: "string",
              example: "Low motivation during school activities",
            },
          },
        },

        RecommendationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            recommendations: {
              type: "string",
              example: "1. Encourage morning exercise. 2. Create a learning routine...",
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
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2563eb; }
        .swagger-ui .scheme-container { background: #f8fafc; }
      `,
      customSiteTitle: "Kivelo API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      }
    })
  );

  console.log(
    `📘 Swagger docs available at: http://localhost:${port}/api-docs`
  );
  console.log(
    `🌐 Production docs available at: https://family-wellness.onrender.com/api-docs`
  );
  console.log(
    `🔗 Ngrok docs available at: https://interangular-hattie-unreforming.ngrok-free.dev/docs`
  );
};

export default swaggerSpec;