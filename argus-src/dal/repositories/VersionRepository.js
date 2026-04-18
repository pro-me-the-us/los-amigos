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
   * Register an application version.
   * Idempotent for the same appName + imageTag pair.
   * @param {Object} versionData - { appName, version, imageTag, commitHash, description }
   * @returns {string} document ID
   */
  async create(versionData) {
    const col = await this._col();
    const createdAt = versionData.createdAt ? new Date(versionData.createdAt) : new Date();
    const filter = {
      appName: versionData.appName,
      imageTag: versionData.imageTag
    };

    const setOnInsert = {
      appName: versionData.appName,
      version: versionData.version,
      imageTag: versionData.imageTag,
      createdAt
    };

    // Keep latest metadata on repeated deploys of the same image tag,
    // but never downgrade a previously stable version to unstable.
    const set = {};
    if (versionData.deploymentId !== undefined) {
      set.deploymentId = versionData.deploymentId;
    }
    if (versionData.commitHash !== undefined) {
      set.commitHash = versionData.commitHash;
    }
    if (versionData.description !== undefined) {
      set.description = versionData.description;
    }
    if (versionData.stable === true) {
      set.stable = true;
    }

    const update = { $setOnInsert: setOnInsert };
    if (Object.keys(set).length > 0) {
      update.$set = set;
    }

    const result = await col.updateOne(filter, update, { upsert: true });
    if (result.upsertedId) {
      return result.upsertedId.toString();
    }

    const existing = await col.findOne(filter, { projection: { _id: 1 } });
    if (!existing) {
      throw new Error('Failed to read version document after upsert.');
    }

    return existing._id.toString();
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
