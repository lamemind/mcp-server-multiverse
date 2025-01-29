import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import {ServerConfig, WrapperConfig} from "./json-config.js";
import {convertJsonSchemaToZodShape} from "./zod-utils.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import path from "node:path";

async function openWrappedServer(serverConfig: ServerConfig) {
    const transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env
    });

    const client = new Client(
        {
            name: "wrapper-client",
            version: "1.0.0"
        },
        {
            capabilities: {
                prompts: {},
                resources: {},
                tools: {}
            }
        }
    );

    await client.connect(transport);
    return client;
}

/**
 * Get the tool name to expose from the main server
 * @param config
 * @param toolName
 */
function getToolName(config: WrapperConfig, toolName: string) {
    return `${config.functionsPrefix}_${toolName}`;
}

/**
 * Apply path resolution to the arguments
 * @param args
 * @param serverConfig
 */
function applyPathResolution(args: any, serverConfig: ServerConfig) {
    serverConfig.pathResolution?.applyTo.forEach((key) => {
        if (args[key]) {
            const root = (serverConfig.pathResolution as any).root;
            const fullPath = path.join(root, args[key]);
            console.error(`Rewriting ${key} path ${args[key]} to ${fullPath}`);
            args[key] = fullPath;
        }
    });
}

/**
 * Register tools from the wrapped server
 * @param mainMcpServer
 * @param mainConfig
 * @param wrappedServer
 * @param serverConfig
 */
async function registerTools(mainMcpServer: McpServer, mainConfig: WrapperConfig, wrappedServer: Client, serverConfig: ServerConfig) {

    const {tools} = await wrappedServer.listTools();
    tools.forEach((tool) => {
        const zodShape = convertJsonSchemaToZodShape(tool.inputSchema);
        const externalName = getToolName(mainConfig, tool.name);

        const callback = async (args: any) => {
            applyPathResolution(args, serverConfig);

            const res = await wrappedServer.callTool({
                name: tool.name,
                arguments: args
            });

            return res as { content: { type: "text", text: string }[] };
        };

        const description = `[Use this tool only in the "${mainConfig.functionsPrefix}" scope] ` + (tool.description || "");
        mainMcpServer.tool(externalName, description, zodShape, callback);
    });

}

async function registerWrappedServer(mainMcpServer: McpServer, mainConfig: WrapperConfig, serverConfig: ServerConfig) {
    console.error(`Registering wrapped server ${serverConfig.command} ${serverConfig.args.join(' ')}`);
    const wrappedServer = await openWrappedServer(serverConfig);

    await registerTools(mainMcpServer, mainConfig, wrappedServer, serverConfig);

    // TODO register resources
    // TODO register prompts
}

export {registerWrappedServer, getToolName};
