# Backend

The backend service is the backend for Fortify's website and is a [GraphQL](https://graphql.org/) API.
The GraphQL API is built on top of [Apollo](https://www.apollographql.com/) and has a (dynamically mapped GraphQL to) REST API for third parties (based on [Sofa API](https://sofa-api.com/)).

It's main purpose is dealing with authentication, authorization, access control rules, handling communication with databases and forwarding Pub/Sub messages.

## Production Endpoints

- [GraphQL API](https://api.fortify.gg/graphql)
- [Rest API docs](https://api.fortify.gg/docs/)
- [Rest API](https://api.fortify.gg/api/)

## Setup

### Nodejs installation

The backend is written in TypeScript, which requires a local Node.js development environment.

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

Local development endpoints:

- [http://localhost:8080/graphql](http://localhost:8080/graphql)
- [http://localhost:8080/docs/](http://localhost:8080/docs/)
- [http://localhost:8080/api/](http://localhost:8080/api/)

The service's sources are located in the `./src` folder.

The backend heavily relies on code generation by [graphql-codegen](https://graphql-code-generator.com/). This enables one to write the GraphQL schema in DSL generate the Apollo ResolverTypes, resulting in strictly typed resolvers and function invocations.

To invoke the resolver type code generation, run:

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

- Has no linting errors using:

  ```bash
  npm run check
  ```

- The package.json version has been increased according to [SemVer](https://semver.org/).
