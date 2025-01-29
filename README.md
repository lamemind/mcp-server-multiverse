# Multiverse MCP Server

A middleware server that enables multiple isolated instances of the same MCP servers to coexist independently with unique namespaces and configurations.

The Multiverse MCP Server creates isolated operational spaces where identical MCP servers can run simultaneously without conflicts. Each "universe" maintains its own configuration, filesystem access, and function naming, enabling developers to run multiple instances of the same server type while maintaining complete separation between different contexts or projects.

## Key Features

* Run multiple instances of the same MCP server type independently and simultaneously
  * multiple `mcp-server-mysql` to point to different databases
  * multiple `mcp-server-git` with different PAT
  * multiple `mcp-server-filesystem` with different root paths
* Automatic server restart on file changes (a blessing for development)
* Isolate filesystem access per server instance
* Path obfuscation and automatic resolution
* Automatic function name prefixing for conflict prevention
* Separate configuration management for each instance
* Common infrastructure sharing across instances
* Independent operational contexts per instance
* JSON-based configuration system
* Cross-instance resource isolation

## Examples

### Automatic server restart on file changes with `fileWatch`
Your `claude_desktop_config.json` file~~~~
~~~JSON
{
  "mcpServers": {
    "side-project": {
      "command": "node",
      "args": [ 
        "/mcp-server-multiverse/dist/index.js",
        "/local-setups/side-project.json"
      ]
    }
  }
}
~~~

Your `side-project.json` file
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

### 

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
    },
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
        "/full/path/to/side-project"
      ],
      "pathResolution": {
        "root": "/full/path/to/side-project",
        "applyTo": [
          "repo_path"
        ]
      }
    }
  ]
}
~~~
