const { AuthenticationService, AdminController } = require("./authentication");
const { LogService } = require("./logging");

const logService = new LogService();
const authService = new AuthenticationService();

const admin = authService.addUser("admin", "secret", "admin");
const dev = authService.addUser("dev", "devpass", "developer");

const adminToken = authService.authenticate(admin.username, "secret");
const devToken = authService.authenticate(dev.username, "devpass");

logService.logInfo("Deployment started", { deploymentId: "deploy-001" });
logService.logInfo("Health check passed", { deploymentId: "deploy-001" });
logService.logError("Rollback triggered", { deploymentId: "deploy-002" });

const adminController = new AdminController({ authService, logService });

console.log("Admin logs:");
console.log(adminController.getSystemLogs(adminToken));

console.log("Developer attempting to read logs:");
try {
  console.log(adminController.getSystemLogs(devToken));
} catch (error) {
  console.log("Denied:", error.message);
}
