import {z} from "zod";
import {getToolName, registerWrappedServer} from "./wrapped-servers.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {WrapperConfig} from "./json-config.js";

async function startMainServer(config: WrapperConfig) {
    console.error(`Starting main server with name: ${config.serverName}`);
    console.error(`Initializing main MCP server...`);
    const mainMcpServer = new McpServer({
        name: config.serverName,
        version: "1.0.0"
    });

    for (const wrappedConfig of config.servers) {
        await registerWrappedServer(mainMcpServer, config, wrappedConfig);
    }

    const transport = new StdioServerTransport();
    await mainMcpServer.connect(transport);

    console.error("Server started successfully");
}

async function startMainServerOld({prefix, wrappedServerArgs}: { prefix: string, wrappedServerArgs: string[] }) {
    const mainMcpServer = new McpServer({
        name: prefix,
        version: "1.0.0"
    });

    const transport = new StdioServerTransport();
    await mainMcpServer.connect(transport);

    console.error("Server started successfully");
}

export {startMainServer};
