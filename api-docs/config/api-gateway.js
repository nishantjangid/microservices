const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// User Service Routes
router.use('/api/users', createProxyMiddleware({
  target: 'http://user-service:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  }
}));

// Cart Service Routes
router.use('/api/cart', createProxyMiddleware({
  target: 'http://cart-service:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/cart': '/api/cart'
  }
}));

// Order Service Routes
router.use('/api/orders', createProxyMiddleware({
  target: 'http://order-service:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  }
}));

// Event-based Routes
router.use('/events', createProxyMiddleware({
  target: 'http://user-service:3000',
  changeOrigin: true
}));

module.exports = router; 