# Historization

The historization service is responsible for handling writing operations (and thus making historic records) to all data stores (e.g. Postgres, Redis, Influx).

## Setup

### Nodejs installation

Historization is written in TypeScript, which requires a local Node.js development environment.

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
