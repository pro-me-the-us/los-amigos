const { showLogs } = require("./commands/showLogs");

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--level"      && argv[i + 1]) args.level      = argv[++i];
        if (argv[i] === "--limit"      && argv[i + 1]) args.limit      = argv[++i];
        if (argv[i] === "--deployment" && argv[i + 1]) args.deployment = argv[++i];
    }
    return args;
}

async function main() {
    const [,, command, ...rest] = process.argv;
    const args = parseArgs(rest);

    switch (command) {
        case "showlogs":
            await showLogs(args);
            break;

        default:
            console.log(`
Argus CLI — available commands:
  showlogs                          Show all recent logs
  showlogs --level <level>          Filter by level (info|warn|error|debug)
  showlogs --limit <n>              Limit number of results
  showlogs --deployment <id>        Show logs for a specific deployment
            `);
    }
}

main().catch((err) => {
    console.error("CLI error:", err.message);
    process.exit(1);
});