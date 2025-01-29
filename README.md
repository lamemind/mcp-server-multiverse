# Multiverse MCP Server

A middleware server that enables multiple isolated instances of the same MCP servers to coexist independently with unique namespaces and configurations.

The Multiverse MCP Server creates isolated operational spaces where identical MCP servers can run simultaneously without conflicts. Each "universe" maintains its own configuration, filesystem access, and function naming, enabling developers to run multiple instances of the same server type while maintaining complete separation between different contexts or projects.

## Features

* Run multiple instances of the same MCP server type independently and simultaneously
  * multiple `mcp-server-mysql` to point to different databases
  * multiple `mcp-server-git` with different PAT (Personal Access Token)
  * multiple `mcp-server-filesystem` with different root paths
* Automatic server restart on file changes (a blessing for development)
* JSON-based configuration system
* Isolate filesystem access per server instance
* Absolute path obfuscation and automatic resolution
* Tool name prefixing for conflict prevention
* Separate configuration management for each instance
* Independent operational contexts per instance
* Cross-instance resource isolation

## Installation

First, ensure you've downloaded and installed the [Claude Desktop app](https://claude.ai/download) and you have npm installed.

Next, add this entry to your `claude_desktop_config.json` 
- on Mac, found at `~/Library/Application\ Support/Claude/claude_desktop_config.json`
- on Windows, found at `C:\Users\<username>\AppData\Roaming\Claude\claude_desktop_config.json`

Now add how many multiverse servers you want to run. For example, if you want to run two instances of `mcp-server-multiverse`, one for your job and one for your side project, you can add the following configuration:

```json
{
  "mcpServers": {
    "job-multiverse": {
      "command": "npx",
      "args": [
        "-y",
        "@lamemind/mcp-server-multiverse@latest",
        "/path/to/your/job-multiverse.json"
      ]
    },
    "side-project-multiverse": {
      "command": "npx",
      "args": [
        "-y",
        "@lamemind/mcp-server-multiverse@latest",
        "/path/to/your/side-project-multiverse.json"
      ]
    }
  }
}
```

This config allows Claude Desktop to automatically start the `mcp-server-multiverse` instances when you start the app.

![demo.png](assets/demo.png)

## Configuration Examples

### Create two isolated instances of `mcp-server-mysql` with different databases

Your `job-multiverse.json` file
~~~JSON
{
  "serverName": "JobMultiverse",
  "functionsPrefix": "job",
  "servers": [
    {
      "command": "npx",
      "args": [
        "-y",
        "@benborla29/mcp-server-mysql"
      ],
      "env": {
        "MYSQL_HOST": "127.0.0.1",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASS": "",
        "MYSQL_DB": "my-job-db"
      }
    }
  ]
}
~~~

Your `side-project-multiverse.json` file
~~~JSON
{
  "serverName": "SideProjectMultiverse",
  "functionsPrefix": "side-project",
  "servers": [
    {
      "command": "npx",
      "args": [
        "-y",
        "@benborla29/mcp-server-mysql"
      ],
      "env": {
        "MYSQL_HOST": "127.0.0.1",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASS": "",
        "MYSQL_DB": "side-project-db"
      }
    }
  ]
}
~~~


### Create an isolated instance of `mcp-server-filesystem`

- The `mcp-server-filesystem`'s functions will be exposed with `side-project` prefix, e.g. `side-project_read_file`, `side-project_write_file`.
- The root path can be hidden from the client (e.g. Claude Desktop) by using the `pathResolution` configuration.

Note that `pathResolution` is optional and is only needed if you want to hide the root path from the client.

Your `multiverse.json` file
~~~JSON
{
  "serverName": "MySideProject",
  "functionsPrefix": "side-project",
  "servers": [
    {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem@latest",
        "/full/path/to/side-project"
      ],
      "pathResolution": {
        "root": "/full/path/to/side-project",
        "applyTo": [
          "path",
          "paths"
        ]
      }
    }
  ]
}
~~~


### Automatic server restart on file changes with `fileWatch`

Your `multiverse.json` file
~~~JSON
{
  "serverName": "MySideProject",
  "functionsPrefix": "side-project",
  "servers": [
    {
      "command": "node",
      "args": [
        "/my-own/mcp-server/i-m-working-on/build/index.js"
      ],
      "fileWatch": {
        "enabled": true,
        "path": "/my-own/mcp-server/i-m-working-on/build/"
      }
    }
  ]
}
~~~

### Full example of a `multiverse.json` file

This example demonstrates how to create a multiverse server with multiple instances of different server types.

Note that `pathResolution` is optional and is only needed if you want to hide the root path from the client.

~~~JSON
{
  "serverName": "HugeProjectWithALotOfResources",
  "functionsPrefix": "huge-project",
  "servers": [
    {
      "command": "node",
      "args": [
        "/my-own/mcp-server/i-m-working-on/build/index.js"
      ],
      "fileWatch": {
        "enabled": true,
        "path": "/my-own/mcp-server/i-m-working-on/build/"
      }
    },
    {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem@latest",
        "/full/path/to/huge-project"
      ],
      "pathResolution": {
        "root": "/full/path/to/huge-project",
        "applyTo": [
          "path",
          "paths"
        ]
      }
    },
    {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github@latest"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-personal-access-token>"
      }
    },
    {
      "command": "uvx",
      "args": [
        "mcp-server-git",
        "--repository",
        "/full/path/to/huge-project"
      ],
      "pathResolution": {
        "root": "/full/path/to/huge-project",
        "applyTo": [
          "repo_path"
        ]
      }
    }
  ]
}
~~~

## To Do

- [ ] Add support for `Prompts`
- [ ] Add support for `Resources`
- [ ] Add a GUI for managing multiverse servers

## Verified Platforms

- [x] Windows
- [ ] macOS
- [ ] Linux

## License

MIT

