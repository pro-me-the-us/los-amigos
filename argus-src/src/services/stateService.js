const fs = require("fs");
const path = require("path");
const {
    DeploymentRepository,
    VersionRepository,
    StableVersionRepository,
    LogRepository
} = require("../../dal/index");

const LEGACY_STORE_PATH = path.join(__dirname, "..", "..", "data", "state.json");

function readLegacyState() {
    if (!fs.existsSync(LEGACY_STORE_PATH)) {
        return { logs: [], versions: [], deployments: [] };
    }

    try {
        const raw = fs.readFileSync(LEGACY_STORE_PATH, "utf8");
        const parsed = JSON.parse(raw);

        return {
            logs: Array.isArray(parsed.logs) ? parsed.logs : [],
            versions: Array.isArray(parsed.versions) ? parsed.versions : [],
            deployments: Array.isArray(parsed.deployments) ? parsed.deployments : []
        };
    } catch (error) {
        return { logs: [], versions: [], deployments: [] };
    }
}

function toDate(value) {
    if (!value) return new Date();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeDeploymentStatus(status) {
    const value = String(status || "").toLowerCase();

    if (value === "healthy" || value === "success") return "success";
    if (value === "running") return "running";
    if (value === "pending") return "pending";
    if (value === "rolled_back" || value === "failedrolledback") return "rolled_back";
    if (value === "failed" || value === "failednostableversion") return "failed";

    return "pending";
}

async function migrateLegacyStateToMongo() {
    const legacyState = readLegacyState();
    if (!legacyState.logs.length && !legacyState.versions.length && !legacyState.deployments.length) {
        return { migrated: false };
    }

    const [existingLogs, existingVersions, existingDeployments] = await Promise.all([
        LogRepository.listRecent(1),
        VersionRepository.listAll(1),
        DeploymentRepository.listAll(1)
    ]);

    if (legacyState.logs.length > 0 && existingLogs.length === 0) {
        for (const logEntry of legacyState.logs) {
            if (!logEntry || typeof logEntry.message !== "string" || !logEntry.message.trim()) {
                // Skip malformed legacy log entries instead of failing startup.
                continue;
            }

            try {
                await LogRepository.create({
                    level: String(logEntry.level || "info").toLowerCase(),
                    message: logEntry.message,
                    deploymentId: logEntry.deploymentId || null,
                    service: logEntry.service || null,
                    appName: logEntry.appName || null,
                    metadata: logEntry.metadata || {},
                    timestamp: logEntry.timestamp
                });
            } catch (error) {
                console.warn(`[StateMigration] Skipped invalid log entry: ${error.message}`);
            }
        }
    }

    if (legacyState.versions.length > 0 && existingVersions.length === 0) {
        const latestStableByApp = new Map();

        for (const versionEntry of legacyState.versions) {
            if (!versionEntry || !versionEntry.imageName || !versionEntry.version) {
                continue;
            }

            try {
                await VersionRepository.create({
                    appName: versionEntry.imageName,
                    version: versionEntry.version,
                    imageTag: `${versionEntry.imageName}:${versionEntry.version}`,
                    deploymentId: versionEntry.deploymentId || null,
                    stable: versionEntry.stable === true,
                    createdAt: versionEntry.timestamp
                });
            } catch (error) {
                console.warn(`[StateMigration] Skipped invalid version entry: ${error.message}`);
                continue;
            }

            if (versionEntry.stable === true) {
                const current = latestStableByApp.get(versionEntry.imageName);
                const currentTime = current ? toDate(current.timestamp).getTime() : 0;
                const candidateTime = toDate(versionEntry.timestamp).getTime();

                if (!current || candidateTime >= currentTime) {
                    latestStableByApp.set(versionEntry.imageName, versionEntry);
                }
            }
        }

        for (const stableVersion of latestStableByApp.values()) {
            await StableVersionRepository.setStable({
                appName: stableVersion.imageName,
                version: stableVersion.version,
                imageTag: `${stableVersion.imageName}:${stableVersion.version}`,
                deploymentId: stableVersion.deploymentId || null
            });
        }
    }

    if (legacyState.deployments.length > 0 && existingDeployments.length === 0) {
        for (const deploymentEntry of legacyState.deployments) {
            if (!deploymentEntry || !deploymentEntry.imageName || !deploymentEntry.version) {
                continue;
            }

            try {
                await DeploymentRepository.create({
                    appName: deploymentEntry.imageName,
                    version: deploymentEntry.version,
                    imageTag: `${deploymentEntry.imageName}:${deploymentEntry.version}`,
                    status: normalizeDeploymentStatus(deploymentEntry.status),
                    url: deploymentEntry.url || null,
                    healthCheckUrl: deploymentEntry.healthCheckUrl || null,
                    rollbackVersion: deploymentEntry.rollbackVersion || null,
                    deploymentId: deploymentEntry.deploymentId || null,
                    createdAt: deploymentEntry.timestamp
                });
            } catch (error) {
                console.warn(`[StateMigration] Skipped invalid deployment entry: ${error.message}`);
            }
        }
    }

    return { migrated: true };
}

async function appendLog(logEntry) {
    return LogRepository.create({
        level: String(logEntry.level || "info").toLowerCase(),
        message: logEntry.message,
        deploymentId: logEntry.deploymentId || null,
        service: logEntry.service || null,
        appName: logEntry.appName || null,
        metadata: logEntry.metadata || {},
        timestamp: logEntry.timestamp
    });
}

async function addVersion(versionEntry) {
    await VersionRepository.create({
        appName: versionEntry.imageName,
        version: versionEntry.version,
        imageTag: `${versionEntry.imageName}:${versionEntry.version}`,
        deploymentId: versionEntry.deploymentId || null,
        stable: versionEntry.stable === true,
        createdAt: versionEntry.timestamp
    });

    if (versionEntry.stable === true) {
        await StableVersionRepository.setStable({
            appName: versionEntry.imageName,
            version: versionEntry.version,
            imageTag: `${versionEntry.imageName}:${versionEntry.version}`,
            deploymentId: versionEntry.deploymentId || null
        });
    }
}

async function addDeployment(deploymentEntry) {
    await DeploymentRepository.create({
        appName: deploymentEntry.imageName,
        version: deploymentEntry.version,
        imageTag: `${deploymentEntry.imageName}:${deploymentEntry.version}`,
        status: normalizeDeploymentStatus(deploymentEntry.status),
        url: deploymentEntry.url || null,
        healthCheckUrl: deploymentEntry.healthCheckUrl || null,
        rollbackVersion: deploymentEntry.rollbackVersion || null,
        deploymentId: deploymentEntry.deploymentId || null,
        createdAt: deploymentEntry.timestamp
    });
}

async function getLogs(limit = 100) {
    return LogRepository.listRecent(limit);
}

async function getVersions(imageName) {
    const versions = imageName
        ? await VersionRepository.findAllByApp(imageName)
        : await VersionRepository.listAll();

    return versions.map((versionDocument) => ({
        imageName: versionDocument.appName,
        version: versionDocument.version,
        deploymentId: versionDocument.deploymentId || null,
        stable: versionDocument.stable === true,
        timestamp: toDate(versionDocument.createdAt).toISOString()
    }));
}

async function getLastStableVersion(imageName) {
    const stableVersion = await StableVersionRepository.getStable(imageName);

    if (stableVersion) {
        return {
            imageName: stableVersion.appName,
            version: stableVersion.version,
            deploymentId: stableVersion.deploymentId || null,
            stable: true,
            timestamp: toDate(stableVersion.markedAt).toISOString()
        };
    }

    const versions = await getVersions(imageName);
    return versions.find((version) => version.stable === true) || null;
}

module.exports = {
    migrateLegacyStateToMongo,
    appendLog,
    addVersion,
    addDeployment,
    getLogs,
    getVersions,
    getLastStableVersion
};
