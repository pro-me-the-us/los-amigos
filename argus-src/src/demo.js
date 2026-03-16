const { HealthCheckService } = require("./src/services/healthCheckService");
const { FailureDetectionService } = require("./src/services/failureDetectionService");
const { RollbackService } = require("./src/services/rollbackService");

async function runDemo() {

    const deploymentId = "DEP-1001";
    const imageName = "sample-app";

    console.log("\n=========== ARGUS SYSTEM DEMO ===========\n");

    /*
        SCENARIO 1
        HEALTHY DEPLOYMENT
    */

    console.log("SCENARIO 1 : HEALTHY DEPLOYMENT\n");

    const healthyReport = await HealthCheckService.checkHealth(
        deploymentId,
        "https://jsonplaceholder.typicode.com/posts/1"
    );

    console.log("Health Report:", healthyReport);

    const healthyResult = FailureDetectionService.detectFailure(healthyReport);

    if (!healthyResult.failure) {
        console.log("System Status: Deployment is HEALTHY\n");
    }

    console.log("---------------------------------------\n");



    /*
        SCENARIO 2
        FAILED DEPLOYMENT → ROLLBACK
    */

    console.log("SCENARIO 2 : FAILED DEPLOYMENT\n");

    const failedReport = await HealthCheckService.checkHealth(
        deploymentId,
        "http://invalid-url-for-demo"
    );

    console.log("Health Report:", failedReport);

    const failureResult = FailureDetectionService.detectFailure(failedReport);

    if (failureResult.failure) {

        console.log("\nFailure detected → Initiating Rollback\n");

        const rollback = RollbackService.rollbackDeployment(
            deploymentId,
            "1.0",
            imageName
        );

        console.log("Rollback Result:", rollback);
    }

    console.log("\n=========== DEMO COMPLETED ===========\n");
}

runDemo();