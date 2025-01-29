import { z } from "zod";
import { openWrappedServer } from "./wrapped-servers.js";
import { convertJsonSchemaToZodShape } from "./zod-utils.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
async function startMainServer({ prefix, wrappedServerArgs }) {
    const thisServer = new McpServer({
        name: prefix,
        version: "1.0.0"
    });
    thisServer.tool(prefix + `_` + `echo`, "Just a simple echo tool, will be removed in the future", {
        input: z.string()
    }, async ({ input }) => ({
        content: [{
                type: "text",
                text: "you said: " + input
            }]
    }));
    async function registerWrappedServer(thisServer, prefix, wrappedServerArgs) {
        const wrappedServer = await openWrappedServer(wrappedServerArgs[0], wrappedServerArgs.slice(1));
        const { tools } = await wrappedServer.listTools();
        tools.forEach((tool) => {
            const zodShape = convertJsonSchemaToZodShape(tool.inputSchema);
            const prefixedToolName = prefix + `_` + tool.name;
            const callback = async (args) => {
                const res = await wrappedServer.callTool({
                    name: tool.name,
                    arguments: args
                });
                return res;
            };
            const description = `[Use this tool only in the "${prefix}" scope] ` + (tool.description || "");
            thisServer.tool(prefixedToolName, description, zodShape, callback);
        });
    }
    await registerWrappedServer(thisServer, prefix, wrappedServerArgs);
    const transport = new StdioServerTransport();
    await thisServer.connect(transport);
    console.error("Server started successfully");
}
