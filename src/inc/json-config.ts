import {z} from 'zod';
import * as fs from "node:fs";

// Schema per la risoluzione dei path
const PathResolutionSchema = z.object({
    root: z.string(),
    applyTo: z.array(z.string())
});

// Schema per il file watch
const FileWatchSchema = z.object({
    enabled: z.boolean(),
    path: z.string().optional()
});

// Schema per un singolo server
const ServerSchema = z.object({
    command: z.string(),
    args: z.array(z.string()),
    pathResolution: PathResolutionSchema.optional(),
    env: z.record(z.string()).optional(),
    fileWatch: FileWatchSchema.optional()
});

// Schema principale della configurazione
const ConfigSchema = z.object({
    serverName: z.string(),
    functionsPrefix: z.string(),
    servers: z.array(ServerSchema)
});

// Type inference automatica
type WrapperConfig = z.infer<typeof ConfigSchema>;
type ServerConfig = z.infer<typeof ServerSchema>;
type PathResolution = z.infer<typeof PathResolutionSchema>;

// Funzione di validazione
function validateConfig(config: unknown): WrapperConfig {
    return ConfigSchema.parse(config);
}

function readConfigFile(filePath: string): WrapperConfig {
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
