#!/usr/bin/env sh

# Script to build all missing service images

export BASE_VERSION=`cd services/shared && node -p "require('./package.json').version"`

export BACKEND_VERSION=`cd services/backend && node -p "require('./package.json').version"`
export FRONTEND_VERSION=`cd services/frontend && node -p "require('./package.json').version"`
export FSM_VERSION=`cd services/fsm && node -p "require('./package.json').version"`
export GSI_RECEIVER_VERSION=`cd services/gsi-receiver && node -p "require('./package.json').version"`
export TWITCHBOT_VERSION=`cd services/17kmmrbot && node -p "require('./package.json').version"`
export JOBS_VERSION=`cd services/jobs && node -p "require('./package.json').version"`

# Build the base image
export DC_PULL_BASE=$(docker-compose -f build.docker-compose.yml pull --ignore-pull-failures base 2>&1)
echo -n "$DC_PULL_BASE"
echo ""
export DC_BUILD_BASE=$(docker-compose -f build.docker-compose.yml build base 2>&1)
echo -n "$DC_BUILD_BASE"
echo ""
export DC_PUSH_BASE=$(docker-compose -f build.docker-compose.yml push base 2>&1)
echo -n "$DC_PUSH_BASE"
echo ""

# Fetch the pull output
echo "docker-compose -f build.docker-compose.yml pull --ignore-pull-failures"
export DC_PULL=$(docker-compose -f build.docker-compose.yml pull --ignore-pull-failures 2>&1)
echo -n "$DC_PULL"
echo ""

# Extract the last line, telling which images need to be rebuild
export DC_BUILD=$(echo -n "${DC_PULL}" | tail -n 1 | xargs)
# Add build arg containing the base image version
export REPLACE_STRING_BASE_VERSION="build --build-arg BASE_VERSION=$BASE_VERSION"
export DC_BUILD=$(echo -n "${DC_BUILD/build/$REPLACE_STRING_BASE_VERSION}")
# Add the -f flag to use the build docker compose file
export REPLACE_STRING="docker-compose -f build.docker-compose.yml"
export DC_BUILD=$(echo -n "${DC_BUILD/docker-compose/$REPLACE_STRING}")

# If that line starts with docker compose, we will build and push new images
if case $DC_BUILD in "docker-compose"*) true;; *) false;; esac; then
	echo -n "$DC_BUILD"
	echo ""

  	export DC_BUILD_OUTPUT=$(eval $DC_BUILD 2>&1)
	echo -n "$DC_BUILD_OUTPUT"
	echo ""

	export DC_PUSH_OUTPUT=$(docker-compose -f build.docker-compose.yml push 2>&1)
	echo -n "$DC_PUSH_OUTPUT"
	echo ""
else
  echo "No new images to build"
fi
