# ToDos

## Development environment

- [x] Local docker-compose
- [x] Build docker-compose

## Kubernetes

- [ ] Write kubernetes manifest using [cdk8s](https://cdk8s.io/)

## CI / CD build pipeline

- [ ] Run unit tests
- [ ] Build docker images
- [ ] Push to registry
- [ ] Build k8s manifests
- [ ] Apply k8s manifests

## Stream receiver

- [x] HTTP Server
- [x] Validate auth token & scope
- [x] Receive incoming traffic and respond with HTTP 200 OK
- [x] Pipe data into Kafka

## Finite State Machine

- [ ] Analyze data stream in Kafka
- [ ] Construct a possible data type for GSI data
- [ ] Create FSM
  - [ ] Detect a new game
  - [ ] Detect if player is participating in game
  - [ ] Detect a game finishing and store player placement

## Backend

- [ ] Authentication / Login
  - [ ] Permission scopes
- [ ] Fetch current game state
- [ ] Push current game state
- [ ] Reset FSM / send commands to FSM

## Frontend

- [ ] Game session placing result (used in OBS web browser source)

## State Persistor

- [ ] Detect game finish and store player placement
