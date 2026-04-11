const { connect } = require('./connection');

/**
 * Creates all collections with schema validation and indexes.
 * Equivalent to creating "tables" in MongoDB.
 */
async function initializeDatabase() {
  const db = await connect();

  // ─────────────────────────────────────────────
  // 1. DEPLOYMENTS COLLECTION
  // ─────────────────────────────────────────────
  await db.createCollection('deployments', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['appName', 'version', 'status', 'createdAt'],
        properties: {
          appName:     { bsonType: 'string',   description: 'Application name - required' },
          version:     { bsonType: 'string',   description: 'Docker image version tag - required' },
          imageTag:    { bsonType: 'string',   description: 'Full Docker image tag' },
          status:      {
            bsonType: 'string',
            enum: ['pending', 'running', 'success', 'failed', 'rolled_back'],
            description: 'Deployment status'
          },
          containerId: { bsonType: 'string',   description: 'Docker container ID' },
          deployedBy:  { bsonType: 'string',   description: 'User who triggered deployment' },
          createdAt:   { bsonType: 'date',     description: 'Deployment start time' },
          completedAt: { bsonType: 'date',     description: 'Deployment end time' },
          errorMessage:{ bsonType: 'string',   description: 'Error if deployment failed' }
        }
      }
    }
  }).catch(e => { if (e.codeName !== 'NamespaceExists') throw e; });

  await db.collection('deployments').createIndexes([
    { key: { appName: 1, createdAt: -1 } },
    { key: { status: 1 } },
    { key: { version: 1 } }
  ]);

  // ─────────────────────────────────────────────
  // 2. APPLICATION VERSIONS COLLECTION
  // ─────────────────────────────────────────────
  await db.createCollection('application_versions', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['appName', 'version', 'imageTag', 'createdAt'],
        properties: {
          appName:     { bsonType: 'string', description: 'Application name - required' },
          version:     { bsonType: 'string', description: 'Semantic version e.g. 1.0.3 - required' },
          imageTag:    { bsonType: 'string', description: 'Docker image tag - required' },
          commitHash:  { bsonType: 'string', description: 'Git commit hash' },
          description: { bsonType: 'string', description: 'Version changelog / description' },
          createdAt:   { bsonType: 'date',   description: 'When the version was registered' }
        }
      }
    }
  }).catch(e => { if (e.codeName !== 'NamespaceExists') throw e; });

  await db.collection('application_versions').createIndexes([
    { key: { appName: 1, version: -1 } },
    { key: { appName: 1, imageTag: 1 }, unique: true }
  ]);

  // ─────────────────────────────────────────────
  // 3. STABLE VERSIONS COLLECTION
  // ─────────────────────────────────────────────
  await db.createCollection('stable_versions', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['appName', 'version', 'imageTag', 'markedAt'],
        properties: {
          appName:      { bsonType: 'string', description: 'Application name - required' },
          version:      { bsonType: 'string', description: 'Stable version tag - required' },
          imageTag:     { bsonType: 'string', description: 'Docker image tag - required' },
          deploymentId: { bsonType: 'string', description: 'Reference to the successful deployment' },
          markedAt:     { bsonType: 'date',   description: 'When this version was marked stable' }
        }
      }
    }
  }).catch(e => { if (e.codeName !== 'NamespaceExists') throw e; });

  // Only ONE stable version per app at any time - unique index on appName
  await db.collection('stable_versions').createIndexes([
    { key: { appName: 1 }, unique: true }
  ]);

  // ─────────────────────────────────────────────
  // 4. LOGS COLLECTION
  // ─────────────────────────────────────────────
  await db.createCollection('logs', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['level', 'message', 'timestamp'],
        properties: {
          level:        {
            bsonType: 'string',
            enum: ['info', 'warn', 'error', 'debug'],
            description: 'Log severity level - required'
          },
          message:      { bsonType: 'string', description: 'Log message - required' },
          service:      { bsonType: 'string', description: 'Service that generated the log' },
          deploymentId: { bsonType: 'string', description: 'Related deployment ID if applicable' },
          appName:      { bsonType: 'string', description: 'App name related to the log' },
          metadata:     { bsonType: 'object', description: 'Any additional structured data' },
          timestamp:    { bsonType: 'date',   description: 'When the log was created - required' }
        }
      }
    }
  }).catch(e => { if (e.codeName !== 'NamespaceExists') throw e; });

  await db.collection('logs').createIndexes([
    { key: { timestamp: -1 } },
    { key: { level: 1, timestamp: -1 } },
    { key: { deploymentId: 1 } },
    { key: { appName: 1, timestamp: -1 } }
  ]);

  console.log('[DB Init] All collections and indexes created successfully.');
}

module.exports = { initializeDatabase };
