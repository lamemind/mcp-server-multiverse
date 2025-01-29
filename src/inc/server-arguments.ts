import {program} from "commander";

export async function parseCliArguments() {
    const cliArgs = {
        wrappedServer: '',
        prefix: '',
        watch: false
    };

    program
        .argument('<prefix>', 'Prefix')
        .argument('<wrapped-server>', 'Wrapped Server')
        .option('-w, --watch', 'Watch for changes and restart the server')
        .action((prefix, wrappedServer, options) => {
            cliArgs.prefix = prefix;
            cliArgs.wrappedServer = wrappedServer;
            cliArgs.watch = options.watch;
            console.error(`Cli Args ${JSON.stringify(cliArgs)}`);
        });

    // Aggiungiamo un handler per gli errori
    program.on('error', (err) => {
        console.error('Error:', err);
    });

    program.parse(process.argv);

    return cliArgs;
}

export async function parseCliArguments2() {
    const cliArgs = {
        setupFile: '',
    };

    program
        .argument('<setup-file>', 'Json setup file')
        .action((setupFile) => {
            cliArgs.setupFile = setupFile;
            console.error(`Cli Args ${JSON.stringify(cliArgs)}`);
        });

    program.on('error', (err) => {
        console.error('Error:', err);
    });

    program.parse(process.argv);
    return cliArgs;
}
