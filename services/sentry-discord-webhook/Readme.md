# Sentry-discord-webhook

The sentry discord webhook service is a micro-service responsible for forwarding metric and issue alerts from Sentry.io to discord.

At the time of creating this service, Sentry.io does not offer a native integration into discord, thus a custom webhook extension has been created on Sentry, which is then alert this service in case of notifications.

## Setup

### Go Installation

This service is written in [Go](https://golang.org/). Please install the golang compiler from their website: [https://golang.org/](https://golang.org/).

Please also install a version of `make` on your system.

### Environment Variables

In order to prevent environment variables containing potential dev secrets or tokens from leaking, a dot env file is used for local development.

Copy the .env.example file in place and rename the newly created file to .env

### Installing dependencies

As this service is using Go modules, one can install all dependencies using:

```shell
go get ./...
```

### Development

In order to start the service locally, run:

```shell
make run
```

### Before committing

Before committing changes make sure that your code:

- Can successfully compile using:

  ```bash
    make
  ```

- The version in the `"version"` file has been increased according to [SemVer](https://semver.org/).
