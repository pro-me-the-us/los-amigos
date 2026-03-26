const { LogService } = require("./logService");
const { DeploymentAnalysisService } = require("./deploymentAnalysisService");
const {
    addVersion,
    addDeployment,
    getLastStableVersion
} = require("./stateService");

class DeploymentManagementService {
    static parseImage(image) {
        const [imageName, version = "latest"] = image.split(":");

        if (!imageName) {
            throw new Error("Invalid image format. Use image:version");
        }

        return { imageName, version };
    }

    static async deployApplication({
        deploymentId,
        image,
        url
    }) {
        if (!deploymentId || !image || !url) {
            throw new Error("deploymentId, image, and url are required");
        }

        const { imageName, version } = this.parseImage(image);
        const startedAt = new Date().toISOString();

        LogService.logInfo(
            deploymentId,
            `Deployment requested for ${imageName}:${version}`
        );

        const lastStableVersion = getLastStableVersion(imageName);

        const analysisResult = await DeploymentAnalysisService.analyzeDeployment({
            deploymentId,
            url,
            previousVersion: lastStableVersion ? lastStableVersion.version : null,
            imageName
        });

        const stable = !analysisResult.failureResult.failure;

        addVersion({
            imageName,
            version,
            deploymentId,
            stable,
            timestamp: new Date().toISOString()
        });

        addDeployment({
            deploymentId,
            imageName,
            version,
            url,
            status: stable
                ? "Healthy"
                : analysisResult.rollbackResult
                    ? "FailedRolledBack"
                    : "FailedNoStableVersion",
            rollbackVersion: analysisResult.rollbackResult
                ? analysisResult.rollbackResult.version
                : null,
            startedAt,
            completedAt: new Date().toISOString()
        });

        return {
            deployment: {
                deploymentId,
                imageName,
                version
                // status: stable
                //     ? "Healthy"
                //     : analysisResult.rollbackResult
                //         ? "FailedRolledBack"
                //         : "FailedNoStableVersion"
            },
            ...analysisResult
        };
    }
}

module.exports = { DeploymentManagementService };
