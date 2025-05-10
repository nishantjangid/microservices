#!/bin/sh

# Set AWS CLI to use LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export ENDPOINT_URL=http://localstack:4566

# Create SQS queues
echo "Creating SQS queues..."

# User events queue
aws --endpoint-url=$ENDPOINT_URL sqs create-queue --queue-name user-events --region us-east-1

# Get queue URLs
USER_EVENTS_QUEUE_URL=$(aws --endpoint-url=$ENDPOINT_URL sqs get-queue-url --queue-name user-events --query 'QueueUrl' --output text)

echo "Created queues:"
echo "User Events Queue URL: $USER_EVENTS_QUEUE_URL"

# List all queues to verify
echo "Listing all queues:"
aws --endpoint-url=$ENDPOINT_URL sqs list-queues --region us-east-1 