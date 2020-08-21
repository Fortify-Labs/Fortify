module.exports = {
	webpack(config, options) {
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
		GA_TRACKING_ID: process.env.GA_TRACKING_ID,
	},
};
