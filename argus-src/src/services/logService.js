const { appendLog, getLogs } = require("./stateService");

class LogService {
    static logInfo(deploymentId, message) {
        const timestamp = new Date().toISOString();

        const entry = {
            level: "INFO",
            timestamp,
            deploymentId,
            message
        };

        console.log(`[INFO] ${timestamp} | ${deploymentId} | ${message}`);
        appendLog(entry);
    }

    static logError(deploymentId, message) {
        const timestamp = new Date().toISOString();

        const entry = {
            level: "ERROR",
            timestamp,
            deploymentId,
            message
        };

        console.error(`[ERROR] ${timestamp} | ${deploymentId} | ${message}`);
        appendLog(entry);
    }

    static fetchLogs() {
        return getLogs();
    }
}

module.exports = { LogService };
