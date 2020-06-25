import * as dotenv from "dotenv";
dotenv.config();
import debug = require("debug");

import { Client, Options } from "tmi.js";
import {
	getSteamID,
	getFSP,
	getPlayerName,
	getPlayerMMR,
	getPlayerRank,
	getGameMode,
	getAverageMMR,
} from "./extractor";

(async () => {
	const options: Options = {
		channels: [process.env.CHANNEL_NAME ?? "greycodes"],
		connection: {
			reconnect: true,
			secure: true,
		},
		identity: {
			username: process.env.BOT_USERNAME,
			password: process.env.OAUTH_TOKEN,
		},
	};

	const client = Client(options);

	client.on("message", async (channel, tags, message, self) => {
		// Ignore echoed messages.
		if (self) return;

		if (message.toLowerCase() === "!np") {
			const channelSteamID = await getSteamID(channel);

			// Fetch fortify player state by steamid
			const fsp = await getFSP(channelSteamID);

			// TODO: Refactor the following to be more efficient when querying data from postgres

			const gameMode = getGameMode(fsp);
			const averageMMR = getAverageMMR(fsp);

			let response = `${gameMode} [${averageMMR} avg MMR]`;

			response += ": ";

			for (const player of Object.values(fsp.lobby.players)) {
				try {
					const playerName = getPlayerName(player);
					const playerRank = getPlayerRank(player);
					const playerMMR = getPlayerMMR(player);

					response += `${playerName} [Rank: ${playerRank}, MMR: ${playerMMR}], `;
				} catch (e) {
					continue;
				}
			}
			response = response.slice(0, -2);

			client.say(channel, response);
		}
	});

	const connected = await client.connect();

	debug("app::main")("Twitch bot connected");
	debug("app::main")(connected);
})().catch(debug("app::main"));
