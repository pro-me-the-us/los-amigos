const assert = require("node:assert/strict");
const { once } = require("node:events");
const { disconnect } = require("../dal");
const { createApp } = require("../src/app");

async function withServer(run) {
    const app = createApp();
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        await run(`http://127.0.0.1:${port}`);
    } finally {
        await new Promise((resolve) => server.close(resolve));
        await disconnect();
    }
}

async function request(baseUrl, path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        headers: { "content-type": "application/json" },
        ...options
    });

    const text = await response.text();
    let body = text;
    try {
        body = JSON.parse(text);
    } catch {
        // Plain text endpoint.
    }

    return { status: response.status, body };
}

function pass(id, actual) {
    console.log(`${id} PASS ${actual}`);
}

async function run() {
    await withServer(async (baseUrl) => {
        let result = await request(baseUrl, "/");
        assert.equal(result.status, 200);
        assert.equal(result.body, "Argus Server Running");
        pass("A9-TC-01", "root endpoint returned server running text");

        result = await request(baseUrl, "/health-check", {
            method: "POST",
            body: JSON.stringify({ url: "http://127.0.0.1" })
        });
        assert.equal(result.status, 400);
        assert.equal(result.body.error, "deploymentId is required");
        pass("A9-TC-02", result.body.error);

        result = await request(baseUrl, "/health-check", {
            method: "POST",
            body: JSON.stringify({ deploymentId: "A9-TC-03" })
        });
        assert.equal(result.status, 400);
        assert.equal(result.body.error, "url is required");
        pass("A9-TC-03", result.body.error);

        result = await request(baseUrl, "/health-check", {
            method: "POST",
            body: JSON.stringify({
                deploymentId: "A9-TC-04",
                url: `${baseUrl}/`
            })
        });
        assert.equal(result.status, 200);
        assert.equal(result.body.status, "Healthy");
        assert.equal(result.body.type, "HTTP");
        pass("A9-TC-04", `status=${result.body.status}, type=${result.body.type}`);

        result = await request(baseUrl, "/health-check", {
            method: "POST",
            body: JSON.stringify({
                deploymentId: "A9-TC-05",
                url: "http://127.0.0.1:65530"
            })
        });
        assert.equal(result.status, 200);
        assert.equal(result.body.status, "Unhealthy");
        pass("A9-TC-05", `status=${result.body.status}`);

        result = await request(baseUrl, "/detect-failure", {
            method: "POST",
            body: JSON.stringify({
                healthReport: {
                    deploymentId: "A9-TC-06",
                    status: "Healthy"
                }
            })
        });
        assert.equal(result.status, 200);
        assert.equal(result.body.failure, false);
        pass("A9-TC-06", `failure=${result.body.failure}`);

        result = await request(baseUrl, "/detect-failure", {
            method: "POST",
            body: JSON.stringify({
                healthReport: {
                    deploymentId: "A9-TC-07",
                    status: "Unhealthy",
                    error: "Connection refused"
                }
            })
        });
        assert.equal(result.status, 200);
        assert.equal(result.body.failure, true);
        assert.equal(result.body.reason, "Connection refused");
        pass("A9-TC-07", `failure=${result.body.failure}, reason=${result.body.reason}`);

        result = await request(baseUrl, "/analyze", {
            method: "POST",
            body: JSON.stringify({
                deploymentId: "A9-TC-08",
                url: "http://127.0.0.1:65530"
            })
        });
        assert.equal(result.status, 200);
        assert.equal(result.body.healthReport.status, "Unhealthy");
        assert.equal(result.body.failureResult.failure, true);
        assert.equal(result.body.rollbackResult, null);
        pass(
            "A9-TC-08",
            `health=${result.body.healthReport.status}, rollbackResult=${result.body.rollbackResult}`
        );
    });
}

run().catch((error) => {
    console.error("Assignment 9 evidence failed:", error);
    process.exit(1);
});
