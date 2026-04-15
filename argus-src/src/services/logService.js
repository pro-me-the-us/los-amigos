const { appendLog, getLogs } = require("./stateService");

class LogService {
    static async persist(level, deploymentId, message, extras = {}) {
        const timestamp = new Date().toISOString();
        const entry = {
            level,
            timestamp,
            deploymentId,
            message,
            service: extras.service || "LogService",
            appName: extras.appName || null,
            metadata: extras.metadata || {}
        };

        console.log(`[${level.toUpperCase()}] ${timestamp} | ${deploymentId} | ${message}`);
        try {
            await appendLog(entry);
        } catch (error) {
            console.error(`[LogService] Failed to persist log to MongoDB: ${error.message}`);
        }
    }

    static async logInfo(deploymentId, message, extras = {}) {
        return this.persist("info", deploymentId, message, extras);
    }

    static async logError(deploymentId, message, extras = {}) {
        return this.persist("error", deploymentId, message, extras);
    }

    static async fetchLogs(limit = 100) {
        return getLogs(limit);
    }
}

module.exports = { LogService };
