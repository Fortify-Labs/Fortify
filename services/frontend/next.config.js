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
		NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
	},
};
