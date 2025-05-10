import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, RegisterRequest, LoginRequest, AuthResponse, UserResponse } from '../types';
import { connectToMongoDB, getCollection, closeMongoDBConnection } from '../utils/mongodb';

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const USER_EVENTS_QUEUE_URL = process.env.USER_EVENTS_QUEUE_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password, firstName, lastName } = JSON.parse(event.body || '{}') as RegisterRequest;
    const users = await getCollection<User>('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'User already exists' })
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: User = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await users.insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Publish user created event
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: USER_EVENTS_QUEUE_URL,
      MessageBody: JSON.stringify({
        type: 'USER_CREATED',
        payload: { ...newUser, password: undefined },
        timestamp: new Date(),
        source: 'USER_SERVICE'
      })
    }));

    const response: AuthResponse = {
      token,
      user: { ...newUser, password: undefined } as UserResponse
    };

    return {
      statusCode: 201,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error registering user' })
    };
  }
};

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password } = JSON.parse(event.body || '{}') as LoginRequest;
    const users = await getCollection<User>('users');

    // Find user
    const user = await users.findOne({ email });
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      token,
      user: { ...user, password: undefined } as UserResponse
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error logging in' })
    };
  }
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    let result: APIGatewayProxyResult;

    switch (event.httpMethod) {
      case 'POST':
        if (event.path === '/register') {
          result = await register(event);
        } else if (event.path === '/login') {
          result = await login(event);
        } else {
          result = {
            statusCode: 404,
            body: JSON.stringify({ message: 'Not found' })
          };
        }
        break;
      default:
        result = {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    // Close MongoDB connection
    await closeMongoDBConnection();
    return result;
  } catch (error) {
    console.error('Error in handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 