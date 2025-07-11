import { Request, Response } from 'express';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {
  User,
  RegisterUserRequest,
  LoginRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserEvent
} from '../types/user';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const AWS_REGION = process.env.AWS_DEFAULT_REGION || 'us-east-1';
const AWS_ENDPOINT_URL = process.env.AWS_ENDPOINT_URL || 'http://localstack:4566';
const USER_EVENTS_QUEUE_URL = process.env.USER_EVENTS_QUEUE_URL || 'http://localstack:4566/000000000000/user-events';

// Initialize MongoDB client
const client = new MongoClient(MONGODB_URI);
const db = client.db('ecommerce');
const usersCollection = db.collection<User>('users');

// Initialize SQS client
const sqsClient = new SQSClient({
  region: AWS_REGION,
  endpoint: AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
});

// Helper function to send events to SQS
async function sendUserEvent(event: UserEvent): Promise<void> {
  try {
    const command = new SendMessageCommand({
      QueueUrl: USER_EVENTS_QUEUE_URL,
      MessageBody: JSON.stringify(event)
    });
    await sqsClient.send(command);
  } catch (error) {
    console.error('Error sending SQS message:', error);
  }
}

// AWS Lambda handler for event-based operations
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body is required' })
      };
    }

    const { action, data } = JSON.parse(event.body);

    switch (action) {
    case 'getUser': {
      const user = await usersCollection.findOne({ id: data.userId }, { projection: { password: 0 } });
      if (!user) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'User not found' })
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(user)
      };
    }

    case 'validateUser': {
      const { userId } = data;
      const existingUser = await usersCollection.findOne({ id: userId });
      return {
        statusCode: existingUser ? 200 : 404,
        body: JSON.stringify({ exists: !!existingUser })
      };
    }

    default:
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid action' })
      };
    }
  } catch (error) {
    console.error('Error in event handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// Register a new user
export async function registerUser(req: Request<Record<string, never>, Record<string, never>, RegisterUserRequest>, res: Response): Promise<void> {
  try {
    const { email, password, firstName, lastName, phoneNumber, address } = req.body;

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: User = {
      id: new ObjectId().toString(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      address,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save user to database
    await usersCollection.insertOne(newUser);

    // Remove password from response
    delete newUser.password;
    res.status(201).json(newUser);

    // Send user created event
    await sendUserEvent({
      type: 'USER_CREATED',
      data: {
        userId: newUser.id,
        email: newUser.email,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
}

// Login user
export async function loginUser(req: Request<Record<string, never>, Record<string, never>, LoginRequest>, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    delete user.password;
    res.json({ token, user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
}

// Change password
export async function changePassword(req: Request<Record<string, never>, Record<string, never>, ChangePasswordRequest>, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as { user?: { userId: string } }).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Find user
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await usersCollection.updateOne(
      { id: userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
}

// Forgot password
export async function forgotPassword(req: Request<Record<string, never>, Record<string, never>, ForgotPasswordRequest>, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send reset token via email
    // For now, just return the token
    res.json({ message: 'Reset token generated', resetToken });
  } catch (error) {
    console.error('Error generating reset token:', error);
    res.status(500).json({ message: 'Error generating reset token' });
  }
}

// Reset password
export async function resetPassword(req: Request<Record<string, never>, Record<string, never>, ResetPasswordRequest>, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Find user
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await usersCollection.updateOne(
      { id: userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
}

// Update profile
export async function updateProfile(req: Request<Record<string, never>, Record<string, never>, UpdateProfileRequest>, res: Response): Promise<void> {
  try {
    const userId = (req as { user?: { userId: string } }).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const updates = req.body;

    // Find user
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update user
    await usersCollection.updateOne(
      { id: userId },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    // Send user updated event
    await sendUserEvent({
      type: 'USER_UPDATED',
      data: {
        userId,
        email: user.email,
        timestamp: new Date()
      }
    });

    // Get updated user
    const updatedUser = await usersCollection.findOne({ id: userId });
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found after update' });
      return;
    }

    delete updatedUser.password;
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
}

// Get user profile
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as { user?: { userId: string } }).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Find user
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Remove password from response
    delete user.password;
    res.json(user);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Error getting profile' });
  }
} 