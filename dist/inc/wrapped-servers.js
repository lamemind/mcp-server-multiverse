import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { convertJsonSchemaToZodShape } from "./zod-utils.js";
import path from "node:path";
import chokidar from 'chokidar';
async function openWrappedServer(serverConfig) {
    console.error(`Opening wrapped server with command: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
    const transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env
    });
    const client = new Client({
        name: "wrapper-client",
        version: "1.0.0"
    }, {
        capabilities: {
            prompts: {},
            resources: {},
            tools: {}
        }
    });
    await client.connect(transport);
    return client;
}
/**
 * Get the tool name to expose from the main server
 * @param config
 * @param toolName
 */
function getToolName(config, toolName) {
    return `${config.functionsPrefix}_${toolName}`;
}
/**
 * Apply path resolution to the arguments
 * @param args
 * @param serverConfig
 */
function applyPathResolution(args, serverConfig) {
    serverConfig.pathResolution?.applyTo.forEach((key) => {
        if (args[key]) {
            const root = serverConfig.pathResolution.root;
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
async function registerTools(mainMcpServer, mainConfig, wrappedServer, serverConfig) {
    const { tools } = await wrappedServer.listTools();
    tools.forEach((tool) => {
        const zodShape = convertJsonSchemaToZodShape(tool.inputSchema);
        const externalName = getToolName(mainConfig, tool.name);
        const callback = async (args) => {
            applyPathResolution(args, serverConfig);
            const res = await wrappedServer.callTool({
                name: tool.name,
                arguments: args
            });
            return res;
        };
        const description = `[Use this tool only in the "${mainConfig.functionsPrefix}" scope] ` + (tool.description || "");
        mainMcpServer.tool(externalName, description, zodShape, callback);
    });
}
function instantiateFileWatcher(serverConfig, fakeServer) {
    console.error(`Setting up file watcher...
    enabled: ${serverConfig.fileWatch?.enabled}
    path: ${serverConfig.fileWatch?.path}`);
    if (serverConfig.fileWatch?.enabled) {
        const filepath = serverConfig.fileWatch.path;
        chokidar.watch(filepath).on('change', async (file, stats) => {
            console.error(`File watcher triggered for: ${file}`);
            fakeServer.instanceRebuild++;
            console.error(`File ${file} edited - Rebuild #${fakeServer.instanceRebuild}`);
            fakeServer.wrappedServerInstance.close();
            fakeServer.wrappedServerInstance = await openWrappedServer(serverConfig);
        });
    }
}
async function registerWrappedServer(mainMcpServer, mainConfig, serverConfig) {
    console.error(`Registering wrapped server ${serverConfig.command} ${serverConfig.args.join(' ')}`);
    /**
     * Fake server is used to allow server instance switch if needed by file watch or auto-restart
     */
    const fakeServer = {
        instanceRebuild: 0,
        wrappedServerInstance: await openWrappedServer(serverConfig),
        callTool(args) {
            return this.wrappedServerInstance.callTool(args);
        },
        listTools() {
            return this.wrappedServerInstance.listTools();
        }
    };
    await registerTools(mainMcpServer, mainConfig, fakeServer, serverConfig);
    // TODO register resources
    // TODO register prompts
    instantiateFileWatcher(serverConfig, fakeServer);
}
export { registerWrappedServer, getToolName };
