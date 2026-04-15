const { getDb } = require('../db/connection');
const { ObjectId } = require('mongodb');

const COLLECTION = 'deployments';

/**
 * DeploymentRepository
 * Handles all persistence operations for Deployment records.
 */
class DeploymentRepository {
  async _col() {
    const db = await getDb();
    return db.collection(COLLECTION);
  }

  /**
   * Save a new deployment record.
   * @param {Object} deploymentData
   * @returns {string} inserted document ID
   */
  async create(deploymentData) {
    const col = await this._col();
    const doc = {
      ...deploymentData,
      status: deploymentData.status || 'pending',
      createdAt: deploymentData.createdAt ? new Date(deploymentData.createdAt) : new Date()
    };
    const result = await col.insertOne(doc);
    return result.insertedId.toString();
  }

  /**
   * Find a deployment by its ID.
   * @param {string} id
   */
  async findById(id) {
    const col = await this._col();
    return col.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Get all deployments for an application, newest first.
   * @param {string} appName
   * @param {number} limit
   */
  async findByApp(appName, limit = 20) {
    const col = await this._col();
    return col.find({ appName })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get the most recent deployment for an app.
   * @param {string} appName
   */
  async findLatest(appName) {
    const col = await this._col();
    return col.findOne({ appName }, { sort: { createdAt: -1 } });
  }

  /**
   * Update a deployment's status and optional fields.
   * @param {string} id
   * @param {Object} updates  e.g. { status: 'success', containerId: '...', completedAt: new Date() }
   */
  async updateStatus(id, updates) {
    const col = await this._col();
    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Mark a deployment as failed with an error message.
   * @param {string} id
   * @param {string} errorMessage
   */
  async markFailed(id, errorMessage) {
    return this.updateStatus(id, {
      status: 'failed',
      errorMessage,
      completedAt: new Date()
    });
  }

  /**
   * Mark a deployment as successfully completed.
   * @param {string} id
   * @param {string} containerId
   */
  async markSuccess(id, containerId) {
    return this.updateStatus(id, {
      status: 'success',
      containerId,
      completedAt: new Date()
    });
  }

  /**
   * Mark a deployment as rolled back.
   * @param {string} id
   */
  async markRolledBack(id) {
    return this.updateStatus(id, {
      status: 'rolled_back',
      completedAt: new Date()
    });
  }

  /**
   * Get all failed deployments.
   */
  async findFailed() {
    const col = await this._col();
    return col.find({ status: 'failed' }).sort({ createdAt: -1 }).toArray();
  }

  /**
   * Get all deployment records across all applications.
   */
  async listAll(limit = 1000) {
    const col = await this._col();
    return col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  }

  /**
   * Delete all deployments for an app (for cleanup/testing).
   * @param {string} appName
   */
  async deleteByApp(appName) {
    const col = await this._col();
    const result = await col.deleteMany({ appName });
    return result.deletedCount;
  }
}

module.exports = new DeploymentRepository();
