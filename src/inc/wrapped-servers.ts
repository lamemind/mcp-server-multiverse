import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";

async function openWrappedServer(wrappedCommand: string, wrappedArgs: string[]) {
    const transport = new StdioClientTransport({
        command: wrappedCommand,
        args: wrappedArgs
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

    // const prompts = await client.listPrompts();
    // const resources = await client.listResources();
    // const tools = await client.listTools();
}

export {openWrappedServer};
