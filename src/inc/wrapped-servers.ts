import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ServerConfig, WrapperConfig } from "./json-config.js";
import { convertJsonSchemaToZodShape } from "./zod-utils.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import path from "node:path";
import chokidar from 'chokidar';
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

async function openWrappedServer(serverConfig: ServerConfig) {
    console.error(`Opening wrapped server with command: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
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
async function registerTools(mainMcpServer: McpServer, mainConfig: WrapperConfig,
    wrappedServer: any, serverConfig: ServerConfig) {

    const { tools } = await wrappedServer.listTools();
    tools.forEach((tool: { inputSchema: any; name: string; description: any; }) => {
        // Skip functions that are in the hideFunctions list
        if (serverConfig.hideFunctions && serverConfig.hideFunctions.includes(tool.name)) {
            console.error(`Skipping hidden function: ${tool.name}`);
            return;
        }

        const zodShape = convertJsonSchemaToZodShape(tool.inputSchema);
        const externalName = getToolName(mainConfig, tool.name);

        const callback = async (args: any): Promise<CallToolResult> => {
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

function instantiateFileWatcher(serverConfig: ServerConfig, fakeServer: any) {
    console.error(`Setting up file watcher...
    enabled: ${serverConfig.fileWatch?.enabled}
    path: ${serverConfig.fileWatch?.path}`);
    if (serverConfig.fileWatch?.enabled) {
        const filepath = serverConfig.fileWatch.path as string;

        chokidar.watch(filepath).on('change', async (file, stats) => {
            console.error(`File watcher triggered for: ${file}`);
            fakeServer.instanceRebuild++;
            console.error(`File ${file} edited - Rebuild #${fakeServer.instanceRebuild}`);

            fakeServer.wrappedServerInstance.close();
            fakeServer.wrappedServerInstance = await openWrappedServer(serverConfig);
        });
    }
}

async function registerWrappedServer(mainMcpServer: McpServer, mainConfig: WrapperConfig, serverConfig: ServerConfig) {
    // Skip registration if the server is disabled
    if (serverConfig.enabled === false) {
        console.error(`Skipping disabled server: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
        return;
    }

    console.error(`Registering wrapped server ${serverConfig.command} ${serverConfig.args.join(' ')}`);

    /**
     * Fake server is used to allow server instance switch if needed by file watch or auto-restart
     */
    const fakeServer = {
        instanceRebuild: 0,
        wrappedServerInstance: await openWrappedServer(serverConfig),
        callTool(args: { name: string, arguments: any }) {
            return this.wrappedServerInstance.callTool(args);
        },
        listTools() {
            return this.wrappedServerInstance.listTools();
        }
    }

    await registerTools(mainMcpServer, mainConfig, fakeServer, serverConfig);

    // TODO register resources
    // TODO register prompts

    instantiateFileWatcher(serverConfig, fakeServer);
}

export { registerWrappedServer, getToolName };
