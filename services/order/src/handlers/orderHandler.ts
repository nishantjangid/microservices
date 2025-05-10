import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MongoClient, ObjectId } from 'mongodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const ORDER_EVENTS_QUEUE_URL = process.env.ORDER_EVENTS_QUEUE_URL || '';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  _id: ObjectId;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: ShippingAddress;
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

      const { userId, items, shippingAddress } = JSON.parse(event.body);

      // Validate input
      if (!userId || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'User ID, items array, and shipping address are required' }),
        };
      }

      // Connect to MongoDB
      const client = await MongoClient.connect(MONGODB_URI);
      const db = client.db('ecommerce');
      const ordersCollection = db.collection<Order>('orders');

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      const order = {
        userId,
        items,
        total,
        status: 'PENDING' as const,
        shippingAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await ordersCollection.insertOne(order as Order);

      // Publish order created event
      const sqsClient = new SQSClient({});
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: ORDER_EVENTS_QUEUE_URL,
        MessageBody: JSON.stringify({
          type: 'ORDER_CREATED',
          data: {
            orderId: result.insertedId.toString(),
            userId: order.userId,
            items: order.items,
            total: order.total,
            status: order.status,
            shippingAddress: order.shippingAddress,
          },
        }),
      }));

      await client.close();

      return {
        statusCode: 201,
        body: JSON.stringify({
          id: result.insertedId.toString(),
          userId: order.userId,
          items: order.items,
          total: order.total,
          status: order.status,
          shippingAddress: order.shippingAddress,
        }),
      };
    } else if (event.httpMethod === 'GET') {
      const orderId = event.pathParameters?.orderId;
      
      if (!orderId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Order ID is required' }),
        };
      }

      // Connect to MongoDB
      const client = await MongoClient.connect(MONGODB_URI);
      const db = client.db('ecommerce');
      const ordersCollection = db.collection<Order>('orders');

      const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
      
      await client.close();

      if (!order) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Order not found' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(order),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error handling order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error handling order' }),
    };
  }
}; 