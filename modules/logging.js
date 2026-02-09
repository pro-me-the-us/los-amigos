class LogEntry {
  constructor({ level, message, deploymentId = null, timestamp = new Date() }) {
    this.level = level;
    this.message = message;
    this.deploymentId = deploymentId;
    this.timestamp = timestamp;
  }
}

class LogRepository {
  constructor() {
    this.entries = [];
  }

  add(entry) {
    this.entries.push(entry);
  }

  list({ level, deploymentId, limit } = {}) {
    let results = this.entries;

    if (level) {
      results = results.filter((entry) => entry.level === level);
    }

    if (deploymentId) {
      results = results.filter((entry) => entry.deploymentId === deploymentId);
    }

    if (typeof limit === "number") {
      results = results.slice(-limit);
    }

    return results.slice();
  }
}

class LogService {
  constructor(repository = new LogRepository()) {
    this.repository = repository;
  }

  logInfo(message, { deploymentId } = {}) {
    const entry = new LogEntry({ level: "info", message, deploymentId });
    this.repository.add(entry);
    return entry;
  }

  logError(message, { deploymentId } = {}) {
    const entry = new LogEntry({ level: "error", message, deploymentId });
    this.repository.add(entry);
    return entry;
  }

  getLogs(filter = {}) {
    return this.repository.list(filter);
  }
}

module.exports = {
  LogEntry,
  LogRepository,
  LogService,
};
