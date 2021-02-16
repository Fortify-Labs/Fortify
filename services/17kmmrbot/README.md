# 17kmmrbot

The 17kmmrbot is Twitch chat bot, which queries information from a Redis cache & Postgres database for player and match information.

## Setup

### Nodejs installation

The bot is written in TypeScript using tmi.js, which requires a local Node.js development environment.

To install the latest version of Node.js head over to their [website](https://nodejs.org/), download and install the corresponding version for your operating system.

### Environment variables

In order to prevent environment variables containing potential dev secrets or tokens from leaking, a dot env file is used for local development.

Copy the `.env.example` file in place and rename the newly created file to `.env`

Next fill in missing values and save the file.

### Installing dependencies

Installing all necessary dependencies can be done using:

```bash
npm install
```

### Development

To start the service in development mode, please run:

```bash
npm run dev
```

The service's sources are located in the `./src` folder.

As most of this project has been developed using [VS Code](https://code.visualstudio.com/), I'm recommending to use VS Code with Fortify's recommended extensions and opening each service in an individual VS Code window.

### Before committing

Before committing changes make sure that your code:

- Can successfully compile using:

  ```bash
  npm run compile
  ```

- Has no linting errors using:

  ```bash
  npm run check
  ```

- The package.json version has been increased according to [SemVer](https://semver.org/).
