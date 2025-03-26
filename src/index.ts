#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  listTables,
  describeTable,
  scanTable,
  queryTable,
  paginateQueryTable,
  getItem,
  getTableAttributes,
  countItems,
} from './dynamo-helpers';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';

const server = new McpServer({
  name: 'dynamo-readonly-mcp',
  version: '0.0.1',
});

server.tool('list-tables', 'Get a list of all DynamoDB tables', {}, async () => {
  try {
    console.error('# list-tables tool has been called');
    const tables = await listTables();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tables, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error occurred: ${error.message}`,
        },
      ],
    };
  }
});

server.tool(
  'describe-table',
  'Get detailed information about a DynamoDB table',
  {
    tableName: z.string().describe('Name of the table to get details for'),
  },
  async ({ tableName }) => {
    try {
      const tableInfo = await describeTable(tableName);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(tableInfo, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error occurred: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'scan-table',
  'Scan items from a DynamoDB table',
  {
    tableName: z.string().describe('Name of the table to scan'),
    limit: z.number().optional().describe('Maximum number of items to return (default: 20)'),
    filterExpression: z.string().optional().describe("Filter expression (e.g: 'age > :minAge')"),
    expressionAttributeValues: z
      .record(z.any())
      .optional()
      .describe('Filter expression attribute values (JSON format)'),
    projectionExpression: z.string().optional().describe('Projection expression (e.g: "id")'),
  },
  async ({
    tableName,
    limit,
    filterExpression,
    expressionAttributeValues,
    projectionExpression,
  }) => {
    try {
      const items = await scanTable(
        tableName,
        limit,
        filterExpression,
        expressionAttributeValues,
        projectionExpression
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(items, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error occurred: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'query-table',
  'Query items from a DynamoDB table based on conditions',
  {
    tableName: z.string().describe('Name of the table to query'),
    keyConditionExpression: z.string().describe("Key condition expression (e.g: 'PK = :pk')"),
    expressionAttributeValues: z
      .record(z.any())
      .describe('Filter expression attribute values (JSON format)'),
    indexName: z.string().optional().describe('Name of the index to use (optional)'),
    filterExpression: z.string().optional().describe('Filter expression (optional)'),
    limit: z.number().optional().describe('Maximum number of items to return'),
    projectionExpression: z.string().optional().describe('Projection expression (optional)'),
  },
  async ({
    tableName,
    keyConditionExpression,
    expressionAttributeValues,
    indexName,
    filterExpression,
    limit,
    projectionExpression,
  }) => {
    console.error('# query-table tool has been called');
    try {
      const queryParams: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ProjectionExpression: projectionExpression,
      };

      if (indexName) {
        queryParams.IndexName = indexName;
      }

      if (filterExpression) {
        queryParams.FilterExpression = filterExpression;
      }

      if (limit) {
        queryParams.Limit = limit;
      }

      if (projectionExpression) {
        queryParams.ProjectionExpression = projectionExpression;
      }

      const items = await queryTable(queryParams);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(items, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('# Error executing query:', error);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error occurred: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'paginate-query-table',
  'Paginate query results',
  {
    tableName: z.string().describe('Table name'),
    keyConditionExpression: z.string().describe("Key condition expression (e.g: 'PK = :pk')"),
    expressionAttributeValues: z
      .record(z.any())
      .describe('Filter expression attribute values (JSON format)'),
    projectionExpression: z.string().optional().describe('Projection expression (optional)'),
  },
  async ({
    tableName,
    keyConditionExpression,
    expressionAttributeValues,
    projectionExpression,
  }) => {
    try {
      const queryParams: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      };

      if (projectionExpression) {
        queryParams.ProjectionExpression = projectionExpression;
      }

      const paginatedItems = await paginateQueryTable(queryParams);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(paginatedItems, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error occurred: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'get-item',
  'Get an item from a DynamoDB table based on a specific key',
  {
    tableName: z.string().describe('Table name'),
    key: z.record(z.any()).describe('Item key (JSON format)'),
  },
  async ({ tableName, key }) => {
    try {
      const item = await getItem(tableName, key);
      if (!item) {
        return {
          content: [
            {
              type: 'text',
              text: 'Could not find the corresponding item.',
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(item, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error occurred: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  'count-items',
  'Count items in a DynamoDB table',
  {
    tableName: z.string().describe('Table name'),
    filterExpression: z.string().optional().describe('Filter expression (optional)'),
    expressionAttributeValues: z
      .record(z.any())
      .optional()
      .describe('Filter expression attribute values (optional)'),
  },
  async ({ tableName, filterExpression, expressionAttributeValues }) => {
    try {
      const count = await countItems(tableName, filterExpression, expressionAttributeValues);
      return {
        content: [
          {
            type: 'text',
            text: `Table "${tableName}" has ${count} items.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error occurred: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.resource('dynamodb-tables-info', 'DynamoDB table information', async () => {
  try {
    const tables = await listTables();
    const tablesInfo = await Promise.all(
      tables.map(async (tableName: string) => {
        try {
          return await describeTable(tableName);
        } catch (error) {
          return { TableName: tableName, Error: 'Could not get table information.' };
        }
      })
    );

    return {
      contents: [
        {
          uri: 'dynamodb://tables-info',
          text: JSON.stringify(tablesInfo, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  } catch (error: any) {
    return {
      contents: [
        {
          uri: 'dynamodb://tables-info',
          text: JSON.stringify({ error: error.message }, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  }
});

server.resource('dynamodb-table-schema', 'DynamoDB table schema information', async (request) => {
  try {
    const pathParts = request.pathname?.split('/') || [];
    const tableName = pathParts[pathParts.length - 1];

    if (!tableName) {
      return {
        contents: [
          {
            uri: request.toString(),
            text: JSON.stringify({ error: 'Table name was not provided.' }, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    }

    const attributes = await getTableAttributes(tableName);

    return {
      contents: [
        {
          uri: request.toString(),
          text: JSON.stringify(attributes, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  } catch (error: any) {
    return {
      contents: [
        {
          uri: request.toString(),
          text: JSON.stringify({ error: error.message }, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  }
});

server.prompt(
  'dynamodb-query-help',
  'Prompt to help you write a DynamoDB query',
  {
    tableName: z.string().describe('Name of the table to query'),
    queryType: z.string().optional().describe('Query complexity level ("basic" or "advanced")'),
  },
  async ({ tableName, queryType = 'basic' }) => {
    let helpContent = '';

    try {
      const tableInfo = await describeTable(tableName);

      if (queryType === 'basic') {
        helpContent = `
# Basic query guide for table ${tableName}

## Table structure
${JSON.stringify(tableInfo?.KeySchema, null, 2)}

## Query example
\`\`\`json
{
  "TableName": "${tableName}",
  "KeyConditionExpression": "partitionKeyName = :partitionValue",
  "ExpressionAttributeValues": {
    ":partitionValue": "desired value"
  }
}
\`\`\`

## Basic operations
1. Scan: Use 'scan-table' tool to scan the entire table.
2. Single item retrieval: Use 'get-item' tool.
3. Table information retrieval: Use 'describe-table' tool.
4. Item count calculation: Use 'count-items' tool.
        `;
      } else {
        helpContent = `
# Advanced query guide for table ${tableName}

## Table structure
${JSON.stringify(tableInfo, null, 2)}

## Advanced query example
\`\`\`json
{
  "TableName": "${tableName}",
  "KeyConditionExpression": "partitionKeyName = :partitionValue AND sortKeyName BETWEEN :low AND :high",
  "FilterExpression": "attributeName = :attrValue",
  "ExpressionAttributeValues": {
    ":partitionValue": "desired value",
    ":low": "minimum value",
    ":high": "maximum value",
    ":attrValue": "filter value"
  }
}
\`\`\`

## Advanced expressions
1. BEGINS_WITH: "attributeName BEGINS_WITH :prefix"
2. CONTAINS: "attributeName CONTAINS :substring"
3. Comparison operators: =, <>, <, <=, >, >=
4. Logical operators: AND, OR, NOT

## Query using indexes
${
  tableInfo?.GlobalSecondaryIndexes && tableInfo.GlobalSecondaryIndexes.length > 0
    ? `This table has the following GSIs:\n${tableInfo.GlobalSecondaryIndexes.map(
        (idx: any) => `- ${idx.IndexName}`
      ).join('\n')}`
    : 'This table has no GSI.'
}
        `;
      }
    } catch (error: any) {
      helpContent = `
# DynamoDB query help

An error occurred while getting detailed information about table "${tableName}": ${error.message}

## General DynamoDB operations
1. Use 'list-tables' tool to get table list
2. Use 'describe-table' tool to view table details
3. Use 'scan-table' tool to scan
4. Use 'query-table' tool to query
5. Use 'paginate-query-table' tool to paginate query
6. Use 'get-item' tool to retrieve an item
7. Use 'count-items' tool to count items

First, check table information and try again.
      `;
    }

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: helpContent,
          },
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('# DynamoDB read-only MCP server is running...');
}

main().catch((error) => {
  console.error('# Server execution error:', error);
  process.exit(1);
});
