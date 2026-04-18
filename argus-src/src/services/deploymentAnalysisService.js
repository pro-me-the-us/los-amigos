const { HealthCheckService } = require("./healthCheckService");
const { FailureDetectionService } = require("./failureDetectionService");
const { RollbackService } = require("./rollbackService");

class DeploymentAnalysisService {

    static async analyzeDeployment({
        deploymentId,
        url,
        previousVersion,
        imageName
    }) {

        const healthReport =
            await HealthCheckService.checkHealth(deploymentId, url);

        const failureResult =
            await FailureDetectionService.detectFailure(healthReport);

        let rollbackResult = null;

        if (failureResult.failure && previousVersion && imageName) {
            rollbackResult = await RollbackService.rollbackDeployment(
                deploymentId,
                previousVersion,
                imageName
            );
        }

        return {
            healthReport,
            failureResult,
            rollbackResult
        };
    }
}

module.exports = { DeploymentAnalysisService };
