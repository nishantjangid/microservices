import express from 'express';
import { handler } from './handlers/userHandler';
import userRoutes from './routes/userRoutes';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Express routes
app.use('/api/users', userRoutes);

// Event-based endpoint
app.post('/events', async (req, res) => {
  try {
    const result = await handler({
      body: JSON.stringify(req.body),
      pathParameters: req.params,
      queryStringParameters: req.query as any,
      headers: req.headers as any,
      httpMethod: req.method,
      isBase64Encoded: false,
      path: req.path,
      requestContext: {} as any,
      resource: '',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: {},
    });

    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Error handling event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`User service listening on port ${port}`);
}); 