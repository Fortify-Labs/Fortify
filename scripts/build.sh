#!/usr/bin/env bash

# Script to build all service images

export BACKEND_VERSION=`cd services/backend && node -p "require('./package.json').version"`
export FRONTEND_VERSION=`cd services/frontend && node -p "require('./package.json').version"`
export FSM_VERSION=`cd services/fsm && node -p "require('./package.json').version"`
export GSI_RECEIVER_VERSION=`cd services/gsi-receiver && node -p "require('./package.json').version"`
export TWITCHBOT_VERSION=`cd services/17kmmrbot && node -p "require('./package.json').version"`

# Fetch the pull output telling
export DC_PULL=$(docker-compose -f build.docker-compose.yml pull --ignore-pull-failures 2>&1)

# Extract the last line, telling which images need to be rebuild
export DC_BUILD=$(echo "${DC_PULL}" | tail -n1 | xargs)
export DC_BUILD=$(echo "${DC_BUILD/docker-compose/docker-compose -f build.docker-compose.yml}")
echo $DC_BUILD

# If that line starts with docker compose, we will build and push new images
if  [[ $DC_BUILD == docker-compose* ]]  ;
then
    eval $DC_BUILD

	docker-compose -f build.docker-compose.yml push
fi
