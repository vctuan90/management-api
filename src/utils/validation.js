const Joi = require('joi');

/**
 * User validation schemas
 */
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    first_name: Joi.string().min(1).max(100).optional(),
    last_name: Joi.string().min(1).max(100).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    first_name: Joi.string().min(1).max(100).optional(),
    last_name: Joi.string().min(1).max(100).optional(),
    role: Joi.string().valid('user', 'admin', 'editor').optional(),
    is_active: Joi.boolean().optional()
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).max(128).required()
  }),

  resetPassword: Joi.object({
    new_password: Joi.string().min(6).max(128).required()
  })
};

/**
 * Category validation schemas
 */
const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    slug: Joi.string().min(1).max(255).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    slug: Joi.string().min(1).max(255).optional(),
    is_active: Joi.boolean().optional()
  })
};

/**
 * News validation schemas
 */
const newsSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(500).required(),
    content: Joi.string().min(1).required(),
    summary: Joi.string().max(1000).optional(),
    slug: Joi.string().min(1).max(500).optional(),
    featured_image: Joi.string().uri().optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
    category_id: Joi.number().integer().positive().optional()
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(500).optional(),
    content: Joi.string().min(1).optional(),
    summary: Joi.string().max(1000).optional(),
    slug: Joi.string().min(1).max(500).optional(),
    featured_image: Joi.string().uri().optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
    category_id: Joi.number().integer().positive().optional()
  })
};

/**
 * Query parameters validation schemas
 */
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').optional()
  }),

  newsFilter: Joi.object({
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
    category_id: Joi.number().integer().positive().optional(),
    author_id: Joi.number().integer().positive().optional(),
    search: Joi.string().min(1).max(255).optional(),
    q: Joi.string().min(1).max(255).optional() // for search endpoint
  }),

  userFilter: Joi.object({
    role: Joi.string().valid('user', 'admin', 'editor').optional(),
    is_active: Joi.boolean().optional(),
    search: Joi.string().min(1).max(255).optional()
  }),

  categoryFilter: Joi.object({
    is_active: Joi.boolean().optional(),
    search: Joi.string().min(1).max(255).optional()
  })
};

/**
 * Combined query schemas for routes
 */
const combinedQuerySchemas = {
  userList: querySchemas.pagination.concat(querySchemas.userFilter),
  newsList: querySchemas.pagination.concat(querySchemas.newsFilter),
  categoryList: querySchemas.pagination.concat(querySchemas.categoryFilter)
};

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema object
 * @param {string} property - Property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Include all errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: errorMessage
      });
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Validate ID parameter
 */
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id < 1) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid ID parameter'
    });
  }
  
  req.params.id = id;
  next();
};

module.exports = {
  userSchemas,
  categorySchemas,
  newsSchemas,
  querySchemas,
  combinedQuerySchemas,
  validate,
  validateId
}; 