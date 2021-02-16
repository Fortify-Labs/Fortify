# Frontend

The frontend is Fortify's public website, showing current matches, enhanced lord leaderboards, previous matches, rank progression, game statistic (including units, items, synergies) and more.

At it's core the frontend is a React application based on [Next.js](https://nextjs.org/) and is using [Bulma](https://bulma.io/) as a CSS framework.
Thanks to Next.js the frontend already ships a handful of optimizations, file-system based routing and server side rendering out of the box.

## Setup

### Nodejs installation

As this is a Next.js based TypeScript application, it requires a local Node.js development environment.

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

_Prior to starting the frontend make sure, that the backend is also running on your local machine. The frontend can either be started locally from it's folder or using a pre-built docker image._

To start the frontend in development mode, please run:

```bash
npm run dev
```

As this is a Next.js project, most of the folder and file structure are mandated by Next.js.

E.g. all pages are stored in `/pages`, while all public assets are stored in the `/public` folder.

Likewise the backend, the frontend is also heavily reliant on code generation by [graphql-let](https://github.com/piglovesyou/graphql-let) and [Apollo's CLI tooling](https://github.com/apollographql/apollo-tooling). Code generation is utilized to transform plaintext GraphQL queries into strictly typed query, mutation and subscription hooks for React to use.

To invoke the type / code generation, make sure the backend is running locally and run:

```bash
npm run types
```

As most of this project has been developed using [VS Code](https://code.visualstudio.com/), I'm recommending to use VS Code with Fortify's recommended extensions and opening each service in an individual VS Code window.

### Before committing

Before committing changes make sure that your code:

- Can successfully compile using:

  ```bash
  npm run compile
  ```

- The package.json version has been increased according to [SemVer](https://semver.org/).
