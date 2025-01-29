import {z} from 'zod';
import * as fs from "node:fs";

// Schema per la risoluzione dei path
const PathResolutionSchema = z.object({
    root: z.string().describe("Root path for the resolution"),
    applyTo: z.array(z.string()).describe("List of keys to apply the resolution to")
});

// Schema per il file watch
const FileWatchSchema = z.object({
    enabled: z.boolean().describe("Whether the file watch is enabled"),
    path: z.string().optional().describe("Path to watch for changes")
});

// Schema per un singolo server
const ServerSchema = z.object({
    command: z.string().describe("Command to run, the same as in 'claude_desktop_config.json'"),
    args: z.array(z.string()).describe("Arguments to pass to the command, the same as in 'claude_desktop_config.json'"),
    env: z.record(z.string()).optional().describe("Environment variables to set, the same as in 'claude_desktop_config.json'"),
    pathResolution: PathResolutionSchema.optional().describe("Relative path resolution configuration"),
    fileWatch: FileWatchSchema.optional().describe("File watch configuration")
});

// Schema principale della configurazione
const ConfigSchema = z.object({
    serverName: z.string().describe("Name of the server to expose to the client"),
    functionsPrefix: z.string().describe("Aggregation prefix to use for the functions exposed to the client"),
    servers: z.array(ServerSchema).describe("List of MCP servers to wrap")
});

// Type inference automatica
type WrapperConfig = z.infer<typeof ConfigSchema>;
type ServerConfig = z.infer<typeof ServerSchema>;
type PathResolution = z.infer<typeof PathResolutionSchema>;

// Funzione di validazione
function validateConfig(config: unknown): WrapperConfig {
    console.error(`Validating configuration...`);
    return ConfigSchema.parse(config);
}

function readConfigFile(filePath: string): WrapperConfig {
    console.error(`Reading config file from: ${filePath}`);
    const jsonContent = fs.readFileSync(filePath, 'utf8');
    const jsonRaw = JSON.parse(jsonContent);

    try {
        return validateConfig(jsonRaw);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation errors:', error.errors);
        }
        throw error;
    }
}

export { WrapperConfig, ServerConfig, PathResolution, readConfigFile };
