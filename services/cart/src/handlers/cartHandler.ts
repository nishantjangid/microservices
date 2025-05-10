import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MongoClient, ObjectId } from 'mongodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const CART_EVENTS_QUEUE_URL = process.env.CART_EVENTS_QUEUE_URL || '';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Cart {
  _id: ObjectId;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Request body is required' }),
        };
      }

      const { userId, items } = JSON.parse(event.body);

      // Validate input
      if (!userId || !items || !Array.isArray(items) || items.length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'User ID and items array are required' }),
        };
      }

      // Connect to MongoDB
      const client = await MongoClient.connect(MONGODB_URI);
      const db = client.db('ecommerce');
      const cartsCollection = db.collection<Cart>('carts');

      // Check if cart exists
      const existingCart = await cartsCollection.findOne({ userId });
      if (existingCart) {
        await client.close();
        return {
          statusCode: 409,
          body: JSON.stringify({ message: 'Cart already exists' }),
        };
      }

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create cart
      const cart = {
        userId,
        items,
        total,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await cartsCollection.insertOne(cart as Cart);

      // Publish cart created event
      const sqsClient = new SQSClient({});
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: CART_EVENTS_QUEUE_URL,
        MessageBody: JSON.stringify({
          type: 'CART_CREATED',
          data: {
            cartId: result.insertedId.toString(),
            userId: cart.userId,
            items: cart.items,
            total: cart.total,
          },
        }),
      }));

      await client.close();

      return {
        statusCode: 201,
        body: JSON.stringify({
          id: result.insertedId.toString(),
          userId: cart.userId,
          items: cart.items,
          total: cart.total,
        }),
      };
    } else if (event.httpMethod === 'GET') {
      const userId = event.pathParameters?.userId;
      
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'User ID is required' }),
        };
      }

      // Connect to MongoDB
      const client = await MongoClient.connect(MONGODB_URI);
      const db = client.db('ecommerce');
      const cartsCollection = db.collection<Cart>('carts');

      const cart = await cartsCollection.findOne({ userId });
      
      await client.close();

      if (!cart) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Cart not found' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(cart),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error handling cart:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error handling cart' }),
    };
  }
}; 