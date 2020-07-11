#!/usr/bin/env sh

# Script to build all service images

export BACKEND_VERSION=`cd services/backend && node -p "require('./package.json').version"`
export FRONTEND_VERSION=`cd services/frontend && node -p "require('./package.json').version"`
export FSM_VERSION=`cd services/fsm && node -p "require('./package.json').version"`
export GSI_RECEIVER_VERSION=`cd services/gsi-receiver && node -p "require('./package.json').version"`
export TWITCHBOT_VERSION=`cd services/17kmmrbot && node -p "require('./package.json').version"`

# Fetch the pull output telling
echo "docker-compose -f build.docker-compose.yml pull --ignore-pull-failures"
export DC_PULL=$(docker-compose -f build.docker-compose.yml pull --ignore-pull-failures 2>&1)
echo -n "$DC_PULL"

# Extract the last line, telling which images need to be rebuild
export DC_BUILD=$(echo -n "${DC_PULL}" | tail -n 1 | xargs)
export REPLACE_STRING="docker-compose -f build.docker-compose.yml"
export DC_BUILD=$(echo -n "${DC_BUILD/docker-compose/$REPLACE_STRING}")

# If that line starts with docker compose, we will build and push new images
if case $DC_BUILD in "docker-compose"*) true;; *) false;; esac; then
	echo -n "$DC_BUILD"

  	export DC_BUILD_OUTPUT=$(eval $DC_BUILD 2>&1)
	echo -n "$DC_BUILD_OUTPUT"

	export DC_PUSH_OUTPUT=$(docker-compose -f build.docker-compose.yml push 2>&1)
	echo -n "$DC_PUSH_OUTPUT"
else
  echo "No new images to build"
fi
