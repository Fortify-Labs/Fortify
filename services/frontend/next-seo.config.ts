import { DefaultSeoProps } from "next-seo";

const { NEXT_PUBLIC_URL } = process.env;

export default {
	openGraph: {
		type: "website",
		locale: "en_US",
		site_name: "Fortify",
		images: [
			{
				url: `${NEXT_PUBLIC_URL}/favicon.ico`,
			},
		],
	},
} as DefaultSeoProps;
