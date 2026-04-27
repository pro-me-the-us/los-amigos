# Graph Report - C:\SEM_6\SE_project\branched\los-amigos  (2026-04-21)

## Corpus Check
- 32 files · ~89,333 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 144 nodes · 242 edges · 18 communities detected
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `DeploymentRepository` - 13 edges
2. `LogRepository` - 13 edges
3. `test()` - 10 edges
4. `main()` - 10 edges
5. `VersionRepository` - 10 edges
6. `BusinessLogicLayer` - 10 edges
7. `migrateLegacyStateToMongo()` - 10 edges
8. `getDb()` - 6 edges
9. `StableVersionRepository` - 6 edges
10. `requireString()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `test()` --calls--> `disconnect()`  [INFERRED]
  C:\SEM_6\SE_project\branched\los-amigos\test-dal.js → C:\SEM_6\SE_project\branched\los-amigos\argus-src\dal\db\connection.js
- `initializeDatabase()` --calls--> `startServer()`  [INFERRED]
  C:\SEM_6\SE_project\branched\los-amigos\argus-src\dal\db\init.js → C:\SEM_6\SE_project\branched\los-amigos\argus-src\src\server.js
- `createApp()` --calls--> `withServer()`  [INFERRED]
  C:\SEM_6\SE_project\branched\los-amigos\argus-src\src\app.js → C:\SEM_6\SE_project\branched\los-amigos\argus-src\tests\run-tests.js
- `startServer()` --calls--> `migrateLegacyStateToMongo()`  [INFERRED]
  C:\SEM_6\SE_project\branched\los-amigos\argus-src\src\server.js → C:\SEM_6\SE_project\branched\los-amigos\argus-src\src\services\stateService.js
- `test()` --calls--> `connect()`  [INFERRED]
  C:\SEM_6\SE_project\branched\los-amigos\test-dal.js → C:\SEM_6\SE_project\branched\los-amigos\argus-src\dal\db\connection.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (8): addDeployment(), getLastStableVersion(), getVersions(), migrateLegacyStateToMongo(), normalizeDeploymentStatus(), readLegacyState(), toDate(), VersionRepository

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (7): run(), testBusinessModules(), testPresentationInteractions(), withServer(), BusinessLogicLayer, requireString(), ValidationError

### Community 2 - "Community 2"
Cohesion: 0.2
Nodes (6): connect(), disconnect(), getDb(), initializeDatabase(), StableVersionRepository, test()

### Community 3 - "Community 3"
Cohesion: 0.26
Nodes (1): DeploymentRepository

### Community 4 - "Community 4"
Cohesion: 0.24
Nodes (2): LogRepository, getLogs()

### Community 5 - "Community 5"
Cohesion: 0.27
Nodes (10): handleDeployApp(), handleShowInteractions(), main(), parseArgs(), parseFlagArgs(), runDemo(), showHelp(), coloured() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (6): DeploymentManagementService, pullImage(), runContainer(), stopAndRemove(), RollbackService, addVersion()

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (4): runDemo(), DeploymentAnalysisService, checkTCP(), HealthCheckService

### Community 8 - "Community 8"
Cohesion: 0.31
Nodes (3): FailureDetectionService, LogService, appendLog()

### Community 9 - "Community 9"
Cohesion: 0.4
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (2): createApp(), startServer()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 11`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `docs.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `scripts.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `businessModules.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `integration.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `unit.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `test()` connect `Community 2` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `startServer()` connect `Community 10` to `Community 0`, `Community 2`, `Community 5`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Community 2` to `Community 0`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `test()` (e.g. with `connect()` and `initializeDatabase()`) actually correct?**
  _`test()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `main()` (e.g. with `.error()` and `showLogs()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._