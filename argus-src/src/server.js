const { createApp } = require("./app");
const { connect }   = require("../dal/db/connection"); // ← DAL connection

const PORT = 5000;

async function startServer() {
    try {
        await connect();                                // ← connect MongoDB first
        console.log("[Server] MongoDB connected.");

        const app = createApp();
        app.listen(PORT, () => {
            console.log(`Argus Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("[Server] Failed to start:", err.message);
        process.exit(1);
    }
}

startServer();
