const swaggerJSDoc = require('swagger-jsdoc');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'News Management API',
    version: '1.0.0',
    description: 'A comprehensive RESTful API for managing users, categories, and news articles with JWT authentication',
    contact: {
      name: 'API Support',
      email: 'support@newsapi.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' ? 'https://api.yourdomain.com' : `http://localhost:${process.env.PORT || 3000}`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token in the format: Bearer <token>'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'User ID'
          },
          username: {
            type: 'string',
            description: 'Username (unique)'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address (unique)'
          },
          first_name: {
            type: 'string',
            description: 'First name'
          },
          last_name: {
            type: 'string',
            description: 'Last name'
          },
          role: {
            type: 'string',
            enum: ['user', 'editor', 'admin'],
            description: 'User role'
          },
          is_active: {
            type: 'boolean',
            description: 'Account status'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Category ID'
          },
          name: {
            type: 'string',
            description: 'Category name (unique)'
          },
          description: {
            type: 'string',
            description: 'Category description'
          },
          slug: {
            type: 'string',
            description: 'URL-friendly slug (unique)'
          },
          is_active: {
            type: 'boolean',
            description: 'Category status'
          },
          news_count: {
            type: 'integer',
            description: 'Number of news articles in this category'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      News: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'News ID'
          },
          title: {
            type: 'string',
            description: 'News title'
          },
          content: {
            type: 'string',
            description: 'Full news content'
          },
          summary: {
            type: 'string',
            description: 'Brief summary'
          },
          slug: {
            type: 'string',
            description: 'URL-friendly slug (unique)'
          },
          featured_image: {
            type: 'string',
            format: 'uri',
            description: 'Featured image URL'
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            description: 'Publication status'
          },
          category_id: {
            type: 'integer',
            description: 'Category ID'
          },
          category_name: {
            type: 'string',
            description: 'Category name'
          },
          author_id: {
            type: 'integer',
            description: 'Author ID'
          },
          author_username: {
            type: 'string',
            description: 'Author username'
          },
          published_at: {
            type: 'string',
            format: 'date-time',
            description: 'Publication timestamp'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Current page number'
          },
          limit: {
            type: 'integer',
            description: 'Items per page'
          },
          total: {
            type: 'integer',
            description: 'Total number of items'
          },
          pages: {
            type: 'integer',
            description: 'Total number of pages'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error'
          },
          message: {
            type: 'string',
            description: 'Error message'
          },
          details: {
            type: 'string',
            description: 'Additional error details (development mode only)'
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success'
          },
          message: {
            type: 'string',
            description: 'Success message'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              status: 'error',
              message: 'Access token is required'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Access denied',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              status: 'error',
              message: 'Access denied - insufficient permissions'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              status: 'error',
              message: 'Resource not found'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              status: 'error',
              message: 'Validation error',
              details: 'Username is required'
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              status: 'error',
              message: 'Internal server error'
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec; 