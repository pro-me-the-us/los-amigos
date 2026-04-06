const { LogService } = require("./logService");
const { runContainer, stopAndRemove } = require("./dockerClient");

class RollbackService {

    static async rollbackDeployment(deploymentId, previousVersion, imageName) {

        const containerName = `deployment_${deploymentId}`;
        const port = 3000 + parseInt(deploymentId.replace(/\D/g, "")) % 1000;

        LogService.logInfo(
            deploymentId,
            `Rolling back to ${imageName}:${previousVersion}`
        );

        await stopAndRemove(containerName);

        await runContainer(imageName, previousVersion, containerName, port);

        return {
            deploymentId,
            status: "RolledBack",
            version: previousVersion,
            port,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = { RollbackService };