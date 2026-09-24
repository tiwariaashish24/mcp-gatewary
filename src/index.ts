import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const server = new McpServer({
  name: "phone-control-mcp",
  version: "1.0.0",
});

server.registerTool(
  "hello_phone",
  {
    description: "Test communication with the phone control MCP server",
    inputSchema: z.object({
      message: z.string(),
    }),
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `Phone MCP received: ${message}`,
        },
      ],
    };
  }
);

serveStdio(() => server);

console.error("Phone Control MCP Server started");