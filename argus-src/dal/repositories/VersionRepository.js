const { getDb } = require('../db/connection');
const { ObjectId } = require('mongodb');

const COLLECTION = 'application_versions';

/**
 * VersionRepository
 * Handles persistence for ApplicationVersion records.
 */
class VersionRepository {
  async _col() {
    const db = await getDb();
    return db.collection(COLLECTION);
  }

  /**
   * Register a new application version.
   * @param {Object} versionData - { appName, version, imageTag, commitHash, description }
   * @returns {string} inserted document ID
   */
  async create(versionData) {
    const col = await this._col();
    const doc = {
      ...versionData,
      createdAt: versionData.createdAt ? new Date(versionData.createdAt) : new Date()
    };
    const result = await col.insertOne(doc);
    return result.insertedId.toString();
  }

  /**
   * Find a version by its MongoDB ID.
   * @param {string} id
   */
  async findById(id) {
    const col = await this._col();
    return col.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Find a version by app name and version tag.
   * @param {string} appName
   * @param {string} version
   */
  async findByVersion(appName, version) {
    const col = await this._col();
    return col.findOne({ appName, version });
  }

  /**
   * Get all versions for an app sorted newest first.
   * @param {string} appName
   */
  async findAllByApp(appName) {
    const col = await this._col();
    return col.find({ appName }).sort({ createdAt: -1 }).toArray();
  }

  /**
   * Get the most recently registered version for an app.
   * @param {string} appName
   */
  async findLatest(appName) {
    const col = await this._col();
    return col.findOne({ appName }, { sort: { createdAt: -1 } });
  }

  /**
   * Get a specific number of recent versions.
   * @param {string} appName
   * @param {number} limit
   */
  async findRecent(appName, limit = 5) {
    const col = await this._col();
    return col.find({ appName }).sort({ createdAt: -1 }).limit(limit).toArray();
  }

  /**
   * Get all versions across all applications.
   */
  async listAll(limit = 1000) {
    const col = await this._col();
    return col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  }

  /**
   * Delete a specific version record.
   * @param {string} id
   */
  async deleteById(id) {
    const col = await this._col();
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

module.exports = new VersionRepository();
