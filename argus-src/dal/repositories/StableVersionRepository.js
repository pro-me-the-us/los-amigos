const { getDb } = require('../db/connection');

const COLLECTION = 'stable_versions';

/**
 * StableVersionRepository
 * Stores the last known stable version per application.
 * Used by RollbackService to revert to a safe state.
 * Only ONE stable version record exists per app at any time.
 */
class StableVersionRepository {
  async _col() {
    const db = await getDb();
    return db.collection(COLLECTION);
  }

  /**
   * Set or update the stable version for an application.
   * Uses upsert so it creates if not exists, updates if it does.
   * @param {Object} data - { appName, version, imageTag, deploymentId }
   * @returns {boolean} success
   */
  async setStable(data) {
    const col = await this._col();
    const result = await col.updateOne(
      { appName: data.appName },
      {
        $set: {
          version:      data.version,
          imageTag:     data.imageTag,
          deploymentId: data.deploymentId,
          markedAt:     new Date()
        }
      },
      { upsert: true }
    );
    return result.acknowledged;
  }

  /**
   * Get the current stable version for an application.
   * @param {string} appName
   */
  async getStable(appName) {
    const col = await this._col();
    return col.findOne({ appName });
  }

  /**
   * Get stable versions for all applications (admin overview).
   */
  async getAllStable() {
    const col = await this._col();
    return col.find({}).sort({ markedAt: -1 }).toArray();
  }

  /**
   * Remove the stable version entry for an application.
   * Use with caution - means no rollback target exists.
   * @param {string} appName
   */
  async removeStable(appName) {
    const col = await this._col();
    const result = await col.deleteOne({ appName });
    return result.deletedCount > 0;
  }
}

module.exports = new StableVersionRepository();
