# Vault

Fortify is using HashiCorp's Vault as a central credential and secret store.

Each service retrieves it's required secrets at run time and may only fetch secrets it's authorized to read.

## Authentication

Secrets are stored in a highly available raft storage and Vault authentication is handled by Github SSO.

Only core team members are authorized to read & write secrets.

## Structure

All secrets are stored in a KV v2 secret store located at `secrets/secret/<environment name>` (`<environment name>` to be replaced with e.g. `"prod"` / `"dev"` / `"staging"`):

- fortify.dev

  - `basicAuth`: htpasswd basic auth

- influxdb

  - `historizationToken`: Influxdb token used to write into mmr and stats buckets

- jwt

  - `jwt`: JWT secret used to sign and verify token signatures

- postgres

  - `password`: Postgres password

- sentry-webhook/\<environment name>

  - `clientSecret`: Sentry.io developer application secret
  - `discordWebhooks`: Discord webhooks to be triggered (colon separated without spaces in between)

- steamWebApi

  - `apiKey`: Steam Web API key

- twitchBot

  - `oauthToken`: OAuth token for Twitch bot account

- twitchOauth

  - `clientID`: Twitch OAuth client ID
  - `secret`: Twitch OAuth client secret
