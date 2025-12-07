import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { styleText } from "util";

/**
 * -------------------------------------
 * 🔧 SWAGGER OPTIONS - COMPLETE & CORRECTED
 * -------------------------------------
 */
const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Kivelo API v1.0",
      version: "1.0.0",
      description: `
# Kivelo - Child Emotional Wellness Platform

## Overview
Complete API for the Kivelo app supporting child emotional tracking and parent monitoring features.

## Authentication
All protected routes require JWT token in Authorization header:
\`Authorization: Bearer <your_token>\`
      `,
      contact: {
        name: "Kivelo Developer Team",
        email: "support@kivelo.app",
      }
    },

    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
      {
        url: "https://family-wellness.onrender.com",
        description: "Production Server",
      }
    ],

    // 🛡️ GLOBAL SECURITY (JWT Enabled)
    security: [
      { bearerAuth: [] }
    ],
    //   🏷️ TAGS FOR ORGANIZATION - in all routes
    tags: [
      { name: "Users", description: "User profile management" },
      { name: "Authentication", description: "User registration, login, and account management" },
      { name: "Email Verification", description: "Email verification and account activation" },
      { name: "Child Accounts", description: "Child account management and authentication" },
      { name: "Parent Dashboard", description: "Parent monitoring and child insights" },
      { name: "Mood Tracking", description: "Child mood check-ins and mood history" },
      { name: "Journals", description: "Journal entries (story, art, music etc.)" },
      { name: "Gamification", description: "Streaks, badges, points, and rewards", styleText: "font-weight: bold;" },
      { name: "AI Helper", description: "AI conversations and activity suggestions" },
      { name: "AI Chat", description: "Chat with the AI model and manage chat history" },
      { name: "Learning Platform", description: "Articles and micro-lessons for parents" },
      { name: "Family Management", description: "Parent-child linking and family management" },
      { name: "Notifications", description: "Push notifications and alerts" },
      //   { name: "Admin", description: "Administrative functions" }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from login/register endpoints"
        }
      },

      // ==================== PARAMETERS ====================
      parameters: {
        childIdParam: {
          name: "childId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the child"
        },
        moodIdParam: {
          name: "moodId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the mood entry"
        },
        periodQuery: {
          name: "period",
          in: "query",
          schema: {
            type: "string",
            enum: ["day", "week", "month", "year"],
            default: "week"
          },
          description: "Time period for filtering"
        },
        daysQuery: {
          name: "days",
          in: "query",
          schema: {
            type: "integer",
            enum: [7, 30, 90],
            default: 30
          },
          description: "Number of days to analyze"
        },
        limitQuery: {
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            default: 50,
            maximum: 100
          },
          description: "Maximum number of items to return"
        }
      },

      // ==================== RESPONSES ====================
      responses: {
        UnauthorizedError: {
          description: "Authentication token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Please authenticate" }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: "User doesn't have permission to access this resource",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Access denied" }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: "Requested resource not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Resource not found" }
                }
              }
            }
          }
        },
        ValidationError: {
          description: "Request validation failed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Validation failed" },
                  errors: { type: "array" }
                }
              }
            }
          }
        },
        SuccessResponse: {
          description: "Operation successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string" },
                  data: { type: "object" }
                }
              }
            }
          }
        },
        BadRequestError: {
          description: "Bad Request - The request was invalid or cannot be served",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      },

      // ==================== SCHEMAS ====================
      schemas: {
        // Mood Check-in Request
        MoodCheckinRequest: {
          type: "object",
          properties: {
            emoji: {
              type: "string",
              example: "😊",
              description: "Emoji (😊, 😢, 😡, 😴, 😎, 😇, 😰, 🤔)"
            },
            textNote: {
              type: "string",
              example: "Had a great day at school!",
              maxLength: 500
            },
            voiceNote: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" },
                duration: { type: "number" }
              }
            },
            drawing: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" }
              }
            },
            moodScore: { //or mood intensity or mood rating
              type: "number",
              minimum: 1,
              maximum: 10,
              example: 8
            },
            tags: {
              type: "array",
              items: { type: "string" },
              example: ["school", "friends", "family"]
            },
            context: {
              type: "object",
              properties: {
                location: { type: "string", example: "home" },
                activity: { type: "string", example: "doing homework" },
                people: { type: "array", items: { type: "string" } }
              }
            }
          }
        },

        // Mood Check-in Response
        MoodCheckinResponse: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            child: { type: "string", example: "507f1f77bcf86cd799439012" },
            type: { type: "string", enum: ["emoji", "text", "voice", "drawing", "combined"] },
            emoji: { type: "string", example: "😊" },
            textNote: { type: "string", example: "Had a great day!" },
            moodScore: { type: "number", example: 8 },
            trustZone: { type: "string", enum: ["green", "yellow", "orange", "red"] },
            tags: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },

        // Mood Stats
        MoodStats: {
          type: "object",
          properties: {
            averageScore: { type: "number", example: 7.5 },
            totalEntries: { type: "number", example: 14 },
            trustZoneDistribution: {
              type: "object",
              properties: {
                green: { type: "number", example: 8 },
                yellow: { type: "number", example: 4 },
                orange: { type: "number", example: 2 },
                red: { type: "number", example: 0 }
              }
            },
            frequentEmojis: {
              type: "object",
              additionalProperties: { type: "number" }
            },
            currentTrustZone: { type: "string", enum: ["green", "yellow", "orange", "red"] }
          }
        },

        // Mood Insight
        MoodInsight: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["warning", "alert", "suggestion"] },
            message: { type: "string" },
            suggestion: { type: "string" }
          }
        },

        // Trust Zone Summary
        TrustZoneSummary: {
          type: "object",
          properties: {
            childId: { type: "string" },
            averageScore: { type: "number", example: 7.2 },
            currentZone: { type: "string", enum: ["green", "yellow", "orange", "red"] },
            zoneDistribution: {
              type: "object",
              properties: {
                green: { type: "number", example: 5 },
                yellow: { type: "number", example: 2 },
                orange: { type: "number", example: 1 },
                red: { type: "number", example: 0 }
              }
            },
            totalEntries: { type: "number", example: 8 }
          }
        },

        // Error Response
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error description" },
            error: { type: "string", example: "Detailed error for debugging" }
          }
        },

        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Notification ID',
              example: '65a1b2c3d4e5f67890123456'
            },
            userId: {
              type: 'string',
              description: 'User ID',
              example: '65a1b2c3d4e5f67890123456'
            },
            type: {
              type: 'string',
              enum: [
                'mood_alert',
                'streak_milestone',
                'new_journal',
                'points_earned',
                'badge_earned',
                'system',
                'parent_alert',
                'ai_suggestion'
              ],
              description: 'Notification type'
            },
            title: {
              type: 'string',
              description: 'Notification title',
              example: 'New Journal Entry'
            },
            message: {
              type: 'string',
              description: 'Notification message',
              example: 'Your child created a new journal entry'
            },
            data: {
              type: 'object',
              description: 'Additional data',
              example: { childId: '65a1b2c3d4e5f67890123456', childName: 'John' }
            },
            priority: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              default: 3,
              description: 'Notification priority (1=highest, 5=lowest)'
            },
            isRead: {
              type: 'boolean',
              default: false,
              description: 'Whether notification has been read'
            },
            isSent: {
              type: 'boolean',
              default: false,
              description: 'Whether notification has been sent'
            },
            sentVia: {
              type: 'array',
              items: { type: 'string', enum: ['push', 'email', 'sms'] },
              description: 'Delivery methods'
            },
            scheduledFor: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled delivery time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        NotificationCreate: {
          type: 'object',
          required: ['userId', 'type', 'title', 'message'],
          properties: {
            userId: {
              type: 'string',
              description: 'Recipient user ID'
            },
            type: {
              type: 'string',
              enum: [
                'mood_alert',
                'streak_milestone',
                'new_journal',
                'points_earned',
                'badge_earned',
                'system',
                'parent_alert',
                'ai_suggestion'
              ]
            },
            title: {
              type: 'string',
              maxLength: 200
            },
            message: {
              type: 'string',
              maxLength: 500
            },
            data: {
              type: 'object',
              default: {}
            },
            priority: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              default: 3
            },
            sentVia: {
              type: 'array',
              items: { type: 'string', enum: ['push', 'email', 'sms'] },
              default: []
            }
          }
        },
        GamificationStats: {
          type: "object",
          properties: {
            childInfo: {
              type: "object",
              properties: {
                id: { type: "string", example: "65a1b2c3d4e5f67890123456" },
                name: { type: "string", example: "John Doe" },
                age: { type: "integer", example: 10 }
              }
            },
            points: {
              type: "object",
              properties: {
                total: { type: "integer", example: 1250 },
                current: { type: "integer", example: 250 },
                weeklyEarned: { type: "integer", example: 150 },
                monthlyEarned: { type: "integer", example: 450 }
              }
            },
            streak: {
              type: "object",
              properties: {
                current: { type: "integer", example: 7 },
                longest: { type: "integer", example: 21 },
                lastActivity: { type: "string", format: "date-time" }
              }
            },
            badges: {
              type: "object",
              properties: {
                total: { type: "integer", example: 8 },
                earned: { type: "integer", example: 5 },
                recent: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", example: "Early Bird" },
                      icon: { type: "string", example: "🐦" }
                    }
                  }
                }
              }
            },
            level: {
              type: "object",
              properties: {
                current: { type: "integer", example: 3 },
                title: { type: "string", example: "Explorer" },
                progress: { type: "number", example: 0.65 },
                nextLevelPoints: { type: "integer", example: 300 }
              }
            },
            leaderboard: {
              type: "object",
              properties: {
                rank: { type: "integer", example: 5 },
                totalPlayers: { type: "integer", example: 50 },
                topPlayers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", example: "Alice" },
                      points: { type: "integer", example: 1800 }
                    }
                  }
                }
              }
            },
            activityStats: {
              type: "object",
              properties: {
                journalsThisWeek: { type: "integer", example: 4 },
                moodChecksThisWeek: { type: "integer", example: 7 },
                activitiesCompleted: { type: "integer", example: 3 }
              }
            },
            rewards: {
              type: "object",
              properties: {
                available: { type: "integer", example: 2 },
                redeemed: { type: "integer", example: 5 },
                upcoming: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", example: "Extra Playtime" },
                      pointsRequired: { type: "integer", example: 100 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // Auto-detect all route files
  apis: ["./routes/*.js"],
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
  app.get("/api-docs/v1/swagger.json", (req, res) => {
    res.header("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    "/api-docs/v1",
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

  console.log(`📘 Swagger UI: http://localhost:${port}/api-docs/v1`);
  console.log(`📄 Swagger JSON: http://localhost:${port}/api-docs/v1/swagger.json`);
};

export default swaggerSpec;