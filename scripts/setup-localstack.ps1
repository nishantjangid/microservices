# Set AWS CLI to use LocalStack
$env:AWS_ACCESS_KEY_ID = "test"
$env:AWS_SECRET_ACCESS_KEY = "test"
$env:AWS_DEFAULT_REGION = "us-east-1"
$env:ENDPOINT_URL = "http://localhost:4566"

# Create SQS queues
Write-Host "Creating SQS queues..."

# User events queue
aws --endpoint-url=$env:ENDPOINT_URL sqs create-queue --queue-name user-events

# Get queue URLs
$USER_EVENTS_QUEUE_URL = aws --endpoint-url=$env:ENDPOINT_URL sqs get-queue-url --queue-name user-events --query 'QueueUrl' --output text

Write-Host "Created queues:"
Write-Host "User Events Queue URL: $USER_EVENTS_QUEUE_URL"

# List all queues to verify
Write-Host "Listing all queues:"
aws --endpoint-url=$env:ENDPOINT_URL sqs list-queues 