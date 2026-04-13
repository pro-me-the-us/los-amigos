const axios = require("axios");

const SERVER_URL = process.env.ARGUS_SERVER_URL || "http://localhost:5000";

const COLOURS = {
    info:  "\x1b[36m",   // cyan
    warn:  "\x1b[33m",   // yellow
    error: "\x1b[31m",   // red
    debug: "\x1b[90m",   // grey
};
const RESET = "\x1b[0m";

function coloured(level, text) {
    return `${COLOURS[level] || ""}${text}${RESET}`;
}

function printLog(log) {
    const ts     = new Date(log.timestamp).toLocaleString();
    const level  = (log.level || "info").toUpperCase().padEnd(5);
    const source = log.source     ? `[${log.source}] `           : "";
    const dep    = log.deploymentId ? `{dep:${log.deploymentId}} ` : "";
    console.log(coloured(log.level, `${ts}  ${level}  ${source}${dep}${log.message}`));
}

async function showLogs(args = {}) {
    const params = {};
    if (args.level)      params.level        = args.level;
    if (args.limit)      params.limit        = args.limit;
    if (args.deployment) params.deploymentId = args.deployment;

    console.log(`\n📋  Fetching logs from ${SERVER_URL}/logs ...\n`);

    let response;
    try {
        response = await axios.get(`${SERVER_URL}/logs`, { params, timeout: 8000 });
    } catch (err) {
        if (err.response) {
            console.error(`  Server error ${err.response.status}: ${err.response.data?.error}`);
        } else {
            console.error(`  Cannot reach Argus server at ${SERVER_URL}`);
            console.error(`    Make sure the server is running. (${err.message})`);
        }
        process.exit(1);
    }

    const { logs, count } = response.data;

    if (!count) {
        console.log("No logs found.\n");
        return;
    }

    console.log("─".repeat(70));
    logs.forEach(printLog);
    console.log("─".repeat(70));
    console.log(`\n  ${count} log(s) shown.\n`);
}

module.exports = { showLogs };