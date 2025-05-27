import { registerWrappedServer } from "./wrapped-servers.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WrapperConfig } from "./json-config.js";

async function startMainServer(config: WrapperConfig) {
    console.error(`Starting main server with name: ${config.serverName}`);
    console.error(`Initializing main MCP server...`);
    const mainMcpServer = new McpServer({
        name: config.serverName,
        version: "1.0.0"
    }, {
        capabilities: {
            prompts: {},
            resources: {}
        }
    });

    mainMcpServer.prompt(
        `${config.serverName}_placeholder`, {},
        ({ }) => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: `this is a placeholder prompt to avoid error logs when no prompts are registered`
                }
            }]
        })
    );

    mainMcpServer.resource(
        `${config.serverName}_placeholder`,
        `placeholder://${config.serverName}`,
        async (uri) => ({
            contents: [{
                uri: uri.href,
                text: `This is a placeholder resource to avoid error logs when no resources are registered`
            }]
        })
    );

    for (const wrappedConfig of config.servers) {
        await registerWrappedServer(mainMcpServer, config, wrappedConfig);
    }

    const transport = new StdioServerTransport();
    await mainMcpServer.connect(transport);

    console.error("Server started successfully");
}

export { startMainServer };
