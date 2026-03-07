const { LogService } = require("./logService");

class RollbackService {

    /**
     * Rolls back deployment to previous version
     * @param {string} deploymentId
     * @param {string} previousVersion
     * @param {string} imageName
     */
    static rollbackDeployment(deploymentId, previousVersion, imageName) {

        LogService.logInfo(
            deploymentId,
            `Initiating rollback to version ${previousVersion}`
        );

        console.log(
            `[DeploymentPlatformClient] Rolling back container: docker run ${imageName}:${previousVersion}`
        );

        return {
            deploymentId: deploymentId,
            status: "RolledBack",
            version: previousVersion,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = { RollbackService };