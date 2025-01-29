import {program} from "commander";

export async function parseCliArguments() {
    const cliArgs = {
        configFile: '',
    };

    program
        .argument('<config-file>', 'Json config file')
        .action((setupFile) => {
            cliArgs.configFile = setupFile;
            console.error(`Cli Args ${JSON.stringify(cliArgs)}`);
        });

    program.on('error', (err) => {
        console.error('Error:', err);
    });

    program.parse(process.argv);
    return cliArgs;
}
