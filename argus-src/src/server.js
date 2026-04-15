const { createApp } = require("./app");
const { initializeDatabase, disconnect } = require("../dal/index");
const { migrateLegacyStateToMongo } = require("./services/stateService");

const PORT = 5000;

async function startServer() {
    try {
        await initializeDatabase();
        await migrateLegacyStateToMongo();
        console.log("[Server] MongoDB connected and initialized.");

        const app = createApp();
        const server = app.listen(PORT, () => {
            console.log(`Argus Server running at http://localhost:${PORT}`);
        });

        const shutdown = async () => {
            server.close(async () => {
                await disconnect();
                process.exit(0);
            });
        };

        process.once("SIGINT", shutdown);
        process.once("SIGTERM", shutdown);
    } catch (err) {
        console.error("[Server] Failed to start:", err.message);
        process.exit(1);
    }
}

startServer();
