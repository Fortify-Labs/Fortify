import { config } from "dotenv";
config();

import * as debug from "debug";

import { verify } from "jsonwebtoken";

import { Kafka } from "kafkajs";
import { createClient } from "redis";
import { promisify } from "util";

import { Convert } from "./gsiTypes";
import { Context } from "@shared/auth";
import { FortifyPlayerState, FortifyFSMCommand } from "@shared/state";
import { publicPlayerStateReducer } from "./reducers/publicPlayerState";
import { privatePlayerStateReducer } from "./reducers/privatePlayerState";
import { commandReducer } from "./reducers/commands";

import { testing } from "@shared/index";

testing();

const {
	JWT_SECRET,
	REDIS_URL,
	KAFKA_CLIENT_ID,
	KAFKA_BROKERS,
	KAFKA_FROM_START,
} = process.env;

(async () => {
	const redis = createClient({
		url: REDIS_URL,
	});

	const getAsync = promisify(redis.get).bind(redis);
	const setAsync = promisify(redis.set).bind(redis);
	const publishAsync = promisify(redis.publish).bind(redis);

	const kafka = new Kafka({
		clientId: KAFKA_CLIENT_ID ?? "collector",
		brokers: KAFKA_BROKERS?.split(";") ?? ["kafka:9092"],
	});

	const consumer = kafka.consumer({ groupId: "fsm-group" });

	await consumer.subscribe({
		topic: "gsi",
		fromBeginning: KAFKA_FROM_START === "true" ?? false,
	});

	await consumer.subscribe({
		topic: "fsm-commands",
	});

	await consumer.run({
		autoCommit: false,
		eachMessage: async ({ message, topic }) => {
			const value = message.value.toString();

			if (topic === "fsm-commands") {
				const command: FortifyFSMCommand = JSON.parse(value);

				const rawState = await getAsync("ps_" + command.steamid);
				let state: FortifyPlayerState = rawState
					? JSON.parse(rawState)
					: new FortifyPlayerState(command.steamid);

				state = commandReducer(state, command);

				const stringifiedState = JSON.stringify(state);
				await setAsync("ps_" + command.steamid, stringifiedState);
				await publishAsync("ps_" + command.steamid, stringifiedState);
			}

			if (topic === "gsi") {
				try {
					const gsi = Convert.toLog(value);

					const jwt = verify(gsi.auth, JWT_SECRET ?? "");

					if (jwt instanceof Object) {
						const { user } = jwt as Context;

						const rawState = await getAsync("ps_" + user.id);
						let state: FortifyPlayerState = rawState
							? JSON.parse(rawState)
							: new FortifyPlayerState(user.id);

						for (const { data } of gsi.block) {
							for (const {
								public_player_state,
								private_player_state,
							} of data) {
								if (public_player_state) {
									state = publicPlayerStateReducer(
										state,
										public_player_state,
									);
								}

								if (private_player_state) {
									state = privatePlayerStateReducer(
										state,
										private_player_state,
									);
								}
							}
						}

						const stringifiedState = JSON.stringify(state);
						await setAsync("ps_" + user.id, stringifiedState);
						await publishAsync("ps_" + user.id, stringifiedState);
					}
				} catch (e) {
					debug("app::consumer:eachMessage")(e);
				}
			}
		},
	});
})().catch(debug("app::anonymous_function"));
