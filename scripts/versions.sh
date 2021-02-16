#!/usr/bin/env bash
# Invoke using: source ./scripts/versions.sh

export BASE_VERSION=$(jq -r .version services/shared/package.json)
export BACKEND_VERSION=$(jq -r .version services/backend/package.json)
export FRONTEND_VERSION=$(jq -r .version services/frontend/package.json)
export FSM_VERSION=$(jq -r .version services/fsm/package.json)
export GSI_RECEIVER_VERSION=$(jq -r .version services/gsi-receiver/package.json)
export TWITCHBOT_VERSION=$(jq -r .version services/17kmmrbot/package.json)
export JOBS_VERSION=$(jq -r .version services/jobs/package.json)
export HISTORIZATION_VERSION=$(jq -r .version services/historization/package.json)
export SENTRY_DISCORD_WEBHOOK_VERSION=$(cat services/sentry-discord-webhook/version)
