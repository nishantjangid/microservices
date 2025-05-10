const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const cors = require('cors');
const apiGateway = require('./src/config/api-gateway');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// API Gateway Routes
app.use(apiGateway);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "E-commerce Microservices API Documentation"
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    services: {
      user: 'http://user-service:3000',
      cart: 'http://cart-service:3000',
      order: 'http://order-service:3000'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Microservices API Gateway listening on port ${port}`);
  console.log(`Swagger UI available at http://localhost:8081/api-docs`);
  console.log('Available routes:');
  console.log('- User Service: /api/users');
  console.log('- Cart Service: /api/cart');
  console.log('- Order Service: /api/orders');
  console.log('- Events: /events');
}); 