import { ListTablesCommand, DescribeTableCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { QueryCommandInput, ScanCommand, QueryCommand, paginateQuery } from '@aws-sdk/lib-dynamodb';
import { getDynamodb } from './dynamo-client';

const dynamodb = getDynamodb();

export async function listTables() {
  console.error('# Starting listTables function');
  try {
    const command = new ListTablesCommand({});
    console.error('# ListTables command created successfully');
    const response = await dynamodb.send(command);
    console.error('# ListTables response received:', response);
    return response.TableNames || [];
  } catch (error) {
    console.error('# Error in listTables function:', error);
    throw error;
  }
}

export async function describeTable(tableName: string) {
  console.error('# Starting describeTable function:', tableName);
  try {
    const command = new DescribeTableCommand({
      TableName: tableName,
    });
    console.error('# DescribeTable command created successfully');
    const response = await dynamodb.send(command);
    console.error('# DescribeTable response received:', response);
    return response.Table;
  } catch (error) {
    console.error('# Error in describeTable function:', error);
    throw error;
  }
}

export async function scanTable(
  tableName: string,
  limit: number = 100,
  filterExpression?: string,
  expressionAttributeValues?: Record<string, any>,
  projectionExpression?: string
) {
  console.error('# Starting scanTable function:', {
    tableName,
    limit,
    filterExpression,
    expressionAttributeValues,
    projectionExpression,
  });

  try {
    const params: any = {
      TableName: tableName,
      Limit: limit,
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }

    if (expressionAttributeValues) {
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (projectionExpression) {
      params.ProjectionExpression = projectionExpression;
    }

    console.error('# Scan parameters:', params);
    const command = new ScanCommand(params);
    console.error('# Scan command created successfully');

    const response = await dynamodb.send(command);
    console.error('# Scan response received:', response);
    return response?.Items || [];
  } catch (error) {
    console.error('# Error in scanTable function:', error);
    throw error;
  }
}

export async function queryTable(params: QueryCommandInput) {
  console.error('# Starting queryTable function');
  console.error('# Query parameters:', params);

  try {
    const command = new QueryCommand(params);
    console.error('# Query command created successfully');

    const response = await dynamodb.send(command);
    console.error('# Query response received:', response);

    if (!response) {
      console.error('# Response is undefined');
      return [];
    }

    if (!response.Items) {
      console.error('# Response has no Items');
      return [];
    }

    console.error(`# Found ${response.Items.length} items`);
    return response.Items;
  } catch (error) {
    console.error('# Error in queryTable function:', error);
    throw error;
  }
}

export async function paginateQueryTable(params: QueryCommandInput) {
  console.error('# Starting paginateQueryTable function');
  console.error('# Paginate parameters:', params);

  let items: any[] = [];
  try {
    const paginator = paginateQuery({ client: dynamodb }, params);
    console.error('# Paginator created successfully');

    let pageCount = 0;
    for await (const page of paginator) {
      pageCount++;
      console.error(`# Processing page ${pageCount}`);

      if (!page) {
        console.error(`# Page ${pageCount} is undefined`);
        continue;
      }

      if (!page.Items) {
        console.error(`# Page ${pageCount} has no Items`);
        continue;
      }

      console.error(`# Found ${page.Items.length} items in page ${pageCount}`);
      items.push(...page.Items);
    }

    console.error(`# Found a total of ${items.length} items`);
    return items;
  } catch (error) {
    console.error('# Error in paginateQueryTable function:', error);
    throw error;
  }
}

export async function getItem(tableName: string, key: Record<string, any>) {
  console.error('# Starting getItem function:', { tableName, key });
  try {
    const command = new GetItemCommand({
      TableName: tableName,
      Key: key,
    });
    console.error('# GetItem command created successfully');
    const response = await dynamodb.send(command);
    console.error('# GetItem response received:', response);
    return response.Item;
  } catch (error) {
    console.error('# Error in getItem function:', error);
    throw error;
  }
}

export async function getTableAttributes(tableName: string) {
  console.error('# Starting getTableAttributes function:', tableName);
  try {
    const table = await describeTable(tableName);
    if (!table) {
      console.error('# Table information not found');
      return null;
    }

    const indices = [
      ...(table.GlobalSecondaryIndexes || []),
      ...(table.LocalSecondaryIndexes || []),
    ].map((index) => ({
      name: index.IndexName,
      keySchema: index.KeySchema,
    }));

    const result = {
      keySchema: table.KeySchema,
      attributeDefinitions: table.AttributeDefinitions,
      indices,
    };
    console.error('# Table attributes result:', result);
    return result;
  } catch (error) {
    console.error('# Error in getTableAttributes function:', error);
    return null;
  }
}

export async function countItems(
  tableName: string,
  filterExpression?: string,
  expressionAttributeValues?: Record<string, any>
) {
  console.error('# Starting countItems function:', {
    tableName,
    filterExpression,
    expressionAttributeValues,
  });

  try {
    const params: any = {
      TableName: tableName,
      Select: 'COUNT',
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }

    if (expressionAttributeValues) {
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    console.error('# Count parameters:', params);
    const command = new ScanCommand(params);
    console.error('# Count command created successfully');

    const response = await dynamodb.send(command);
    console.error('# Count response received:', response);
    return response.Count || 0;
  } catch (error) {
    console.error('# Error in countItems function:', error);
    throw error;
  }
}
