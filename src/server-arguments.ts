import {program} from "commander";

export async function parseCliArguments() {
    const res = {
        wrappedServer: '',
        prefix: ''
    };

    program
        .argument('<prefix>', 'Prefix')
        .argument('<wrapped-server>', 'Wrapped Server')
        .action((prefix, wrappedServer) => {
            res.prefix = prefix;
            res.wrappedServer = wrappedServer;
            console.error(wrappedServer);
        });

    // Aggiungiamo un handler per gli errori
    program.on('error', (err) => {
        console.error('Error:', err);
    });

    program.parse(process.argv);

    return res;
}
