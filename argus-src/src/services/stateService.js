const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "..", "..", "data", "state.json");

const DEFAULT_STATE = {
    logs: [],
    versions: [],
    deployments: []
};

function ensureStore() {
    const dir = path.dirname(STORE_PATH);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(STORE_PATH)) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), "utf8");
    }
}

function readState() {
    ensureStore();

    try {
        const raw = fs.readFileSync(STORE_PATH, "utf8");
        const parsed = JSON.parse(raw);

        return {
            logs: Array.isArray(parsed.logs) ? parsed.logs : [],
            versions: Array.isArray(parsed.versions) ? parsed.versions : [],
            deployments: Array.isArray(parsed.deployments) ? parsed.deployments : []
        };
    } catch (error) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), "utf8");
        return { ...DEFAULT_STATE };
    }
}

function writeState(state) {
    ensureStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
}

function appendLog(logEntry) {
    const state = readState();
    state.logs.push(logEntry);
    writeState(state);
}

function addVersion(versionEntry) {
    const state = readState();
    state.versions.push(versionEntry);
    writeState(state);
}

function addDeployment(deploymentEntry) {
    const state = readState();
    state.deployments.push(deploymentEntry);
    writeState(state);
}

function getLogs() {
    return readState().logs;
}

function getVersions(imageName) {
    const versions = readState().versions;

    if (!imageName) {
        return versions;
    }

    return versions.filter((v) => v.imageName === imageName);
}

function getLastStableVersion(imageName) {
    const versions = getVersions(imageName);

    for (let i = versions.length - 1; i >= 0; i -= 1) {
        if (versions[i].stable === true) {
            return versions[i];
        }
    }

    return null;
}

module.exports = {
    readState,
    writeState,
    appendLog,
    addVersion,
    addDeployment,
    getLogs,
    getVersions,
    getLastStableVersion
};
