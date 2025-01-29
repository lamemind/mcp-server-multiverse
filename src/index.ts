import {parseCliArguments} from "./inc/server-arguments.js";
import {readConfigFile} from "./inc/json-config.js";
import {startMainServer} from "./inc/main-mcp-server.js";


(async function () {
    const cliArguments = await parseCliArguments();

    const wrapperConfig = readConfigFile(cliArguments.configFile);
    console.error(wrapperConfig);

    await startMainServer(wrapperConfig);

})();



