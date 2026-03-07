class LogService {

    static logInfo(deploymentId, message) {

        const timestamp = new Date().toISOString();

        console.log(
            `[INFO] ${timestamp} | ${deploymentId} | ${message}`
        );
    }

    static logError(deploymentId, message) {

        const timestamp = new Date().toISOString();

        console.error(
            `[ERROR] ${timestamp} | ${deploymentId} | ${message}`
        );
    }
}

module.exports = { LogService };