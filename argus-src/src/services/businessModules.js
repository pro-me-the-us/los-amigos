const CORE_BUSINESS_MODULES = Object.freeze([
    {
        id: "deployment-management",
        name: "Deployment Management Module",
        responsibilities: [
            "Deploy selected container image",
            "Track deployment metadata",
            "Mark deployment status based on analysis"
        ],
        implementedBy: ["DeploymentManagementService"]
    },
    {
        id: "deployment-analysis",
        name: "Deployment Analysis Module",
        responsibilities: [
            "Execute post-deployment health verification",
            "Detect failure conditions",
            "Trigger rollback workflow when needed"
        ],
        implementedBy: [
            "DeploymentAnalysisService",
            "HealthCheckService",
            "FailureDetectionService",
            "RollbackService"
        ]
    },
    {
        id: "version-control",
        name: "Version Control Module",
        responsibilities: [
            "Persist deployed versions",
            "Provide latest stable version for recovery",
            "Serve version history to presentation layer"
        ],
        implementedBy: ["stateService"]
    },
    {
        id: "logging-audit",
        name: "Logging and Audit Module",
        responsibilities: [
            "Record deployment and rollback events",
            "Store structured logs for traceability",
            "Serve logs to admin/developer views"
        ],
        implementedBy: ["LogService", "stateService"]
    }
]);

const UI_TO_BUSINESS_INTERACTIONS = Object.freeze({
    "CLI: deploy-app": [
        "Deployment Management Module",
        "Deployment Analysis Module",
        "Version Control Module",
        "Logging and Audit Module"
    ],
    "CLI: health-check": [
        "Deployment Analysis Module",
        "Logging and Audit Module"
    ],
    "CLI: rollback": [
        "Deployment Analysis Module",
        "Version Control Module",
        "Logging and Audit Module"
    ],
    "CLI: list-versions": ["Version Control Module"],
    "CLI: show-logs": ["Logging and Audit Module"],
    "HTTP UI: /deploy": [
        "Deployment Management Module",
        "Deployment Analysis Module",
        "Version Control Module",
        "Logging and Audit Module"
    ],
    "HTTP UI: /analyze": ["Deployment Analysis Module"],
    "HTTP UI: /rollback": [
        "Deployment Analysis Module",
        "Version Control Module",
        "Logging and Audit Module"
    ],
    "HTTP UI: /versions": ["Version Control Module"],
    "HTTP UI: /logs": ["Logging and Audit Module"]
});

module.exports = {
    CORE_BUSINESS_MODULES,
    UI_TO_BUSINESS_INTERACTIONS
};
