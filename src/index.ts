#!/usr/bin/env node

import {parseCliArguments} from "./inc/server-arguments.js";
import {readConfigFile} from "./inc/json-config.js";
import {startMainServer} from "./inc/main-mcp-server.js";


(async function () {
    console.error(`Starting MCP Server Wrapper...`);
    const cliArguments = await parseCliArguments();

    const wrapperConfig = readConfigFile(cliArguments.configFile);
    console.error(wrapperConfig);

    await startMainServer(wrapperConfig);

})();



