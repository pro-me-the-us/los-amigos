const express = require("express");
const { BusinessLogicLayer, ValidationError } = require("./services/services");
const { LogRepository } = require("../dal/index");

function sendServiceError(res, error) {
    if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
}

function createApp() {
    const app = express();
    app.use(express.json());

    app.get("/", (req, res) => {
        res.send("Argus Server Running");
    });

    app.get("/business-modules", (req, res) => {
        res.json(BusinessLogicLayer.getCoreModules());
    });

    app.get("/ui-interactions", (req, res) => {
        res.json(BusinessLogicLayer.getPresentationInteractions());
    });

    app.post("/health-check", async (req, res) => {
        try {
            const result = await BusinessLogicLayer.runHealthCheck(req.body);
            res.json(result);
        } catch (error) {
            sendServiceError(res, error);
        }
    });

    app.post("/detect-failure", async (req, res) => {
        try {
            const result = await BusinessLogicLayer.detectFailure(req.body);
            res.json(result);
        } catch (error) {
            sendServiceError(res, error);
        }
    });

    app.post("/rollback", async (req, res) => {
        try {
            const result = await BusinessLogicLayer.runRollback(req.body);
            res.json(result);
        } catch (error) {
            sendServiceError(res, error);
        }
    });

    // ── /logs ──────────────────────────────────────────────────────────────────
    // Now reads directly from MongoDB via the DAL LogRepository.
    // Optional query params:
    //   ?level=error|warn|info|debug
    //   ?limit=50
    //   ?deploymentId=<objectId>
    app.get("/logs", async (req, res) => {
        try {
            const limit        = parseInt(req.query.limit) || 100;
            const { level, deploymentId } = req.query;

            let logs;
            if (deploymentId) {
                logs = await LogRepository.findByDeployment(deploymentId, limit);
            } else if (level) {
                logs = await LogRepository.findByLevel(level, limit);
            } else {
                logs = await LogRepository.listRecent(limit);
            }

            res.json({ success: true, count: logs.length, logs });
        } catch (error) {
            sendServiceError(res, error);
        }
    });
    // ──────────────────────────────────────────────────────────────────────────

    app.get("/versions", async (req, res) => {
        try {
            const result = await BusinessLogicLayer.listVersions(req.query.imageName);
            res.json(result);
        } catch (error) {
            sendServiceError(res, error);
        }
    });

    app.post("/analyze", async (req, res) => {
        try {
            const result = await BusinessLogicLayer.analyzeDeployment(req.body);
            res.json(result);
        } catch (error) {
            sendServiceError(res, error);
        }
    });

    app.post("/deploy", async (req, res) => {
        try {
            const result = await BusinessLogicLayer.deployApplication(req.body);
            res.json(result);
        } catch (error) {
            sendServiceError(res, error);
        }
    });

    return app;
}

module.exports = { createApp };
