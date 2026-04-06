const express = require("express");
const { BusinessLogicLayer, ValidationError } = require("./services/services");

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

    app.post("/detect-failure", (req, res) => {
        try {
            const result = BusinessLogicLayer.detectFailure(req.body);
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

    app.get("/logs", (req, res) => {
        try {
            res.json(BusinessLogicLayer.fetchLogs());
        } catch (error) {
            sendServiceError(res, error);
        }
    });

    app.get("/versions", (req, res) => {
        try {
            const result = BusinessLogicLayer.listVersions(req.query.imageName);
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
