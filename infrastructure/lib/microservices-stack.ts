import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class MicroservicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SQS queues for event communication
    const userEventsQueue = new sqs.Queue(this, 'UserEventsQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    const cartEventsQueue = new sqs.Queue(this, 'CartEventsQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    const orderEventsQueue = new sqs.Queue(this, 'OrderEventsQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Create JWT secret
    const jwtSecret = new secretsmanager.Secret(this, 'JWTSecret', {
      secretName: 'jwt-secret',
      description: 'JWT secret for authentication',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ secret: '' }),
        generateStringKey: 'secret',
        excludeCharacters: '{}[]()\'"/\\@:',
      },
    });

    // Common Lambda environment variables
    const commonEnvVars = {
      NODE_ENV: 'production',
      JWT_SECRET: jwtSecret.secretValueFromJson('secret').toString(),
    };

    // Create User Service Lambda
    const userService = new lambda.Function(this, 'UserService', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'userHandler.handler',
      code: lambda.Code.fromAsset('services/user/dist'),
      environment: {
        ...commonEnvVars,
        USER_EVENTS_QUEUE_URL: userEventsQueue.queueUrl,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Create Cart Service Lambda
    const cartService = new lambda.Function(this, 'CartService', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'cartHandler.handler',
      code: lambda.Code.fromAsset('services/cart/dist'),
      environment: {
        ...commonEnvVars,
        CART_EVENTS_QUEUE_URL: cartEventsQueue.queueUrl,
        USER_EVENTS_QUEUE_URL: userEventsQueue.queueUrl,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Create Order Service Lambda
    const orderService = new lambda.Function(this, 'OrderService', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'orderHandler.handler',
      code: lambda.Code.fromAsset('services/order/dist'),
      environment: {
        ...commonEnvVars,
        ORDER_EVENTS_QUEUE_URL: orderEventsQueue.queueUrl,
        CART_EVENTS_QUEUE_URL: cartEventsQueue.queueUrl,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant permissions
    userEventsQueue.grantSendMessages(userService);
    userEventsQueue.grantConsumeMessages(cartService);
    cartEventsQueue.grantSendMessages(cartService);
    cartEventsQueue.grantConsumeMessages(orderService);
    orderEventsQueue.grantSendMessages(orderService);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'EcommerceApi', {
      restApiName: 'Ecommerce Service',
      description: 'Ecommerce microservices API',
    });

    // Auth endpoints
    const authResource = api.root.addResource('auth');
    authResource.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(userService));
    authResource.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(userService));

    // User endpoints
    const userResource = api.root.addResource('users');
    userResource.addMethod('POST', new apigateway.LambdaIntegration(userService));
    userResource.addResource('{userId}').addMethod('GET', new apigateway.LambdaIntegration(userService));

    // Cart endpoints
    const cartResource = api.root.addResource('cart');
    cartResource.addMethod('GET', new apigateway.LambdaIntegration(cartService));
    cartResource.addMethod('PUT', new apigateway.LambdaIntegration(cartService));

    // Order endpoints
    const orderResource = api.root.addResource('orders');
    orderResource.addMethod('POST', new apigateway.LambdaIntegration(orderService));
    orderResource.addResource('{orderId}').addMethod('GET', new apigateway.LambdaIntegration(orderService));
  }
} 