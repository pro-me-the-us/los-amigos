#!/usr/bin/env node
const { HealthCheckService } = require("./src/services/healthCheckService");
const { FailureDetectionService } = require("./src/services/failureDetectionService");
const { RollbackService } = require("./src/services/rollbackService");
const { LogService } = require("./src/services/logService");

const DEFAULT_HEALTH_URL = "https://jsonplaceholder.typicode.com/posts/1";

const {
    getVersions,
    addVersion,
    addDeployment,
    getLastStableVersion
} = require("./src/services/stateService");

function showHelp() {
    console.log(`
Argus CLI

Commands:
    argus demo
    argus health-check <deploymentId> [url]
    argus deploy-app --image=myapp:v2 [--url=https://example.com/health] [--deploymentId=DEP-123]
    argus rollback --version=v1 [--image=myapp] [--deploymentId=DEP-123]
    argus show-logs
    argus list-versions [imageName]
`);
}

function getUnexpectedPositionals(args) {
    return args.filter((a) => !a.startsWith("--"));
}

function parseFlagArgs(args) {
    const flags = {};

    args.forEach((arg) => {
        if (!arg.startsWith("--")) {
            return;
        }

        const withoutPrefix = arg.slice(2);
        const eqIndex = withoutPrefix.indexOf("=");

        if (eqIndex === -1) {
            flags[withoutPrefix] = true;
            return;
        }

        const key = withoutPrefix.slice(0, eqIndex);
        const value = withoutPrefix.slice(eqIndex + 1);
        flags[key] = value;
    });

    return flags;
}

function parseImage(image) {
    const [imageName, version = "latest"] = image.split(":");

    if (!imageName) {
        return null;
    }

    return { imageName, version };
}

async function runDemo() {
    const deploymentId = "DEP-1001";
    const imageName = "sample-app";

    console.log("\nARGUS SYSTEM DEMO\n");

    console.log("SCENARIO 1 : HEALTHY DEPLOYMENT\n");
    const healthyReport = await HealthCheckService.checkHealth(
        deploymentId,
        "https://jsonplaceholder.typicode.com/posts/1"
    );
    console.log("Health Report:", healthyReport);

    const healthyResult = FailureDetectionService.detectFailure(healthyReport);
    if (!healthyResult.failure) {
        console.log("System Status: Deployment is HEALTHY\n");
    }

    console.log("\nSCENARIO 2 : FAILED DEPLOYMENT\n");
    const failedReport = await HealthCheckService.checkHealth(
        deploymentId,
        "http://invalid-url-for-demo"
    );
    console.log("Health Report:", failedReport);

    const failureResult = FailureDetectionService.detectFailure(failedReport);
    if (failureResult.failure) {
        console.log("\nFailure detected -> Initiating Rollback\n");
        const rollback = RollbackService.rollbackDeployment(
            deploymentId,
            "1.0",
            imageName
        );
        console.log("Rollback Result:", rollback);
    }

    console.log("\nDEMO COMPLETED\n");
}

async function handleDeployApp(args) {
    const flags = parseFlagArgs(args);
    const unexpected = getUnexpectedPositionals(args);
    if (unexpected.length > 0) {
        console.log(`Unexpected argument(s): ${unexpected.join(" ")}`);
        console.log("Usage: node cli.js deploy-app --image=myapp:v2 [--url=https://example.com/health] [--deploymentId=DEP-123]");
        return;
    }
    const image = flags.image;
    const url = flags.url || "https://jsonplaceholder.typicode.com/posts/1";

    if (!image) {
        console.log("Usage: node cli.js deploy-app --image=myapp:v2 [--url=https://example.com/health] [--deploymentId=DEP-123]");
        return;
    }


    const parsedImage = parseImage(image);
    if (!parsedImage) {
        console.log("Invalid image format. Use image:version (example: myapp:v2)");
        return;
    }

    const { imageName, version } = parsedImage;
    const deploymentId = flags.deploymentId || `DEP-${Date.now()}`;
    const startedAt = new Date().toISOString();

    console.log(`[DeploymentManager] Deploying ${imageName}:${version}`);
    LogService.logInfo(deploymentId, `Deployment requested for ${imageName}:${version}`);

    const healthReport = await HealthCheckService.checkHealth(deploymentId, url);
    console.log("Health Report:", healthReport);

    const result = FailureDetectionService.detectFailure(healthReport);
    console.log("Failure Analysis:", result);

    if (!result.failure) {
        addVersion({
            imageName,
            version,
            deploymentId,
            stable: true,
            timestamp: new Date().toISOString()
        });

        addDeployment({
            deploymentId,
            imageName,
            version,
            url,
            status: "Healthy",
            startedAt,
            completedAt: new Date().toISOString()
        });

        console.log(`Deployment successful. Marked ${imageName}:${version} as stable.`);
        return;
    }

    addVersion({
        imageName,
        version,
        deploymentId,
        stable: false,
        timestamp: new Date().toISOString()
    });

    const lastStable = getLastStableVersion(imageName);

    if (lastStable) {
        const rollbackResult = RollbackService.rollbackDeployment(
            deploymentId,
            lastStable.version,
            imageName
        );

        addDeployment({
            deploymentId,
            imageName,
            version,
            url,
            status: "FailedRolledBack",
            rollbackVersion: lastStable.version,
            startedAt,
            completedAt: new Date().toISOString()
        });

        console.log("Deployment failed. Rolled back to stable version:", rollbackResult.version);
        return;
    }

    addDeployment({
        deploymentId,
        imageName,
        version,
        url,
        status: "FailedNoStableVersion",
        startedAt,
        completedAt: new Date().toISOString()
    });

    console.log("Deployment failed. No stable version found for rollback.");
}

