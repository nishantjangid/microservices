# E-commerce Microservices

This project consists of three microservices: User, Cart, and Order services, built with TypeScript, Express, and AWS Lambda.

## Services Overview

- **User Service** (Port 3000): Handles user authentication and management
- **Cart Service** (Port 3001): Manages shopping cart operations
- **Order Service** (Port 3002): Handles order processing and management

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- MongoDB
- AWS Account (for SQS and Secrets Manager)

## Project Structure

```
services/
├── user/
│   ├── src/
│   │   ├── handlers/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── cart/
│   ├── src/
│   │   ├── handlers/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
└── order/
    ├── src/
    │   ├── handlers/
    │   ├── types/
    │   ├── utils/
    │   └── index.ts
    ├── package.json
    ├── tsconfig.json
    └── Dockerfile
```

## Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-microservices
   ```

2. **Install dependencies for each service**
   ```bash
   # User Service
   cd services/user
   npm install

   # Cart Service
   cd ../cart
   npm install

   # Order Service
   cd ../order
   npm install
   ```

3. **Configure environment variables**
   Create `.env` files in each service directory with the following variables:
   ```env
   # Common variables for all services
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   AWS_REGION=your-aws-region

   # User Service specific
   JWT_SECRET=your-jwt-secret
   USER_SERVICE_PORT=3000

   # Cart Service specific
   CART_SERVICE_PORT=3001
   CART_CREATED_QUEUE_URL=your-sqs-queue-url

   # Order Service specific
   ORDER_SERVICE_PORT=3002
   ORDER_CREATED_QUEUE_URL=your-sqs-queue-url
   ```

4. **Build and run services locally**

   For each service:
   ```bash
   # Build TypeScript
   npm run build

   # Start service
   npm start

   # For development with hot reload
   npm run dev
   ```

5. **Run with Docker**
   ```bash
   # Build and start all services
   docker-compose up --build

   # Stop all services
   docker-compose down
   ```

## Testing

Each service includes Jest configuration for testing. Run tests using:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## API Documentation

The API documentation is available through Swagger UI at `http://localhost:8080` when running with Docker.

## Development Workflow

1. **Code Structure**
   - Each service follows a similar structure with handlers, types, and utilities
   - AWS Lambda handlers are used for production
   - Express server is used for local development

2. **TypeScript Configuration**
   - All services use TypeScript 4.9.0
   - Strict mode is enabled
   - Source maps are generated for debugging

3. **Build Process**
   - TypeScript compilation
   - Source map generation
   - Clean build directory before compilation

4. **Docker Configuration**
   - Multi-stage builds for smaller images
   - Health checks for container monitoring
   - Environment variable configuration

## Common Issues and Solutions

1. **Module not found errors**
   - Ensure all dependencies are installed
   - Check TypeScript configuration
   - Verify import paths

2. **Docker build failures**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild from scratch: `docker-compose up --build --force-recreate`

3. **TypeScript compilation errors**
   - Run `npm run lint` to check for issues
   - Use `npm run lint:fix` to automatically fix some issues
   - Check type definitions in `tsconfig.json`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT 