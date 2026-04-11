const { connect, disconnect } = require('./db/connection');
const { initializeDatabase }  = require('./db/init');

const DeploymentRepository    = require('./repositories/DeploymentRepository');
const VersionRepository       = require('./repositories/VersionRepository');
const StableVersionRepository = require('./repositories/StableVersionRepository');
const LogRepository           = require('./repositories/LogRepository');

module.exports = {
  // DB lifecycle
  connect,
  disconnect,
  initializeDatabase,

  // Repositories
  DeploymentRepository,
  VersionRepository,
  StableVersionRepository,
  LogRepository
};