async function main() {
    const [, , command, ...args] = process.argv;

    if (!command || command === "help" || command === "--help" || command === "-h") {
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

        const healthReport = await HealthCheckService.checkHealth(deploymentId, url);
        console.log("Health Report:", healthReport);

        const result = FailureDetectionService.detectFailure(healthReport);
        console.log("Failure Analysis:", result);
        return;
    }


    if (command === "deploy-app") {
        await handleDeployApp(args);
        return;
    }

    if (command === "rollback") {
        const flags = parseFlagArgs(args);

        if (flags.version) {
            const deploymentId = flags.deploymentId || `DEP-${Date.now()}`;
            let imageName = flags.image;
            const unexpected = getUnexpectedPositionals(args);
            if (unexpected.length > 0) {
                console.log(`Unexpected argument(s): ${unexpected.join(" ")}`);
                console.log("Usage: node cli.js rollback --version=v1 [--image=myapp] [--deploymentId=DEP-123]");
                return;
            }
            if (!imageName) {
                const allVersions = getVersions();
                const matched = [...allVersions].reverse().find((v) => v.version === flags.version);

                if (!matched) {
                    console.log(`No version record found for ${flags.version}. Use --image=<name> if needed.`);
                    return;
                }

                imageName = matched.imageName;
            }

            const rollbackResult = RollbackService.rollbackDeployment(
                deploymentId,
                flags.version,
                imageName
            );

            addDeployment({
                deploymentId,
                imageName,
                version: flags.version,
                status: "ManualRollback",
                timestamp: new Date().toISOString()
            });

            addVersion({
                imageName,
                version: flags.version,
                deploymentId,
                stable: true,
                timestamp: new Date().toISOString()
            });

            console.log("Rollback Result:", rollbackResult);
            return;
        }

    const [deploymentId, previousVersion, imageName] = args;

    if (!deploymentId || !previousVersion || !imageName) {
        console.log("Usage: node cli.js rollback --version=v1 [--image=myapp] [--deploymentId=DEP-123]");
        console.log("Legacy: node cli.js rollback <deploymentId> <previousVersion> <imageName>");
        return;
    }

    const rollbackResult = RollbackService.rollbackDeployment(
        deploymentId,
        previousVersion,
        imageName
    );
    console.log("Rollback Result:", rollbackResult);
    return;
}


    if (command === "show-logs") {
        const logs = LogService.fetchLogs();

        if (logs.length === 0) {
            console.log("No logs found.");
            return;
        }

        console.log("Stored Logs:");
        logs.forEach((log, index) => {
            console.log(`${index + 1}. [${log.level}] ${log.timestamp} | ${log.deploymentId} | ${log.message}`);
        });
        return;
    }

    if (command === "list-versions" || command === "list-version") {
        const [imageName] = args;
        const versions = getVersions(imageName);

        if (versions.length === 0) {
            console.log(imageName ? `No versions found for ${imageName}.` : "No versions found.");
            return;
        }

        console.log("Stored Versions:");
        versions.forEach((v, index) => {
            console.log(`${index + 1}. ${v.imageName}:${v.version} | stable=${v.stable} | deploymentId=${v.deploymentId} | ${v.timestamp}`);
        });
        return;
    }

    console.log(`Unknown command: ${command}`);
    showHelp();
}

main().catch((error) => {
    console.error("CLI Error:", error.message);
});
