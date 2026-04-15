const { LogService } = require("./logService");
const { DeploymentAnalysisService } = require("./deploymentAnalysisService");
const {
    addVersion,
    addDeployment,
    getLastStableVersion
} = require("./stateService");

const { runContainer, stopAndRemove } = require("./dockerClient");

class DeploymentManagementService {

    static parseImage(image) {
        const [imageName, version = "latest"] = image.split(":");
        if (!imageName) throw new Error("Invalid image format");
        return { imageName, version };
    }

    static async deployApplication({ deploymentId, image, url }) {

        const { imageName, version } = this.parseImage(image);

        const containerName = `deployment_${deploymentId}`;
        const port = 3000 + parseInt(deploymentId.replace(/\D/g, "")) % 1000;
        const deployedServiceUrl = `http://localhost:${port}`;
        const healthCheckUrl = url || deployedServiceUrl;

        await LogService.logInfo(deploymentId, `Deploying ${imageName}:${version}`);

        await stopAndRemove(containerName);

        await runContainer(imageName, version, containerName, port);

        // wait for container to boot
        await new Promise(r => setTimeout(r, 5000));

        const lastStableVersion = await getLastStableVersion(imageName);

        const analysisResult =
            await DeploymentAnalysisService.analyzeDeployment({
                deploymentId,
                url: healthCheckUrl,
                previousVersion: lastStableVersion?.version,
                imageName
            });

        const stable = !analysisResult.failureResult.failure;

        await addVersion({
            imageName,
            version,
            deploymentId,
            stable,
            timestamp: new Date().toISOString()
        });

        await addDeployment({
            deploymentId,
            imageName,
            version,
            url: deployedServiceUrl,
            healthCheckUrl,
            status: stable
                ? "Healthy"
                : analysisResult.rollbackResult
                    ? "FailedRolledBack"
                    : "FailedNoStableVersion",
            rollbackVersion: analysisResult.rollbackResult?.version || null,
            timestamp: new Date().toISOString()
        });

        return {
            deployment: {
                deploymentId,
                imageName,
                version,
                url: deployedServiceUrl,
                healthCheckUrl
            },
            ...analysisResult
        };
    }
}

module.exports = { DeploymentManagementService };
