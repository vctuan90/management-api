const express = require('express');
const router = express.Router();

const NewsController = require('../controllers/newsController');
const { authenticateToken, authorize, optionalAuth } = require('../middlewares/auth');
const { validate, validateId, newsSchemas, combinedQuerySchemas } = require('../utils/validation');

/**
 * @swagger
 * tags:
 *   name: News
 *   description: News articles management
 */

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news with pagination and filtering
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [id, title, status, published_at, created_at]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: author_id
 *         schema:
 *           type: integer
 *         description: Filter by author ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, content, and summary
 *     responses:
 *       200:
 *         description: News list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/News'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/',
  optionalAuth,
  validate(combinedQuerySchemas.newsList, 'query'),
  NewsController.getAllNews
);

/**
 * @swagger
 * /api/news/published:
 *   get:
 *     summary: Get published news only
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, content, and summary
 *     responses:
 *       200:
 *         description: Published news list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/News'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/published',
  validate(combinedQuerySchemas.newsList, 'query'),
  NewsController.getPublishedNews
);

/**
 * @swagger
 * /api/news/latest:
 *   get:
 *     summary: Get latest news
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Number of latest news to retrieve
 *     responses:
 *       200:
 *         description: Latest news retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/News'
 */
router.get('/latest',
  NewsController.getLatestNews
);

/**
 * @swagger
 * /api/news/search:
 *   get:
 *     summary: Search news articles
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *           default: published
 *         description: Filter by status (default: published)
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     search_term:
 *                       type: string
 *                       description: The search query used
 *                     news:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/News'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Search term too short
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: error
 *               message: Search term must be at least 2 characters long
 */
router.get('/search',
  NewsController.searchNews
);

/**
 * @swagger
 * /api/news/my:
 *   get:
 *     summary: Get current user's news articles
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, content, and summary
 *     responses:
 *       200:
 *         description: User's news articles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/News'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my',
  authenticateToken,
  validate(combinedQuerySchemas.newsList, 'query'),
  NewsController.getMyNews
);

/**
 * @swagger
 * /api/news/category/{categoryId}:
 *   get:
 *     summary: Get news by category
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, content, and summary
 *     responses:
 *       200:
 *         description: News by category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *                     news:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/News'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Category not found
 */
router.get('/category/:categoryId',
  validateId,
  NewsController.getNewsByCategory
);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get news by ID
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: News ID
 *     responses:
 *       200:
 *         description: News article retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       $ref: '#/components/schemas/News'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       400:
 *         description: Invalid ID parameter
 */
router.get('/:id',
  validateId,
  NewsController.getNewsById
);

/**
 * @swagger
 * /api/news/slug/{slug}:
 *   get:
 *     summary: Get news by slug
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: News slug
 *     responses:
 *       200:
 *         description: News article retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       $ref: '#/components/schemas/News'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/slug/:slug',
  NewsController.getNewsBySlug
);

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Create a new news article
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: News title
 *                 example: Breaking Tech News
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: Full article content
 *                 example: This is the full content of the news article...
 *               summary:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Brief summary (optional)
 *                 example: Brief summary of the article
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: URL-friendly slug (optional, auto-generated if not provided)
 *                 example: breaking-tech-news
 *               featured_image:
 *                 type: string
 *                 format: uri
 *                 description: Featured image URL (optional)
 *                 example: https://example.com/image.jpg
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *                 description: Publication status
 *               category_id:
 *                 type: integer
 *                 description: Category ID (optional)
 *                 example: 1
 *     responses:
 *       201:
 *         description: News article created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: News article created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       $ref: '#/components/schemas/News'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/',
  authenticateToken,
  validate(newsSchemas.create),
  NewsController.createNews
);

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: Update news by ID
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: News ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: News title
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: Full article content
 *               summary:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Brief summary
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: URL-friendly slug
 *               featured_image:
 *                 type: string
 *                 format: uri
 *                 description: Featured image URL
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 description: Publication status
 *               category_id:
 *                 type: integer
 *                 description: Category ID
 *     responses:
 *       200:
 *         description: News article updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: News article updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       $ref: '#/components/schemas/News'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id',
  authenticateToken,
  validateId,
  validate(newsSchemas.update),
  NewsController.updateNews
);

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Delete news by ID
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: News ID
 *     responses:
 *       200:
 *         description: News article deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: News article deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id',
  authenticateToken,
  validateId,
  NewsController.deleteNews
);

module.exports = router;