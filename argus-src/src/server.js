const express = require("express");

const { HealthCheckService } = require("./services/healthCheckService");
const { FailureDetectionService } = require("./services/failureDetectionService");
const { RollbackService } = require("./services/rollbackService");
const { LogService } = require("./services/logService");
const { getVersions } = require("./services/stateService");
const { DeploymentAnalysisService } = require("./services/deploymentAnalysisService");
const { DeploymentManagementService } = require("./services/deploymentManagementService");

const app = express();
app.use(express.json());

const PORT = 5000;

app.get("/", (req, res) => {
    res.send("Argus Server Running");
});

app.post("/health-check", async (req, res) => {
    const { deploymentId, url } = req.body;

    if (!deploymentId || !url) {
        return res.status(400).json({
            error: "deploymentId and url are required"
        });
    }

    try {
        const result = await HealthCheckService.checkHealth(deploymentId, url);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/detect-failure", (req, res) => {
    const { healthReport } = req.body;

    if (!healthReport) {
        return res.status(400).json({
            error: "healthReport is required"
        });
    }

    try {
        const result = FailureDetectionService.detectFailure(healthReport);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/rollback", async (req, res) => {
    const { deploymentId, previousVersion, imageName } = req.body;

    if (!deploymentId || !previousVersion || !imageName) {
        return res.status(400).json({
            error: "deploymentId, previousVersion, and imageName are required"
        });
    }

    try {
        const result = await RollbackService.rollbackDeployment(
            deploymentId,
            previousVersion,
            imageName
        );

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/logs", (req, res) => {
    try {
        const logs = LogService.fetchLogs();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/versions", (req, res) => {
    try {
        const imageName = req.query.imageName;
        const versions = getVersions(imageName);
        res.json(versions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/analyze", async (req, res) => {
    const { deploymentId, url, previousVersion, imageName } = req.body;

    try {
        const result = await DeploymentAnalysisService.analyzeDeployment({
            deploymentId,
            url,
            previousVersion,
            imageName
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/deploy", async (req, res) => {
    const { deploymentId, image, url } = req.body;

    try {
        const result = await DeploymentManagementService.deployApplication({
            deploymentId,
            image,
            url
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Argus Server running at http://localhost:${PORT}`);
});
