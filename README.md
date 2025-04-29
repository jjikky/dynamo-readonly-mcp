# DynamoDB Read-Only MCP

[![npm version](https://badge.fury.io/js/dynamo-readonly-mcp.svg)](https://badge.fury.io/js/dynamo-readonly-mcp) [![smithery badge](https://smithery.ai/badge/@jjikky/dynamo-readonly-mcp)](https://smithery.ai/server/@jjikky/dynamo-readonly-mcp)

A server that utilizes the Model Context Protocol (MCP) to query AWS DynamoDB databases. This server allows LLMs like Claude to query DynamoDB data through natural language requests.

<a href="https://glama.ai/mcp/servers/@jjikky/dynamo-readonly-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@jjikky/dynamo-readonly-mcp/badge" alt="DynamoDB Read-Only MCP server" />
</a>

## Features

This MCP server provides the following features:

- **Table Management Tools**:
  - `list-tables`: View a list of all DynamoDB tables
  - `describe-table`: View detailed information about a specific table
- **Data Query Tools**:
  - `scan-table`: Scan all or part of a table's data
  - `query-table`: Search for data that matches specific conditions in a table
  - `paginate-query-table`: Retrieve data across multiple pages that matches specific conditions
  - `get-item`: Retrieve an item with a specific key
  - `count-items`: Calculate the number of items in a table
- **Resources**:
  - `dynamodb-tables-info`: A resource that provides metadata for all tables
  - `dynamodb-table-schema`: A resource that provides schema information for a specific table
- **Prompts**:
  - `dynamodb-query-help`: A help prompt for writing DynamoDB queries

## Installation and Execution

You can run it without installation using the `Run with NPX` method below.

### Installing via Smithery

To install DynamoDB Read-Only Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@jjikky/dynamo-readonly-mcp):

```bash
npx -y @smithery/cli install @jjikky/dynamo-readonly-mcp --client claude
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/jjikky/dynamo-readonly-mcp.git
   cd dynamo-readonly-mcp
   ```

2. Install the required packages:

   ```bash
   npm install
   ```

3. Create a `.env` file and set up your AWS credentials:

   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   ```

### Build and Run

```bash
npm run build
npm start
```

## Connect to Claude Desktop

To use this MCP server with Claude Desktop, you need to modify the Claude Desktop configuration file.

1. Open the Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the server configuration as follows:

   ```json
   {
     "mcpServers": {
       "dynamodb-readonly": {
         "command": "node",
         "args": ["/absolute-path/dynamo-readonly-mcp/dist/index.js"],
         "env": {
           "AWS_ACCESS_KEY_ID": "your_access_key",
           "AWS_SECRET_ACCESS_KEY": "your_secret_key",
           "AWS_REGION": "your_region"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop.

## Run with NPX

You can also run this server using `npx` without a global installation:

```json
{
  "mcpServers": {
    "dynamodb-readonly": {
      "command": "npx",
      "args": ["-y", "dynamo-readonly-mcp"],
      "env": {
        "AWS_ACCESS_KEY_ID": "your_access_key",
        "AWS_SECRET_ACCESS_KEY": "your_secret_key",
        "AWS_REGION": "your_region"
      }
    }
  }
}
```

## Usage Examples

You can ask Claude questions like:

1. "Can you tell me what tables are in DynamoDB?"
2. "Explain the structure of the Users table"
3. "Find the number of users in the 'Users' table where groupId is '0lxp4paxk7'"

---

## Architecture

This MCP server consists of the following layered structure:

1. **Client Interface (Claude Desktop)** - Interaction between user and LLM
2. **MCP Protocol Layer** - Provides standardized message exchange method
3. **DynamoDB Server** - Implements functions that interact with DynamoDB
4. **AWS SDK** - Communicates with AWS DynamoDB service

## Key Operation Mechanisms

### 1. Initialization and Connection

When the server starts, the following process occurs:

```tsx
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DynamoDB read-only MCP server is running...');
}
```

- `StdioServerTransport` sets up a communication channel through standard input/output.
- `server.connect(transport)` connects to Claude Desktop through the MCP protocol.
- During connection, the server sends information about supported tools, resources, and prompts to the client.

### 2. Tool Request Processing

When a user asks Claude something like "Show me the list of DynamoDB tables":

1. Claude analyzes this request and calls the `list-tables` tool.
2. This request is sent to the server through the MCP protocol.
3. The server executes the corresponding tool handler:

```tsx
server.tool('list-tables', 'Gets a list of all DynamoDB tables', {}, async () => {
  try {
    const tables = await listTables();
    return {
      content: [{ type: 'text', text: JSON.stringify(tables, null, 2) }],
    };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: `Error: ${error.message}` }] };
  }
});
```

1. The result is returned to Claude through the MCP protocol.
2. Claude processes this result into natural language and presents it to the user.

### 3. Specific Parameter Handling

When a user requests "Tell me the structure of the Users table":

1. Claude determines that this request should use the `describe-table` tool.
2. Claude configures the parameter as `{ tableName: "Users" }`.
3. This information is sent to the MCP server:

```tsx
server.tool(
  'describe-table',
  'Gets detailed information about a DynamoDB table',
  {
    tableName: z.string().describe('Name of the table to get detailed information for'),
  },
  async ({ tableName }) => {
    // Query table information using the tableName parameter
    const tableInfo = await describeTable(tableName);
    // Return results
  }
);
```

Here, `z.string()` uses the Zod library to validate parameters.

### 4. Resource Handling

Resources are another MCP feature that provides read-only data:

```tsx
server.resource('dynamodb-tables-info', 'DynamoDB table information', async () => {
  // Create and return resource data
  const tables = await listTables();
  const tablesInfo = await Promise.all(/* Query table information */);

  return {
    contents: [
      {
        uri: 'dynamodb://tables-info',
        text: JSON.stringify(tablesInfo, null, 2),
        mimeType: 'application/json',
      },
    ],
  };
});
```

Claude accesses resources and uses them as context information.

### 5. Prompt Handling

The MCP server can provide prompt templates for specific tasks:

```tsx
server.prompt(
  'dynamodb-query-help',
  'A prompt that helps write DynamoDB queries',
  {
    tableName: z.string().describe('Table name to query'),
    queryType: z.enum(['basic', 'advanced']).default('basic'),
  },
  async ({ tableName, queryType }) => {
    // Generate prompt content
    return {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: helpContent },
        },
      ],
    };
  }
);
```

This prompt is used when a user requests "Show me how to write queries for the Users table."

## Data Flow Summary

1. User makes a request to Claude in natural language
2. Claude analyzes the request and selects the appropriate MCP tool/resource/prompt
3. MCP client sends the request to the server in a standardized format
4. Server processes the request and calls the AWS DynamoDB API
5. DynamoDB returns results
6. Server converts results to MCP format and sends them to the client
7. Claude processes the results into natural language and presents them to the user

## License

This project is licensed under the MIT License - see the LICENSE file for details.