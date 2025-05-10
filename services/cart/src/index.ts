import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayEventRequestContextWithAuthorizer, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { handler } from './handlers/cartHandler';
import express, { Request, Response } from 'express';

export { handler };

export const main = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return handler(event);
};

// Start Express server
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.all('*', async (req: Request, res: Response) => {
  // Convert headers to single string values
  const headers: { [key: string]: string } = {};
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  });

  // Convert query parameters to single string values
  const queryParams: { [key: string]: string } = {};
  Object.entries(req.query).forEach(([key, value]) => {
    if (value) {
      const strValue = Array.isArray(value) ? value[0] : value;
      queryParams[key] = typeof strValue === 'string' ? strValue : String(strValue);
    }
  });

  const event: APIGatewayProxyEvent = {
    body: JSON.stringify(req.body),
    headers,
    httpMethod: req.method,
    isBase64Encoded: false,
    path: req.path,
    pathParameters: req.params,
    queryStringParameters: queryParams,
    requestContext: {} as APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>,
    resource: req.path,
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null
  };

  try {
    const result = await handler(event);
    res.status(result.statusCode).send(JSON.parse(result.body));
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Cart service listening on port ${port}`);
}); 