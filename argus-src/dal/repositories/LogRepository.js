const { getDb } = require('../db/connection');
const { ObjectId } = require('mongodb');

const COLLECTION = 'logs';

/**
 * LogRepository
 * Persists and retrieves structured log entries for the Argus system.
 */
class LogRepository {
  async _col() {
    const db = await getDb();
    return db.collection(COLLECTION);
  }

  /**
   * Save a log entry.
   * @param {Object} logData - { level, message, service, deploymentId, appName, metadata }
   * @returns {string} inserted document ID
   */
  async create(logData) {
    const col = await this._col();
    const doc = {
      level:        logData.level || 'info',
      message:      logData.message,
      metadata:     logData.metadata || {},
      timestamp:    logData.timestamp ? new Date(logData.timestamp) : new Date()
    };

    if (typeof logData.service === 'string' && logData.service.trim()) {
      doc.service = logData.service;
    }

    if (typeof logData.deploymentId === 'string' && logData.deploymentId.trim()) {
      doc.deploymentId = logData.deploymentId;
    }

    if (typeof logData.appName === 'string' && logData.appName.trim()) {
      doc.appName = logData.appName;
    }

    const result = await col.insertOne(doc);
    return result.insertedId.toString();
  }

  /**
   * Convenience method - log an INFO entry.
   */
  async info(message, extras = {}) {
    return this.create({ level: 'info', message, ...extras });
  }

  /**
   * Convenience method - log a WARN entry.
   */
  async warn(message, extras = {}) {
    return this.create({ level: 'warn', message, ...extras });
  }

  /**
   * Convenience method - log an ERROR entry.
   */
  async error(message, extras = {}) {
    return this.create({ level: 'error', message, ...extras });
  }

  /**
   * Get all logs for a specific deployment.
   * @param {string} deploymentId
   */
  async findByDeployment(deploymentId, limit = 100) {
    const col = await this._col();
    return col.find({ deploymentId }).sort({ timestamp: -1 }).limit(limit).toArray();
  }

  /**
   * Get recent logs for an application.
   * @param {string} appName
   * @param {number} limit
   */
  async findByApp(appName, limit = 50) {
    const col = await this._col();
    return col.find({ appName }).sort({ timestamp: -1 }).limit(limit).toArray();
  }

  /**
   * Get logs by severity level.
   * @param {string} level - 'info' | 'warn' | 'error' | 'debug'
   * @param {number} limit
   */
  async findByLevel(level, limit = 100) {
    const col = await this._col();
    return col.find({ level }).sort({ timestamp: -1 }).limit(limit).toArray();
  }

  /**
   * Get all error logs (admin monitoring).
   * @param {number} limit
   */
  async findErrors(limit = 100) {
    return this.findByLevel('error', limit);
  }

  /**
   * Get the most recent logs across all applications.
   * @param {number} limit
   */
  async listRecent(limit = 100) {
    const col = await this._col();
    return col.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
  }

  /**
   * Get logs within a time range.
   * @param {Date} from
   * @param {Date} to
   * @param {string} [appName]
   */
  async findByTimeRange(from, to, appName = null) {
    const col = await this._col();
    const filter = { timestamp: { $gte: from, $lte: to } };
    if (appName) filter.appName = appName;
    return col.find(filter).sort({ timestamp: 1 }).toArray();
  }

  /**
   * Delete logs older than a given date (log rotation).
   * @param {Date} before
   * @returns {number} count of deleted entries
   */
  async deleteOlderThan(before) {
    const col = await this._col();
    const result = await col.deleteMany({ timestamp: { $lt: before } });
    return result.deletedCount;
  }
}

module.exports = new LogRepository();
