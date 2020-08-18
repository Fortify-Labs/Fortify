import { DefaultSeoProps } from "next-seo";

export default {
	openGraph: {
		type: "website",
		locale: "en_US",
		site_name: "Fortify",
		images: [
			{
				url: `${process.env.NEXT_PUBLIC_URL}/favicon.ico`,
			},
		],
	},
} as DefaultSeoProps;
