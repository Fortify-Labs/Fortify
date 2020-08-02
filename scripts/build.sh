#!/usr/bin/env sh

# Script to build all missing service images

export BASE_VERSION=`cd services/shared && node -p "require('./package.json').version"`

export BACKEND_VERSION=`cd services/backend && node -p "require('./package.json').version"`
export FRONTEND_VERSION=`cd services/frontend && node -p "require('./package.json').version"`
export FSM_VERSION=`cd services/fsm && node -p "require('./package.json').version"`
export GSI_RECEIVER_VERSION=`cd services/gsi-receiver && node -p "require('./package.json').version"`
export TWITCHBOT_VERSION=`cd services/17kmmrbot && node -p "require('./package.json').version"`
export JOBS_VERSION=`cd services/jobs && node -p "require('./package.json').version"`
export HISTORIZATION_VERSION=`cd services/historization && node -p "require('./package.json').version"`

# Make sure that the base image exists first
echo -n "$(docker-compose -f build.docker-compose.yml pull --ignore-pull-failures base)"
echo -n "$(docker-compose -f build.docker-compose.yml build base)"
echo -n "$(docker-compose -f build.docker-compose.yml push base)"

# Pull all already existing images
echo -n "$(docker-compose -f build.docker-compose.yml pull --ignore-pull-failures)"

# Run a docker compose up & down
# This will build all missing images
echo -n "$(docker-compose -f build.docker-compose.yml up -d)"
echo -n "$(docker-compose -f build.docker-compose.yml down)"

# Push everything back to the registry
# All already existing images will be omited
echo -n "$(docker-compose -f build.docker-compose.yml push)"
