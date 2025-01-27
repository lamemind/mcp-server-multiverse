import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import {parseCliArguments} from "./server-arguments.js";
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {z} from "zod";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";

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

function convertPropertyToZod(propSchema: any, isRequired: boolean = true): z.ZodType {
    let schema: z.ZodType;

    switch (propSchema.type) {
        case 'string':
            let stringSchema = z.string();
            if (propSchema.pattern) stringSchema = stringSchema.regex(new RegExp(propSchema.pattern));
            if (propSchema.minLength) stringSchema = stringSchema.min(propSchema.minLength);
            if (propSchema.maxLength) stringSchema = stringSchema.max(propSchema.maxLength);
            schema = stringSchema;
            break;

        case 'number':
        case 'integer':
            let numberSchema = propSchema.type === 'integer' ? z.number().int() : z.number();
            if (propSchema.minimum !== undefined) numberSchema = numberSchema.min(propSchema.minimum);
            if (propSchema.maximum !== undefined) numberSchema = numberSchema.max(propSchema.maximum);
            schema = numberSchema;
            break;

        case 'boolean':
            schema = z.boolean();
            break;

        case 'array':
            const itemSchema = propSchema.items ? convertPropertyToZod(propSchema.items) : z.any();
            schema = z.array(itemSchema);
            break;

        case 'object':
            schema = z.object(jsonPropsToZodShape(propSchema.properties, propSchema.required || []));
            break;

        default:
            schema = z.any();
    }

    return isRequired ? schema : schema.optional();
}

function jsonPropsToZodShape(properties: Record<string, any>, required: string[] = []): z.ZodRawShape {
    const shape: z.ZodRawShape = {};

    for (const [key, propSchema] of Object.entries(properties)) {
        const isRequired = required.includes(key);
        shape[key] = convertPropertyToZod(propSchema, isRequired);
    }

    return shape;
}

// Funzione wrapper per gestire l'intero schema
function convertJsonSchemaToZodShape(schema: any): z.ZodRawShape {
    if (schema.type !== 'object' || !schema.properties) {
        throw new Error('Schema must be an object type with properties');
    }

    return jsonPropsToZodShape(schema.properties, schema.required || []);
}

(async function () {
    const cliArguments = await parseCliArguments();
    const wrappedServerArgs = cliArguments.wrappedServer.split(' ');

    const wrappedServer = await openWrappedServer(wrappedServerArgs[0], wrappedServerArgs.slice(1));

    const thisServer = new McpServer({
        name: cliArguments.prefix,
        version: "1.0.0"
    });

    thisServer.tool(
        cliArguments.prefix + `_` + `echo`,
        "Just a simple echo tool, will be removed in the future",
        {
            input: z.string()
        },
        async ({input}) => ({
            content: [{
                type: "text",
                text: "you said: " + input
            }]
        })
    );

    const {tools} = await wrappedServer.listTools();
    tools.forEach((tool) => {
        const zodShape = convertJsonSchemaToZodShape(tool.inputSchema);

        const prefixedToolName = cliArguments.prefix + `_` + tool.name;
        const callback = async (args: any) => {
            const res = await wrappedServer.callTool({
                name: tool.name,
                arguments: args
            });
            return res as { content: { type: "text", text: string }[] };
        };
        const description = `[Use this tool only in the "${cliArguments.prefix}" scope] ` + (tool.description || "");
        thisServer.tool(prefixedToolName, description, zodShape, callback);
    });

    let counter = 1;
    setInterval(async () => {
        const prefixedToolName = cliArguments.prefix + `_` + `new-tool-${counter++}`;
        const schema = {};
        thisServer.tool(prefixedToolName,
            `New tool ${counter}`,
            schema,
            async ({}) => {
                const res = {
                    content: [{
                        type: "text",
                        text: "i am " + counter
                    }]
                };
                return res as { content: { type: "text", text: string }[] };
            }
        );
    }, 5000);

    const transport = new StdioServerTransport();
    await thisServer.connect(transport);

    console.error("Server started successfully");

})();



