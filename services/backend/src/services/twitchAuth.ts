import { injectable, inject } from "inversify";

import { Application, Router, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";

import passport from "passport";
import { Strategy, VerifyCallback } from "passport-oauth2";

import fetch from "node-fetch";
import { verifyJWT, PermissionScope } from "@shared/auth";
import { PostgresConnector } from "@shared/connectors/postgres";
import { EventService } from "@shared/services/eventService";
import { TwitchLinkedEvent } from "@shared/events/systemEvents";
import { Secrets } from "../secrets";

const {
	TWITCH_CALLBACK_URL = "",
	TWITCH_SUCCESS_REDIRECT = "/",
	TWITCH_FAILURE_REDIRECT = "/",
} = process.env;

@injectable()
export class TwitchAuthMiddleware {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(EventService) private eventService: EventService,
		@inject(Secrets) private secrets: Secrets,
	) {}

	async applyMiddleware({ app }: { app: Application }) {
		const { twitchOauth } = this.secrets.secrets;

		Strategy.prototype.userProfile = async function (accessToken, done) {
			const options = {
				url: "https://api.twitch.tv/helix/users",
				method: "GET",
				headers: {
					"Client-ID": twitchOauth["client-id"] ?? "",
					Accept: "application/vnd.twitchtv.v5+json",
					Authorization: "Bearer " + accessToken,
				},
			};

			try {
				const response = await fetch(options.url, options);

				if (response && response.status === 200) {
					const res = await response.json();
					done(null, res);
				} else {
					const body = await response.json();
					done(JSON.parse(body));
				}
			} catch (e) {
				done(e);
			}
		};

		passport.use(
			"twitch",
			new Strategy(
				{
					authorizationURL: "https://id.twitch.tv/oauth2/authorize",
					tokenURL: "https://id.twitch.tv/oauth2/token",
					clientID: twitchOauth.clientID ?? "",
					clientSecret: twitchOauth.secret ?? "",
					callbackURL: TWITCH_CALLBACK_URL,
					passReqToCallback: true,
				},
				async (
					req: Request,
					accessToken: string,
					refreshToken: string,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					profile: any,
					done: VerifyCallback,
				) => {
					profile.accessToken = accessToken;
					profile.refreshToken = refreshToken;

					// Don't have to check for success here, as the middleware ensures that it successful already
					const { user } = await verifyJWT(req.cookies.auth, [
						PermissionScope.User,
					]);

					const userRepo = await this.postgres.getUserRepo();
					const dbUser = await userRepo.findOne(user.id);

					if (
						dbUser &&
						profile &&
						profile.data &&
						profile.data.length > 0
					) {
						dbUser.twitchRaw = profile;
						dbUser.twitchName = "#" + profile.data[0].login;
						dbUser.twitchId = profile.data[0].id;

						if (dbUser.twitchName) {
							const twitchLinkedEvent = new TwitchLinkedEvent(
								user.id,
								dbUser.twitchName,
							);
							await this.eventService.sendEvent(
								twitchLinkedEvent,
							);
						}

						await userRepo.save(dbUser);
					}

					done(null, profile);
				},
			),
		);

		passport.serializeUser((user, done) => done(null, user));
		passport.deserializeUser((user, done) => done(null, user));

		const authRouter = Router();
		authRouter.use(cookieParser());
		authRouter.use(passport.initialize());

		authRouter.get(
			"/",
			ensureAuthCookie,
			passport.authenticate("twitch", { scope: "user_read" }),
		);

		authRouter.get(
			"/return",
			ensureAuthCookie,
			passport.authenticate("twitch", {
				successRedirect: TWITCH_SUCCESS_REDIRECT,
				failureRedirect: TWITCH_FAILURE_REDIRECT,
				session: false,
			}),
		);

		app.use("/auth/twitch", authRouter);
	}
}

const ensureAuthCookie = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!req.cookies.auth) {
		return res.json({ auth: false, reason: "No auth cookie" });
	}

	try {
		const { success } = await verifyJWT(req.cookies.auth, [
			PermissionScope.User,
		]);

		if (success) {
			return next();
		} else {
			res.json({ auth: false, reason: "Auth verify failed" });
		}
	} catch {
		return res.json({ auth: false, reason: "Verify threw" });
	}
};
