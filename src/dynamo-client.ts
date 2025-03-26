import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

console.error('# Starting DynamoDB client configuration');

let dynamoDbClient: DynamoDBClient | null = null;
let dynamoDbDocClient: DynamoDBDocumentClient | null = null;

export const getDynamodb = (): DynamoDBDocumentClient => {
  if (!dynamoDbDocClient) {
    dynamoDbClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
  }
  return dynamoDbDocClient;
};

console.error('# DynamoDB client configuration completed:', {
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not set',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'not set',
});
