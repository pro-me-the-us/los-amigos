const { HealthCheckService } = require("./healthCheckService");
const { FailureDetectionService } = require("./failureDetectionService");
const { RollbackService } = require("./rollbackService");
const { LogService } = require("./logService");
const { DeploymentAnalysisService } = require("./deploymentAnalysisService");
const { DeploymentManagementService } = require("./deploymentManagementService");
const { getVersions } = require("./stateService");
const {
    CORE_BUSINESS_MODULES,
    UI_TO_BUSINESS_INTERACTIONS
} = require("./businessModules");

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

function requireString(value, fieldName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new ValidationError(`${fieldName} is required`);
    }
}

class BusinessLogicLayer {
    static getCoreModules() {
        return CORE_BUSINESS_MODULES;
    }

    static getPresentationInteractions() {
        return UI_TO_BUSINESS_INTERACTIONS;
    }

    static async runHealthCheck({ deploymentId, url }) {
        requireString(deploymentId, "deploymentId");
        requireString(url, "url");

        return HealthCheckService.checkHealth(deploymentId, url);
    }

    static async detectFailure({ healthReport }) {
        if (!healthReport || typeof healthReport !== "object") {
            throw new ValidationError("healthReport is required");
        }

        return await FailureDetectionService.detectFailure(healthReport);
    }

    static async runRollback({ deploymentId, previousVersion, imageName }) {
        requireString(deploymentId, "deploymentId");
        requireString(previousVersion, "previousVersion");
        requireString(imageName, "imageName");

        return RollbackService.rollbackDeployment(
            deploymentId,
            previousVersion,
            imageName
        );
    }

    static async fetchLogs() {
        return LogService.fetchLogs();
    }

    static async listVersions(imageName) {
        if (imageName !== undefined && imageName !== null) {
            requireString(imageName, "imageName");
        }

        return getVersions(imageName);
    }

    static async analyzeDeployment({
        deploymentId,
        url,
        previousVersion,
        imageName
    }) {
        requireString(deploymentId, "deploymentId");
        requireString(url, "url");

        if (previousVersion !== undefined && previousVersion !== null) {
            requireString(previousVersion, "previousVersion");
        }

        if (imageName !== undefined && imageName !== null) {
            requireString(imageName, "imageName");
        }

        return DeploymentAnalysisService.analyzeDeployment({
            deploymentId,
            url,
            previousVersion,
            imageName
        });
    }

    static async deployApplication({ deploymentId, image, url }) {
        requireString(deploymentId, "deploymentId");
        requireString(image, "image");

        if (url !== undefined && url !== null) {
            requireString(url, "url");
        }

        return DeploymentManagementService.deployApplication({
            deploymentId,
            image,
            url
        });
    }
}

module.exports = {
    BusinessLogicLayer,
    ValidationError
};
