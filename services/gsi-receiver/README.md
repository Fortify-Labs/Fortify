# GSI Receiver

The GSI receiver service is a small micro-service that is responsible for accepting GSI messages and forwarding them to a Kafka topic.

Prior to forwarding the GSI message, the service will validate supplied authorization token and extract the embedded account id, which will then be used as message key for Kafka partitioning.

## Setup

### Nodejs installation

The fsm is written in TypeScript, which requires a local Node.js development environment.

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
