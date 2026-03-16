const { LogService } = require("./logService");

class FailureDetectionService {

    /**
     * Analyzes health report to detect failure
     * @param {Object} healthReport
     */
    static detectFailure(healthReport) {

        if (!healthReport) {
            return { failure: true, reason: "Invalid health report" };
        }

        if (healthReport.status === "Healthy") {

            LogService.logInfo(
                healthReport.deploymentId,
                "Deployment is healthy"
            );

            return {
                failure: false,
                deploymentId: healthReport.deploymentId
            };
        }

        LogService.logError(
            healthReport.deploymentId,
            "Deployment failure detected"
        );

        return {
            failure: true,
            deploymentId: healthReport.deploymentId,
            reason: healthReport.error || "Service unhealthy"
        };
    }
}

module.exports = { FailureDetectionService };