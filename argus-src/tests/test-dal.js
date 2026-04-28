require('dotenv').config();

const {
  connect,
  initializeDatabase,
  DeploymentRepository,
  VersionRepository,
  StableVersionRepository,
  LogRepository,
  disconnect
} = require('./argus-src/dal');

async function test() {
  await connect();
  await initializeDatabase();

  const versionId = await VersionRepository.create({
    appName: 'hosting-app',
    version: '2.0.0',
    imageTag: 'hosting-app:2.0.0',
    commitHash: 'def5678',
    description: 'Second release'
  });
  console.log(' Version registered:', versionId);

  const deploymentId = await DeploymentRepository.create({
    appName: 'hosting-app',
    version: '2.0.0',
    imageTag: 'hosting-app:2.0.0',
    deployedBy: 'dev@losamigos.com',
    status: 'running'
  });
  console.log(' Deployment created:', deploymentId);

  await DeploymentRepository.markSuccess(deploymentId, 'container_xyz999');
  console.log(' Deployment marked as success');

  await StableVersionRepository.setStable({
    appName: 'hosting-app',
    version: '2.0.0',
    imageTag: 'hosting-app:2.0.0',
    deploymentId: deploymentId
  });
  console.log(' Stable version set');

  await LogRepository.create({
    level: 'info',
    message: 'Deployment successful and marked stable',
    appName: 'hosting-app',
    deploymentId: deploymentId,
    service: 'DeploymentService'
  });
  console.log(' Log entry saved');

  const stable = await StableVersionRepository.getStable('hosting-app');
  console.log(' Stable version fetched:', stable.version);

  const history = await DeploymentRepository.findByApp('hosting-app');
  console.log(' Deployment history count:', history.length);

  const versions = await VersionRepository.findAllByApp('hosting-app');
  console.log(' Versions registered:', versions.length);

  await disconnect();
  console.log('\n🎉 ALL 4 collections populated successfully!');
}

test().catch(console.error);