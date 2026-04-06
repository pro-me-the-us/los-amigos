const axios = require("axios");
const net = require("net");
const { LogService } = require("./logService");

function checkTCP(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        socket.setTimeout(3000);

        socket.on("connect", () => {
            socket.destroy();
            resolve(true);
        });

        socket.on("error", () => resolve(false));
        socket.on("timeout", () => resolve(false));

        socket.connect(port, "127.0.0.1");
    });
}

class HealthCheckService {

    static async checkHealth(deploymentId, url) {

        const port = parseInt(url.split(":").pop());

        try {
            // 1. Try HTTP
            try {
                await axios.get(url, { timeout: 3000 });

                return {
                    deploymentId,
                    status: "Healthy",
                    type: "HTTP"
                };
            } catch (err) {
                // fallback to TCP
            }

            // 2. TCP fallback
            const isOpen = await checkTCP(port);

            if (isOpen) {
                return {
                    deploymentId,
                    status: "Healthy",
                    type: "TCP"
                };
            }

            return {
                deploymentId,
                status: "Unhealthy"
            };

        } catch (error) {

            LogService.logError(
                deploymentId,
                `Health check failed: ${error.message}`
            );

            return {
                deploymentId,
                status: "Unhealthy",
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = { HealthCheckService };