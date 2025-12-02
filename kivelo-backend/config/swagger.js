// config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

/**
 * -------------------------------------
 * 🔧 SWAGGER OPTIONS
 * -------------------------------------
 */
const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Kivelo API",
      version: "1.0.0",
      description: "Endpoints for authentication, family wellness features, analytics, audit logging, and AI-powered insights.",
      contact: {
        name: "Kivelo Developer Team",
        email: "support@kivelo.app",
      },
    },

    servers: [
      {
        url: "https://family-wellness.onrender.com",
        description: "Production Server",
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

    // 🛡️ GLOBAL SECURITY (JWT Enabled)
    security: [
      { bearerAuth: [] }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Provide a valid JWT token."
        },

        // If you want API key support inside Swagger later:
        // ApiKeyAuth: {
        //   type: "apiKey",
        //   in: "header",
        //   name: "x-api-key",
        //   description: "Your API key",
        // },
      },

      schemas: {
        // You can keep your existing schemas — unchanged
        AuditLog: {
          type: "object",
          properties: {
            _id: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            actor: { type: "object" },
            action: { type: "string" },
            outcome: { type: "string", enum: ["success", "failure", "unknown"] },
            level: { type: "string", enum: ["info", "warning", "critical"] },
            resource: { type: "object" },
            metadata: { type: "object" },
          },
        },

        ChatRequest: {
          type: "object",
          required: ["username", "message"],
          properties: {
            username: { type: "string" },
            message: { type: "string" },
          },
        },

        ChatResponse: {
          type: "object",
          properties: {
            reply: { type: "string" }
          }
        },

        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        },
      },
    },
  },

  // Auto-detect all route files
  apis: ["./routes/*.js", "./models/*.js"],
};

// Generate specification
const swaggerSpec = swaggerJSDoc(options);

/**
 * -------------------------------------
 * 🚀 SWAGGER SETUP FUNCTION
 * -------------------------------------
 */
export const swaggerDocs = (app, port) => {
  // ✔️ Serve swagger.json programmatically
  app.get("/api-docs/swagger.json", (req, res) => {
    res.header("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2563eb; font-weight: bold; }
        .swagger-ui .scheme-container { background: #f8fafc; }
      `,
      customSiteTitle: "Kivelo API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
      },
    })
  );

  // Logs
  console.log(`📘 Swagger UI: http://localhost:${port}/api-docs`);
  console.log(`📄 Swagger JSON: http://localhost:${port}/api-docs/swagger.json`);
  console.log(`🌐 Production Docs: https://family-wellness.onrender.com/api-docs`);
};

export default swaggerSpec;
