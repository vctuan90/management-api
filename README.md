# News Management API

A comprehensive RESTful API for managing users, categories, and news articles with JWT authentication, built with Node.js, Express, and SQLite.

## Features

- **JWT Authentication**: Secure login/logout with token-based authentication
- **User Management**: Complete CRUD operations for user management with role-based access control
- **Category Management**: CRUD operations for news categories
- **News Management**: Full news article management with relationships to categories and authors
- **Role-based Authorization**: Admin, Editor, and User roles with different permissions
- **Input Validation**: Comprehensive validation using Joi
- **Logging**: Structured logging with Winston
- **Security**: Helmet, CORS, and rate limiting
- **Pagination**: Built-in pagination for all list endpoints
- **Search & Filtering**: Advanced search and filtering capabilities
- **API Documentation**: Interactive Swagger UI documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit
- **Documentation**: Swagger UI, swagger-jsdoc

## Project Structure

```
src/
├── app.js                 # Main application entry point
├── config/                # Configuration files
│   └── swagger.js         # Swagger configuration
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── userController.js
│   ├── categoryController.js
│   └── newsController.js
├── database/              # Database configuration
│   └── database.js
├── middlewares/           # Custom middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── requestLogger.js
├── models/                # Data models
│   ├── User.js
│   ├── Category.js
│   └── News.js
├── routes/                # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── categoryRoutes.js
│   └── newsRoutes.js
└── utils/                 # Utility functions
    ├── logger.js
    └── validation.js
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd news-management-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=24h
   DB_PATH=./database.sqlite
   
   # Rate limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## API Documentation

### Swagger UI Documentation

The API includes comprehensive interactive documentation powered by Swagger UI. Once the server is running, you can access the documentation at:

**Swagger UI Interface**: `http://localhost:3000/api-docs`

**Features of Swagger Documentation:**
- **Interactive Testing**: Test API endpoints directly from the browser
- **Authentication Support**: Built-in JWT token authentication
- **Request/Response Examples**: Complete examples for all endpoints
- **Schema Validation**: Input validation rules and data models
- **Error Response Documentation**: Detailed error handling information

### Additional Documentation Endpoints

- **Swagger JSON**: `http://localhost:3000/api-docs.json` - Raw OpenAPI specification
- **Health Check**: `http://localhost:3000/health` - API status and documentation links
- **API Info**: `http://localhost:3000/` - Welcome endpoint with API overview

### Using Swagger UI

1. **Access the Documentation**: Navigate to `http://localhost:3000/api-docs`
2. **Authentication**: 
   - First, register a user or login via `/api/auth/login`
   - Copy the JWT token from the response
   - Click the "Authorize" button in Swagger UI
   - Enter: `Bearer <your-jwt-token>`
   - Click "Authorize" to authenticate
3. **Test Endpoints**: Click on any endpoint to expand it and click "Try it out"
4. **View Schemas**: Explore data models in the "Schemas" section

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

### User Management Endpoints (Admin/Editor only)

#### Get All Users
```http
GET /api/users?page=1&limit=10&role=user&search=john
Authorization: Bearer <admin-token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <admin-token>
```

#### Create User
```http
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "editor"
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "editor",
  "is_active": true
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <admin-token>
```

### Category Endpoints

#### Get All Categories
```http
GET /api/categories?page=1&limit=10&search=tech
```

#### Get Active Categories
```http
GET /api/categories/active
```

#### Get Category by ID
```http
GET /api/categories/:id
```

#### Create Category (Admin/Editor only)
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Technology",
  "description": "Tech news and updates",
  "slug": "technology"
}
```

#### Update Category (Admin/Editor only)
```http
PUT /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Technology",
  "is_active": true
}
```

#### Delete Category (Admin only)
```http
DELETE /api/categories/:id
Authorization: Bearer <admin-token>
```

### News Endpoints

#### Get All News
```http
GET /api/news?page=1&limit=10&status=published&category_id=1&search=tech
```

#### Get Published News
```http
GET /api/news/published?page=1&limit=10
```

#### Get Latest News
```http
GET /api/news/latest?limit=5
```

#### Search News
```http
GET /api/news/search?q=technology&page=1&limit=10
```

#### Get My News (Author's own articles)
```http
GET /api/news/my
Authorization: Bearer <token>
```

#### Get News by Category
```http
GET /api/news/category/:categoryId?page=1&limit=10
```

#### Get News by ID
```http
GET /api/news/:id
```

#### Get News by Slug
```http
GET /api/news/slug/:slug
```

#### Create News Article
```http
POST /api/news
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Breaking Tech News",
  "content": "Full article content here...",
  "summary": "Brief summary of the article",
  "status": "published",
  "category_id": 1,
  "featured_image": "https://example.com/image.jpg"
}
```

#### Update News Article
```http
PUT /api/news/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "published"
}
```

#### Delete News Article
```http
DELETE /api/news/:id
Authorization: Bearer <token>
```

## User Roles & Permissions

### Admin
- Full access to all endpoints
- Can manage users, categories, and news
- Can delete any content
- Can change user roles and status

### Editor
- Can view and manage users (limited)
- Can manage categories
- Can edit any news article
- Cannot delete users or change roles

### User
- Can manage their own profile
- Can create and manage their own news articles
- Can view published content
- Cannot access admin/editor functions

## Response Format

All API responses follow this consistent format:

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "details": "Additional error details (in development mode)"
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## Error Handling

The API includes comprehensive error handling for:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)
- Database constraint violations
- JWT token issues

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Configurable request rate limiting
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Comprehensive input validation and sanitization

## Logging

The application uses Winston for structured logging:
- Console logging for development
- File logging for production
- Different log levels (error, warn, info, http, debug)
- Request/response logging middleware

## Development

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests (if configured)
npm test

# Run database migrations (if needed)
npm run migrate
```

### Database Schema

The SQLite database includes three main tables:

1. **users**: User accounts with authentication and profile data
2. **categories**: News categories for organization
3. **news**: News articles with relationships to users and categories

Foreign key constraints ensure data integrity between related tables.

### API Testing with Swagger

1. **Start the server**: `npm start` or `npm run dev`
2. **Open Swagger UI**: Navigate to `http://localhost:3000/api-docs`
3. **Register/Login**: Use the auth endpoints to get a JWT token
4. **Authorize**: Click "Authorize" and enter `Bearer <your-token>`
5. **Test Endpoints**: Use the "Try it out" feature on any endpoint
6. **View Responses**: See live responses and status codes

### Development Tips

- **API Testing**: Use Swagger UI for interactive testing during development
- **Schema Validation**: Check the Swagger schemas for proper request/response formats
- **Authentication**: Always include `Bearer <token>` in Authorization header for protected endpoints
- **Error Handling**: Check error responses in Swagger for proper error handling
- **Rate Limiting**: Be aware of rate limits during development (100 requests per 15 minutes by default)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update Swagger documentation if adding new endpoints
6. Submit a pull request

## License

This project is licensed under the MIT License. 