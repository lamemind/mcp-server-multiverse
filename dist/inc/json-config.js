import { z } from 'zod';
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
    enabled: z.boolean().default(true).describe("Whether this server configuration is enabled"),
    command: z.string().describe("Command to run, the same as in 'claude_desktop_config.json'"),
    args: z.array(z.string()).describe("Arguments to pass to the command, the same as in 'claude_desktop_config.json'"),
    env: z.record(z.string()).optional().describe("Environment variables to set, the same as in 'claude_desktop_config.json'"),
    pathResolution: PathResolutionSchema.optional().describe("Relative path resolution configuration"),
    fileWatch: FileWatchSchema.optional().describe("File watch configuration"),
    hideFunctions: z.array(z.string()).optional().describe("List of function names to hide from this server")
});
// Schema principale della configurazione
const ConfigSchema = z.object({
    serverName: z.string().describe("Name of the server to expose to the client"),
    functionsPrefix: z.string().describe("Aggregation prefix to use for the functions exposed to the client"),
    servers: z.array(ServerSchema).describe("List of MCP servers to wrap")
});
// Funzione di validazione
function validateConfig(config) {
    console.error(`Validating configuration...`);
    return ConfigSchema.parse(config);
}
function readConfigFile(filePath) {
    console.error(`Reading config file from: ${filePath}`);
    const jsonContent = fs.readFileSync(filePath, 'utf8');
    const jsonRaw = JSON.parse(jsonContent);
    try {
        return validateConfig(jsonRaw);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation errors:', error.errors);
        }
        throw error;
    }
}
export { readConfigFile };
