#!/usr/bin/env node

const axios = require("axios");

const BASE_URL = "http://localhost:3000";
const DEFAULT_HEALTH_URL = "https://jsonplaceholder.typicode.com/posts/1";

function showHelp() {
    console.log(`
Argus CLI

Commands:
    argus demo
    argus health-check <deploymentId> [url]
    argus deploy-app --image=myapp:v2 [--url=https://example.com/health] [--deploymentId=DEP-123]
    argus list-versions [imageName]
    argus rollback --version=v1 --image=myapp [--deploymentId=DEP-123]
    argus show-logs
`);
}


function parseFlagArgs(args) {
    const flags = {};

    args.forEach((arg) => {
        if (!arg.startsWith("--")) return;

        const [key, value] = arg.slice(2).split("=");
        flags[key] = value || true;
    });

    return flags;
}


async function runDemo() {
    const deploymentId = "DEP-1001";

    console.log("\nARGUS SYSTEM DEMO\n");

    try {
        // Healthy case
        const healthy = await axios.post(`${BASE_URL}/analyze`, {
            deploymentId,
            url: "https://jsonplaceholder.typicode.com/posts/1",
            previousVersion: "1.0",
            imageName: "sample-app"
        });

        console.log("HEALTHY SCENARIO:");
        console.log(healthy.data);

        // Failure case
        const failed = await axios.post(`${BASE_URL}/analyze`, {
            deploymentId,
            url: "http://invalid-url-for-demo",
            previousVersion: "1.0",
            imageName: "sample-app"
        });

        console.log("\nFAILED SCENARIO:");
        console.log(failed.data);

    } catch (err) {
        console.error("Demo Error:", err.response?.data || err.message);
    }
}


async function handleDeployApp(args) {
    const flags = parseFlagArgs(args);

    const image = flags.image;
    const url = flags.url || DEFAULT_HEALTH_URL;

    if (!image) {
        console.log("Usage: argus deploy-app --image=myapp:v2");
        return;
    }

    const deploymentId = flags.deploymentId || `DEP-${Date.now()}`;

    try {
        const response = await axios.post(`${BASE_URL}/deploy`, {
            deploymentId,
            image,
            url
        });

        console.log("\n=== DEPLOYMENT RESULT ===");
        console.log("Deployment:", response.data.deployment);
        console.log("Health Report:", response.data.healthReport);
        console.log("Failure Analysis:", response.data.failureResult);

        if (response.data.rollbackResult) {
            console.log("Rollback Triggered:", response.data.rollbackResult);
        } else {
            console.log("Deployment Successful");
        }
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}



async function main() {
    const [, , command, ...args] = process.argv;

    if (!command || command === "help" || command === "-h") {
        showHelp();
        return;
    }

    if (command === "demo") {
        await runDemo();
        return;
    }


    if (command === "health-check") {
        const [deploymentId, urlArg] = args;

        if (!deploymentId) {
            console.log("Usage: argus health-check <deploymentId> [url]");
            return;
        }

        const url = urlArg || DEFAULT_HEALTH_URL;

        try {
            const health = await axios.post(`${BASE_URL}/health-check`, {
                deploymentId,
                url
            });

            console.log("Health Report:", health.data);

            const failure = await axios.post(`${BASE_URL}/detect-failure`, {
                healthReport: health.data
            });

            console.log("Failure Analysis:", failure.data);

        } catch (err) {
            console.error("Error:", err.response?.data || err.message);
        }

        return;
    }

    if (command === "deploy-app") {
        await handleDeployApp(args);
        return;
    }

    if (command === "rollback") {
        const flags = parseFlagArgs(args);

        if (!flags.version || !flags.image) {
            console.log("Usage: argus rollback --version=v1 --image=myapp");
            return;
        }

        const deploymentId = flags.deploymentId || `DEP-${Date.now()}`;

        try {
            const response = await axios.post(`${BASE_URL}/rollback`, {
                deploymentId,
                previousVersion: flags.version,
                imageName: flags.image
            });

            console.log("Rollback Result:", response.data);

        } catch (err) {
            console.error("Error:", err.response?.data || err.message);
        }

        return;
    }

    if (command === "show-logs") {
        try {
            const response = await axios.get(`${BASE_URL}/logs`);
            const logs = response.data;

            if (logs.length === 0) {
                console.log("No logs found.");
                return;
            }

            console.log("Stored Logs:");
            logs.forEach((log, index) => {
                console.log(
                    `${index + 1}. [${log.level}] ${log.timestamp} | ${log.deploymentId} | ${log.message}`
                );
            });

        } catch (err) {
            console.error("Error:", err.response?.data || err.message);
        }

        return;
    }

    if (command === "list-versions" || command === "list-version") {
    try {
        const [imageName] = args;
        const query = imageName
            ? `?imageName=${encodeURIComponent(imageName)}`
            : "";

        const response = await axios.get(`${BASE_URL}/versions${query}`);
        const versions = response.data;

        if (versions.length === 0) {
            console.log("No versions found.");
            return;
        }

        console.log("Stored Versions:");
        versions.forEach((version, index) => {
            console.log(
                `${index + 1}. ${version.imageName}:${version.version} | stable=${version.stable} | deploymentId=${version.deploymentId} | ${version.timestamp}`
            );
        });
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }

    return;
}


    console.log(`Unknown command: ${command}`);
    showHelp();
}

main().catch((err) => {
    console.error("CLI Error:", err.message);
});