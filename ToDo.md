# ToDos

## Development environment

- [x] Local docker-compose
- [x] Build docker-compose

## Kubernetes

- [x] Write kubernetes manifest using [cdk8s](https://cdk8s.io/)

## CI / CD build pipeline

- [ ] Run unit tests
- [x] Build docker images
- [x] Push to registry
- [x] Build k8s manifests
- [x] Apply k8s manifests

## Stream receiver

- [x] HTTP Server
- [x] Validate auth token & scope
- [x] Receive incoming traffic and respond with HTTP 200 OK
- [x] Pipe data into Kafka

## Finite State Machine

- [x] Analyze data stream in Kafka
- [x] Construct a possible data type for GSI data
- [x] Create FSM
  - [x] Detect a new game
  - [x] Detect if player is participating in game
  - [x] Detect a game finishing and store player placement

## Backend

- [x] Authentication / Login
  - [x] Permission scopes
- [x] Fetch current game state
- [x] Push current game state
- [x] Reset FSM / send commands to FSM

## Frontend

- [ ] Game session placing result (used in OBS web browser source)

## State Persistor

- [x] Detect game finish and store player placement
