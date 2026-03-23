const express = require("express");
const bodyParser = require("body-parser");

const { HealthCheckService } = require("./services/healthCheckService");
const { FailureDetectionService } = require("./services/failureDetectionService");
const { RollbackService } = require("./services/rollbackService");
const { LogService } = require("./services/logService");

const app = express();
app.use(bodyParser.json());

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Argus Server Running 🚀");
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

    const result = FailureDetectionService.detectFailure(healthReport);
    res.json(result);
});


app.post("/rollback", (req, res) => {
    const { deploymentId, previousVersion, imageName } = req.body;

    if (!deploymentId || !previousVersion || !imageName) {
        return res.status(400).json({
            error: "deploymentId, previousVersion, and imageName are required"
        });
    }

    try {
        const result = RollbackService.rollbackDeployment(
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


app.post("/analyze", async (req, res) => {
    const { deploymentId, url, previousVersion, imageName } = req.body;

    if (!deploymentId || !url) {
        return res.status(400).json({
            error: "deploymentId and url are required"
        });
    }

    try {
        // Step 1: Health Check
        const healthReport = await HealthCheckService.checkHealth(deploymentId, url);

        // Step 2: Failure Detection
        const failureResult = FailureDetectionService.detectFailure(healthReport);

        // Step 3: Rollback if failure
        let rollbackResult = null;

        if (failureResult.failure && previousVersion && imageName) {
            rollbackResult = RollbackService.rollbackDeployment(
                deploymentId,
                previousVersion,
                imageName
            );
        }

        res.json({
            healthReport,
            failureResult,
            rollbackResult
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Argus Server running at http://localhost:${PORT}`);
});