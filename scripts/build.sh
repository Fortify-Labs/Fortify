#!/usr/bin/env bash

# Script to build all service images

export BACKEND_VERSION=`cd services/backend && node -p "require('./package.json').version"`
export FRONTEND_VERSION=`cd services/frontend && node -p "require('./package.json').version"`
export FSM_VERSION=`cd services/fsm && node -p "require('./package.json').version"`
export GSI_RECEIVER_VERSION=`cd services/gsi-receiver && node -p "require('./package.json').version"`
export TWITCHBOT_VERSION=`cd services/17kmmrbot && node -p "require('./package.json').version"`

docker-compose -f build.docker-compose.yml pull
docker-compose -f build.docker-compose.yml build --parallel
docker-compose -f build.docker-compose.yml push
