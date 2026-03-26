const swaggerJSDoc = require('swagger-jsdoc');

const port = process.env.PORT || 3000;
const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Cross Road Game API',
      version: '1.0.0',
      description: 'API documentation for Cross Road Game API.',
    },
    servers: [{ url: serverUrl }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f1c1b2a3b4c5d6e7f8a901' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'player1' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            credits: { type: 'number', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'username', 'role'],
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'player1' },
            password: { type: 'string', example: 'P@ssw0rd!' },
          },
          required: ['email', 'username', 'password'],
        },
        LoginRequest: {
          type: 'object',
          oneOf: [
            {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', example: 'user@example.com' },
                username: { type: 'string', nullable: true, example: 'player1' },
                password: { type: 'string', example: 'P@ssw0rd!' },
              },
            },
            {
              type: 'object',
              required: ['username', 'password'],
              properties: {
                email: { type: 'string', nullable: true, example: 'user@example.com' },
                username: { type: 'string', example: 'player1' },
                password: { type: 'string', example: 'P@ssw0rd!' },
              },
            },
          ],
          properties: {
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'player1' },
            password: { type: 'string', example: 'P@ssw0rd!' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
          required: ['token', 'user'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Internal Server Error' },
            error: { type: 'string', nullable: true },
          },
          required: ['message'],
        },
        ShopPurchaseResponse: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['shield', 'character', 'adblock'] },
            creditsSpent: { type: 'number', example: 10 },
            purchaseId: { type: 'string' },
            characterId: { type: 'string' },
          },
          required: ['type', 'creditsSpent', 'purchaseId'],
        },
        GameInfoResponse: {
          type: 'object',
          properties: {
            creditRemaining: { type: 'number', example: 100 },
            maxScore: { type: 'number', example: 1234 },
            shieldCount: { type: 'number', example: 2 },
            boughtCharacters: {
              type: 'array',
              items: { type: 'string' },
              example: ['char_1', 'char_2'],
            },
            adblockStatus: { type: 'boolean', example: false },
          },
          required: [
            'creditRemaining',
            'maxScore',
            'shieldCount',
            'boughtCharacters',
            'adblockStatus',
          ],
        },
      },
    },
  },
  apis: [require('path').join(__dirname, '..', 'routes', '*.js')],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerSpec };

