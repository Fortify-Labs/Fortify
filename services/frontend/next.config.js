const packageJSON = require("./package.json");

const withSourceMaps = require("@zeit/next-source-maps")();

// Use the SentryWebpack plugin to upload the source maps during build step
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

const {
	NEXT_PUBLIC_SENTRY_DSN: SENTRY_DSN,
	SENTRY_ORG,
	SENTRY_PROJECT,
	SENTRY_AUTH_TOKEN,
	NODE_ENV,
} = process.env;

process.env.SENTRY_DSN = SENTRY_DSN;

module.exports = withSourceMaps({
	serverRuntimeConfig: {
		rootDir: __dirname,
	},
	webpack(config, options) {
		if (!options.isServer) {
			config.resolve.alias["@sentry/node"] = "@sentry/browser";
		}

		if (
			SENTRY_DSN &&
			SENTRY_ORG &&
			SENTRY_PROJECT &&
			SENTRY_AUTH_TOKEN &&
			NODE_ENV === "production"
		) {
			config.plugins.push(
				new SentryWebpackPlugin({
					include: ".next",
					ignore: ["node_modules"],
					stripPrefix: ["webpack://_N_E/"],
					urlPrefix: `~/_next`,
					release: packageJSON.version,
				}),
			);
		}

		config.module.rules.push({
			test: /\.(graphql|gql)$/,
			exclude: /node_modules/,
			use: [options.defaultLoaders.babel, { loader: "graphql-let/loader" }],
		});

		return config;
	},
	experimental: {
		plugins: true,
	},
	env: {
		NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
	},
});
