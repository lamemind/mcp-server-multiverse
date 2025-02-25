import { registerWrappedServer } from "./wrapped-servers.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
async function startMainServer(config) {
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
export { startMainServer };
