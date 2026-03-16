const axios = require("axios");
const { LogService } = require("./logService");

class HealthCheckService {

    /**
     * Performs a health check on the deployed service
     * @param {string} deploymentId
     * @param {string} url
     */
    static async checkHealth(deploymentId, url) {

        console.log(`[HealthCheckService] Probing ${url} for ${deploymentId}`);

        try {
            const response = await axios.get(url, { timeout: 5000 });

            if (response.status === 200) {
                LogService.logInfo(
                    deploymentId,
                    "Health check successful"
                );

                return {
                    deploymentId: deploymentId,
                    status: "Healthy",
                    timestamp: new Date().toISOString()
                };
            }

            return {
                deploymentId: deploymentId,
                status: "Unhealthy",
                reason: "Non-200 response"
            };

        } catch (error) {

            LogService.logError(
                deploymentId,
                `Health check failed: ${error.message}`
            );

            return {
                deploymentId: deploymentId,
                status: "Unhealthy",
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = { HealthCheckService };