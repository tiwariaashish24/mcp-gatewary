import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  phoneOpenApp,
  phoneOpenAppSchema,
} from "./tools/phoneOpenApp.js";

const execFileAsync = promisify(execFile);



// ADB path
const ADB_PATH =
  "C:\\Users\\ujjaw\\Desktop\\platform-tools-latest-windows\\platform-tools\\adb.exe";

  const ADB_TARGET = "10.63.54.47:5555";

const server = new McpServer({
  name: "phone-control-mcp",
  version: "1.0.0",
});

// ============================================================
// 1. TEST MCP TOOL
// ============================================================

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

// ============================================================
// 2. WIFI / HTTP TOOL
// ============================================================

server.registerTool(
  "wifi_request",
  {
    description:
      "Send an HTTP request to a device available on the local Wi-Fi network",

    inputSchema: z.object({
      url: z.string().url(),

      method: z.enum(["GET", "POST"]).default("GET"),

      body: z.string().optional(),
    }),
  },

  async ({ url, method, body }) => {
    try {
      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
        },

        body: method === "POST" ? body : undefined,
      });

      const responseText = await response.text();

      return {
        content: [
          {
            type: "text",
            text: `HTTP ${response.status}\n${responseText}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Wi-Fi request failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],

        isError: true,
      };
    }
  }
);

// ============================================================
// 3. PHONE BATTERY TOOL
// ============================================================

server.registerTool(
  "phone_battery",
  {
    description:
      "Get the current battery information from the connected Android phone",

    inputSchema: z.object({}),
  },

  async () => {
    try {
      const { stdout } = await execFileAsync(
        ADB_PATH,
        ["-s", ADB_TARGET, "shell", "dumpsys", "battery"],
        {
          windowsHide: true,
        }
      );

      const levelMatch = stdout.match(/level:\s*(\d+)/);

      const batteryLevel = levelMatch
        ? `${levelMatch[1]}%`
        : "Unknown";

      return {
        content: [
          {
            type: "text",
            text: `Phone battery: ${batteryLevel}\n\n${stdout}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get phone battery: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],

        isError: true,
      };
    }
  }
);

server.registerTool(
  "phone_open_app",
  {
    description: "Open an application on the connected Android phone",
    inputSchema: phoneOpenAppSchema,
  },
  phoneOpenApp
);


// // ============================================================
// // 5. OPEN PHONE APP
// // ============================================================

// server.registerTool(
//   "phone_open_app",
//   {
//     description: "Open an application on the connected Android phone",

//     inputSchema: z.object({
//       packageName: z.string(),
//     }),
//   },

//   async ({ packageName }) => {
//     try {
//       const { stdout, stderr } = await execFileAsync(
//         ADB_PATH,
//         [
//           "-s",
//           ADB_TARGET,
//           "shell",
//           "monkey",
//           "-p",
//           packageName,
//           "1",
//         ],
//         {
//           windowsHide: true,
//         }
//       );

//       return {
//         content: [
//           {
//             type: "text",
//             text: `App launch command executed.\nPackage: ${packageName}\n${stdout || stderr}`,
//           },
//         ],
//       };
//     } catch (error) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Failed to open app: ${
//               error instanceof Error ? error.message : String(error)
//             }`,
//           },
//         ],
//         isError: true,
//       };
//     }
//   }
// );


// ============================================================
// START MCP SERVER
// ============================================================

serveStdio(() => server);

console.error("Phone Control MCP Server started");