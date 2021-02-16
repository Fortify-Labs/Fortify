# Shared Library

This is the source for Fortify's shared library.

It contains from common database connectors, to extracted game units JSON files, to GSI type definitions and all sorts of components used in multiple places.

## Setup

### Nodejs installation

As this is a TypeScript library, it requires a local Node.js development environment.

To install the latest version of Node.js head over to their [website](https://nodejs.org/), download and install the corresponding version for your operating system.

### Installing dependencies

Installing all necessary dependencies can be done using:

```bash
npm install
```

### Development

As this is a library, it cannot run as a script itself.

To check if the code compiles, run:

```bash
npm run compile
```

### Before committing

Before committing changes make sure that your code:

- Can successfully compile using:

  ```bash
  npm run compile
  ```

- The package.json version has been increased according to [SemVer](https://semver.org/).
