import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, RegisterRequest, LoginRequest, AuthResponse, UserResponse } from '../types';
import { connectToMongoDB, getCollection, closeMongoDBConnection } from '../utils/mongodb';

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const USER_EVENTS_QUEUE_URL = process.env.USER_EVENTS_QUEUE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

if (!USER_EVENTS_QUEUE_URL) {
  throw new Error('USER_EVENTS_QUEUE_URL environment variable is not set');
}

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
    const newUser = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await users.insertOne(newUser);
    const userId = insertResult.insertedId.toString();

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Publish user created event
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: USER_EVENTS_QUEUE_URL,
      MessageBody: JSON.stringify({
        type: 'USER_CREATED',
        payload: { ...newUser, id: userId, password: undefined },
        timestamp: new Date(),
        source: 'USER_SERVICE'
      })
    }));

    const response: AuthResponse = {
      token,
      user: { ...newUser, id: userId, _id: userId, password: undefined } as unknown as UserResponse
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

    // Use _id for JWT
    const userId = (user as any)._id?.toString();

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      token,
      user: { ...user, id: userId, _id: userId, password: undefined } as unknown as UserResponse
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

export async function generateToken(user: User): Promise<string> {
  return jwt.sign(
    { userId: (user as any)._id?.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string }> {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  return decoded;
} 