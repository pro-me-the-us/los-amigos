const assert = require("node:assert/strict");
const {
    BusinessLogicLayer,
    ValidationError
} = require("../src/services/services");
const { createApp } = require("../src/app");

async function withServer(runAssertions) {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });

    try {
        const address = server.address();
        const baseUrl = `http://127.0.0.1:${address.port}`;
        await runAssertions(baseUrl);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

async function testBusinessModules() {
    const modules = BusinessLogicLayer.getCoreModules();
    assert.ok(Array.isArray(modules));
    assert.ok(modules.length >= 4);
    assert.ok(
        modules.some((module) => module.id === "deployment-management")
    );
    assert.ok(
        modules.some((module) => module.id === "deployment-analysis")
    );

    const interactions = BusinessLogicLayer.getPresentationInteractions();
    assert.ok(interactions["CLI: deploy-app"]);
    assert.ok(
        interactions["CLI: deploy-app"].includes("Deployment Management Module")
    );
    assert.ok(interactions["HTTP UI: /deploy"]);

    await assert.rejects(
        BusinessLogicLayer.runHealthCheck({ url: "http://localhost:3000" }),
        (error) => {
            assert.ok(error instanceof ValidationError);
            assert.equal(error.message, "deploymentId is required");
            return true;
        }
    );
}

async function testPresentationInteractions() {
    await withServer(async (baseUrl) => {
        const moduleResponse = await fetch(`${baseUrl}/business-modules`);
        const modulePayload = await moduleResponse.json();
        assert.equal(moduleResponse.status, 200);
        assert.ok(Array.isArray(modulePayload));
        assert.ok(
            modulePayload.some((module) => module.id === "logging-audit")
        );

        const interactionResponse = await fetch(`${baseUrl}/ui-interactions`);
        const interactionPayload = await interactionResponse.json();
        assert.equal(interactionResponse.status, 200);
        assert.ok(interactionPayload["CLI: show-logs"]);
        assert.ok(interactionPayload["HTTP UI: /versions"]);

        const invalidDeployResponse = await fetch(`${baseUrl}/deploy`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                deploymentId: "DEP-123"
            })
        });

        const invalidDeployPayload = await invalidDeployResponse.json();
        assert.equal(invalidDeployResponse.status, 400);
        assert.equal(invalidDeployPayload.error, "image is required");
    });
}

async function run() {
    await testBusinessModules();
    await testPresentationInteractions();
    console.log("All tests passed.");
}

run().catch((error) => {
    console.error("Test failure:", error);
    process.exit(1);
});
