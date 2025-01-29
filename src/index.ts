import {parseCliArguments2} from "./inc/server-arguments.js";
import {readConfigFile} from "./inc/json-config.js";


(async function () {
    const cliArguments = await parseCliArguments2();

    const wrapperConfig = readConfigFile(cliArguments.configFile);
    console.log(wrapperConfig);
})();



