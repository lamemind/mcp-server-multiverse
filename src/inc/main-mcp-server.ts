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

    // async function registerWrappedServer(thisServer: any, prefix: string, wrappedServerArgs: string[]) {
    //     const wrappedServer = await openWrappedServer(wrappedServerArgs[0], wrappedServerArgs.slice(1));
    //     const {tools} = await wrappedServer.listTools();
    //     tools.forEach((tool) => {
    //         const zodShape = convertJsonSchemaToZodShape(tool.inputSchema);
    //
    //         const prefixedToolName = prefix + `_` + tool.name;
    //         const callback = async (args: any) => {
    //             const res = await wrappedServer.callTool({
    //                 name: tool.name,
    //                 arguments: args
    //             });
    //             return res as { content: { type: "text", text: string }[] };
    //         };
    //         const description = `[Use this tool only in the "${prefix}" scope] ` + (tool.description || "");
    //         thisServer.tool(prefixedToolName, description, zodShape, callback);
    //     });
    // }
    // await registerWrappedServer(mainMcpServer, prefix, wrappedServerArgs);

    const transport = new StdioServerTransport();
    await mainMcpServer.connect(transport);

    console.error("Server started successfully");
}

export {startMainServer};
