# E-commerce Microservices

This project consists of three microservices: User, Cart, and Order services, built with TypeScript, Express, and AWS Lambda.

## Services Overview

- **User Service** (Port 3000): Handles user authentication and management
- **Cart Service** (Port 3001): Manages shopping cart operations
- **Order Service** (Port 3002): Handles order processing and management

## Accessing Services

### MongoDB
MongoDB is running on port 27017 and can be accessed in several ways:

1. **Using MongoDB Compass (GUI)**
   - Download and install [MongoDB Compass](https://www.mongodb.com/try/download/compass)
   - Connect using: `mongodb://localhost:27017`
   - Default database: `ecommerce`

2. **Using MongoDB Shell**
   ```bash
   # Install MongoDB Shell if not already installed
   # Then connect using:
   mongosh mongodb://localhost:27017
   ```

3. **Using Docker**
   ```bash
   # Access MongoDB shell directly in the container
   docker exec -it ecommerce-mongodb mongosh
   ```

### LocalStack (AWS Services)
LocalStack provides local AWS services and is accessible at:
- Endpoint URL: `http://localhost:4566`
- Region: `us-east-1`
- Access Key: `test`
- Secret Key: `test`

### Swagger UI
API documentation is available at:
- URL: `http://localhost:8080`
- Access the interactive API documentation for all services

### Service Endpoints
- User Service: `http://localhost:3001`
- Cart Service: `http://localhost:3002`
- Order Service: `http://localhost:3003`

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

## Support

For support, please open an issue in the repository.

## Jenkins Pipeline Setup and Deployment

### 1. Jenkins Server Setup

1. **Install Jenkins**
   ```bash
   # For Ubuntu/Debian
   sudo apt update
   sudo apt install openjdk-11-jdk
   wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
   sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
   sudo apt update
   sudo apt install jenkins
   sudo systemctl start jenkins
   sudo systemctl enable jenkins
   ```

2. **Initial Jenkins Setup**
   - Access Jenkins at `http://your-server:8080`
   - Get initial admin password:
     ```bash
     sudo cat /var/lib/jenkins/secrets/initialAdminPassword
     ```
   - Install suggested plugins
   - Create admin user

### 2. Required Jenkins Plugins

Install these plugins in Jenkins:
1. Pipeline
2. AWS Pipeline
3. NodeJS Plugin
4. Git Integration
5. Credentials Plugin
6. Environment Injector
7. JUnit Plugin
8. Email Extension

### 3. Configure Jenkins Credentials

1. **AWS Credentials**
   - Go to Jenkins > Credentials > System > Global credentials
   - Add new credentials:
     - Kind: AWS Credentials
     - ID: aws-credentials
     - Access Key ID: Your AWS Access Key
     - Secret Access Key: Your AWS Secret Key

2. **MongoDB Credentials**
   - Add new credentials:
     - Kind: Secret text
     - ID: mongodb-uri
     - Secret: Your MongoDB Atlas connection string

3. **JWT Secret**
   - Add new credentials:
     - Kind: Secret text
     - ID: jwt-secret
     - Secret: Your JWT secret key

### 4. Configure Node.js in Jenkins

1. Go to Jenkins > Manage Jenkins > Global Tool Configuration
2. Add NodeJS installation:
   - Name: NodeJS 18
   - Version: 18.x
   - Global npm packages: typescript, aws-cdk

### 5. Create Jenkins Pipeline

1. **Create New Pipeline**
   - Go to Jenkins > New Item
   - Name: ecommerce-microservices
   - Type: Pipeline
   - Click OK

2. **Configure Pipeline**
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your repository URL
   - Credentials: Add your Git credentials
   - Branch: */main
   - Script Path: Jenkinsfile

### 6. Jenkinsfile Configuration

Create a `Jenkinsfile` in your repository root:

```groovy
pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-east-1'
        NODE_ENV = 'production'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 18') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Lint') {
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 18') {
                    sh 'npm run lint'
                }
            }
        }
        
        stage('Test') {
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 18') {
                    sh 'npm test'
                }
            }
            post {
                always {
                    junit '**/junit.xml'
                }
            }
        }
        
        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 18') {
                    sh 'npm run build'
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 18') {
                    sh 'npm run snyk:test'
                }
            }
        }
        
        stage('Deploy') {
            steps {
                withAWS(credentials: 'aws-credentials', region: 'us-east-1') {
                    nodejs(nodeJSInstallationName: 'NodeJS 18') {
                        sh 'npm run deploy'
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            emailext (
                subject: "Pipeline Successful: ${currentBuild.fullDisplayName}",
                body: "Your pipeline has completed successfully.",
                to: '${DEFAULT_RECIPIENTS}'
            )
        }
        failure {
            emailext (
                subject: "Pipeline Failed: ${currentBuild.fullDisplayName}",
                body: "Your pipeline has failed. Please check the console output.",
                to: '${DEFAULT_RECIPIENTS}'
            )
        }
    }
}
```

### 7. Running the Pipeline

1. **Manual Trigger**
   - Go to your pipeline in Jenkins
   - Click "Build Now"

2. **Automatic Trigger**
   - Configure webhook in your Git repository
   - Add webhook URL: `http://your-jenkins-url/github-webhook/`
   - Select events: Push and Pull Request

3. **Monitor Pipeline**
   - View pipeline progress in Jenkins dashboard
   - Check console output for details
   - Review test results and security scan reports

### 8. Pipeline Environment Variables

Add these to Jenkins > Manage Jenkins > Configure System > Global properties:

```bash
MONGODB_URI=${mongodb-uri}
JWT_SECRET=${jwt-secret}
NODE_ENV=production
```

### 9. Troubleshooting Pipeline

1. **Build Failures**
   - Check console output
   - Verify credentials
   - Check AWS permissions
   - Verify Node.js installation

2. **Deployment Issues**
   - Check AWS CDK logs
   - Verify AWS credentials
   - Check Lambda function logs
   - Verify MongoDB connection

3. **Test Failures**
   - Review test reports
   - Check test environment
   - Verify test data

### 10. Pipeline Maintenance

1. **Regular Updates**
   - Update Node.js version
   - Update dependencies
   - Review security scans
   - Update AWS CDK

2. **Monitoring**
   - Set up Jenkins monitoring
   - Configure alerts
   - Review build history
   - Check resource usage

## Docker Setup

### 1. Local Development with Docker

1. **Install Docker**
   ```bash
   # For Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

2. **Docker Compose Configuration**
   Create `docker-compose.yml` in your project root:
   ```yaml
   version: '3.8'

   services:
     user-service:
       build:
         context: ./services/user
         dockerfile: Dockerfile
       environment:
         - NODE_ENV=development
         - MONGODB_URI=${MONGODB_URI}
         - JWT_SECRET=${JWT_SECRET}
       ports:
         - "3001:3000"
       volumes:
         - ./services/user:/app
         - /app/node_modules

     cart-service:
       build:
         context: ./services/cart
         dockerfile: Dockerfile
       environment:
         - NODE_ENV=development
         - MONGODB_URI=${MONGODB_URI}
       ports:
         - "3002:3000"
       volumes:
         - ./services/cart:/app
         - /app/node_modules

     order-service:
       build:
         context: ./services/order
         dockerfile: Dockerfile
       environment:
         - NODE_ENV=development
         - MONGODB_URI=${MONGODB_URI}
       ports:
         - "3003:3000"
       volumes:
         - ./services/order:/app
         - /app/node_modules

     mongodb:
       image: mongo:latest
       ports:
         - "27017:27017"
       volumes:
         - mongodb_data:/data/db

   volumes:
     mongodb_data:
   ```

3. **Service Dockerfiles**
   Create `Dockerfile` in each service directory:
   ```dockerfile
   # services/user/Dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

4. **Run Services Locally**
   ```bash
   # Start all services
   docker-compose up

   # Start specific service
   docker-compose up user-service

   # Run in detached mode
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop services
   docker-compose down
   ```

### 2. Docker in Jenkins Pipeline

1. **Update Jenkinsfile**
   Add Docker stages to your pipeline:
   ```groovy
   pipeline {
       agent any
       
       environment {
           DOCKER_REGISTRY = 'your-registry.azurecr.io'
           DOCKER_CREDENTIALS = credentials('docker-credentials')
       }
       
       stages {
           // ... existing stages ...
           
           stage('Build Docker Images') {
               steps {
                   script {
                       // Build and tag images
                       docker.build("${DOCKER_REGISTRY}/user-service:${BUILD_NUMBER}", "./services/user")
                       docker.build("${DOCKER_REGISTRY}/cart-service:${BUILD_NUMBER}", "./services/cart")
                       docker.build("${DOCKER_REGISTRY}/order-service:${BUILD_NUMBER}", "./services/order")
                   }
               }
           }
           
           stage('Push Docker Images') {
               steps {
                   script {
                       // Login to registry
                       sh "echo ${DOCKER_CREDENTIALS} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_CREDENTIALS_USR} --password-stdin"
                       
                       // Push images
                       docker.withRegistry("${DOCKER_REGISTRY}") {
                           docker.image("${DOCKER_REGISTRY}/user-service:${BUILD_NUMBER}").push()
                           docker.image("${DOCKER_REGISTRY}/cart-service:${BUILD_NUMBER}").push()
                           docker.image("${DOCKER_REGISTRY}/order-service:${BUILD_NUMBER}").push()
                       }
                   }
               }
           }
           
           stage('Deploy to AWS') {
               steps {
                   script {
                       // Update Lambda functions with new Docker images
                       sh """
                           aws lambda update-function-code \
                           --function-name user-service \
                           --image-uri ${DOCKER_REGISTRY}/user-service:${BUILD_NUMBER}
                           
                           aws lambda update-function-code \
                           --function-name cart-service \
                           --image-uri ${DOCKER_REGISTRY}/cart-service:${BUILD_NUMBER}
                           
                           aws lambda update-function-code \
                           --function-name order-service \
                           --image-uri ${DOCKER_REGISTRY}/order-service:${BUILD_NUMBER}
                       """
                   }
               }
           }
       }
   }
   ```

2. **Configure Docker in Jenkins**
   ```bash
   # Install Docker in Jenkins
   sudo apt-get update
   sudo apt-get install docker.io
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```

3. **Add Docker Credentials**
   - Go to Jenkins > Credentials > System > Global credentials
   - Add new credentials:
     - Kind: Username with password
     - ID: docker-credentials
     - Username: Your Docker registry username
     - Password: Your Docker registry password

### 3. Docker Best Practices

1. **Multi-stage Builds**
   ```dockerfile
   # Build stage
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   # Production stage
   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY package*.json ./
   RUN npm install --production
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Security Scanning**
   ```bash
   # Add to Jenkinsfile
   stage('Docker Security Scan') {
       steps {
           script {
               sh """
                   docker run --rm \
                   -v /var/run/docker.sock:/var/run/docker.sock \
                   aquasec/trivy image ${DOCKER_REGISTRY}/user-service:${BUILD_NUMBER}
               """
           }
       }
   }
   ```

3. **Resource Limits**
   ```yaml
   # In docker-compose.yml
   services:
     user-service:
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
   ```

### 4. Docker Monitoring

1. **Container Health Checks**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s \
     CMD curl -f http://localhost:3000/health || exit 1
   ```

2. **Logging Configuration**
   ```yaml
   # In docker-compose.yml
   services:
     user-service:
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   ```

3. **Metrics Collection**
   ```yaml
   # Add to docker-compose.yml
   services:
     prometheus:
       image: prom/prometheus
       volumes:
         - ./prometheus.yml:/etc/prometheus/prometheus.yml
       ports:
         - "9090:9090"

     grafana:
       image: grafana/grafana
       ports:
         - "3000:3000"
       volumes:
         - grafana_data:/var/lib/grafana
   ```

### 5. Docker Troubleshooting

1. **Common Issues**
   ```bash
   # Check container logs
   docker logs <container-id>

   # Check container status
   docker ps -a

   # Check container resources
   docker stats

   # Remove unused containers
   docker container prune

   # Remove unused images
   docker image prune
   ```

2. **Network Issues**
   ```bash
   # Check network
   docker network ls
   docker network inspect <network-name>

   # Create custom network
   docker network create ecommerce-network
   ```

3. **Volume Issues**
   ```bash
   # Check volumes
   docker volume ls
   docker volume inspect <volume-name>

   # Clean up volumes
   docker volume prune
   ``` 