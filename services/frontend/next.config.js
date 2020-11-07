const packageJSON = require("./package.json");

const withSourceMaps = require("@zeit/next-source-maps")();

// Use the SentryWebpack plugin to upload the source maps during build step
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const withTM = require("next-transpile-modules")(["util"]);

const {
	NEXT_PUBLIC_SENTRY_DSN: SENTRY_DSN,
	SENTRY_ORG,
	SENTRY_PROJECT,
	SENTRY_AUTH_TOKEN,
	NODE_ENV,
} = process.env;

process.env.SENTRY_DSN = SENTRY_DSN;

const nextConfig = {
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

		config.resolve.plugins = [
			new TsconfigPathsPlugin(),
			...config.resolve.plugins,
		];

		return config;
	},
	experimental: {
		plugins: true,
	},
	env: {
		NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
	},
};

module.exports = withSourceMaps(withTM(nextConfig));
