import { injectable, inject } from "inversify";
import { Application, Router, Request, Response } from "express";

import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";

import { generateJWT, PermissionScope } from "@shared/auth";
import { PostgresConnector } from "@shared/connectors/postgres";
import { User } from "@shared/db/entities/user";

import { convert64to32SteamId } from "@shared/steamid";

const {
	APP_URL = "",
	APP_DOMAIN,
	APP_SUCCESSFUL_AUTH_RETURN_URL = "/",
	APP_STEAM_RETURN_URL,
	JWT_SECRET,
	STEAM_APIKEY,
} = process.env;

export interface NodeSteamPassportProfileJSON {
	steamid: string;
	communityvisibilitystate: number;
	profilestate: number;
	personaname: string;
	profileurl: string;
	avatar: string;
	avatarmedium: string;
	avatarfull: string;
	avatarhash: string;
	lastlogoff: number;
	personastate: number;
	realname: string;
	primaryclanid: string;
	timecreated: number;
	personastateflags: number;
	loccountrycode: string;
}

export interface NodeSteamPassportProfile {
	// OpenID identifier
	identifier: string;

	provider: string;

	_json: NodeSteamPassportProfileJSON;
	id: string;
	displayName: string;
	photos: { value: string }[];
}

@injectable()
export class SteamAuthMiddleware {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
	) {}

	async handleAuth(req: Request, res: Response) {
		const user = req.user as NodeSteamPassportProfile | undefined;

		if (user && JWT_SECRET) {
			// Store user to DB
			const userRepo = await this.postgres.getUserRepo();

			const steamID = convert64to32SteamId(user.id).toString();

			let dbUser = await userRepo.findOne(steamID);

			if (!dbUser) {
				dbUser = new User();

				dbUser.steamid = steamID;
				dbUser.registered = true;
			}
			dbUser.name = user.displayName;
			dbUser.profilePicture = user._json.avatarfull;

			await userRepo.save(dbUser);

			res.cookie(
				"auth",
				await generateJWT(
					{
						user: { id: dbUser.steamid },
						scopes: [PermissionScope.User],
					},
					{ expiresIn: "30 days" },
				),
				{
					expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
					domain: APP_DOMAIN,
				},
			);
		}

		res.redirect(APP_SUCCESSFUL_AUTH_RETURN_URL);
	}

	applyMiddleware({ app }: { app: Application }) {
		passport.use(
			new SteamStrategy(
				{
					apiKey: STEAM_APIKEY,
					realm: APP_URL,
					returnURL: APP_STEAM_RETURN_URL,
				},
				(
					identifier: string,
					profile: NodeSteamPassportProfile,
					done: (
						err: string | null | undefined,
						profile: NodeSteamPassportProfile,
					) => unknown,
				) => {
					profile.identifier = identifier;
					return done(null, profile);
				},
			),
		);

		const authRouter: Router = Router();
		authRouter.use(passport.initialize());
		authRouter.get("/", passport.authenticate("steam"));
		authRouter.get(
			"/return",
			passport.authenticate("steam", {
				failureRedirect: "/fail",
				session: false,
			}),
			(req, res) => this.handleAuth(req, res),
		);

		app.use("/auth/steam", authRouter);
	}
}
