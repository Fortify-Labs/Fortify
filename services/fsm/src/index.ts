import { config } from "dotenv";
config();

import debug from "debug";

import { sharedSetup } from "@shared/index";
global.__rootdir__ = __dirname || process.cwd();
sharedSetup();

import { captureException, flush } from "@sentry/node";

import { container } from "./inversify.config";

import { KafkaConnector } from "@shared/connectors/kafka";

import { StateReducer } from "./definitions/stateReducer";
import { CommandReducer } from "./definitions/commandReducer";

import { verify } from "jsonwebtoken";

import { Log, PublicPlayerState, PrivatePlayerState } from "./gsiTypes";
import { Context } from "@shared/services/auth";

import { StateTransformationService } from "./services/stateTransformer";

import { FortifyEventTopics, FortifyEvent } from "@shared/events/events";
import { SystemEventType } from "@shared/events/systemEvents";
import { ConsumerCrashEvent } from "kafkajs";
import { Secrets } from "./secrets";

const {
	KAFKA_FROM_START,
	KAFKA_START_OFFSET,
	KAFKA_START_OFFSET_PARTITION = "0",
	KAFKA_AUTO_COMMIT,
	KAFKA_GROUP_ID = "fsm-group",
} = process.env;

(async () => {
	const {
		jwt: { jwt },
	} = await container.get(Secrets).getSecrets();

	const kafka = container.get(KafkaConnector);

	// Get state transformer service
	const stateTransformer = container.get(StateTransformationService);

	// Get all reducers
	const commandReducers = container.getAll<CommandReducer>("command");
	const publicStateReducers = container.getAll<
		StateReducer<PublicPlayerState>
	>("public");
	const privateStateReducers = container.getAll<
		StateReducer<PrivatePlayerState>
	>("private");

	const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

	await consumer.subscribe({
		fromBeginning: KAFKA_FROM_START === "true" ?? false,
		topic: "gsi",
	});

	await consumer.subscribe({
		topic: FortifyEventTopics.SYSTEM,
	});

	consumer.run({
		autoCommit: KAFKA_AUTO_COMMIT !== "false" ?? true,
		eachMessage: async ({ message, topic, partition }) => {
			if (!message.value) {
				return;
			}

			const value = message.value.toString();

			if (topic === FortifyEventTopics.SYSTEM) {
				const event: FortifyEvent<SystemEventType> = JSON.parse(value);
				const steamid = event["steamid"] as string | null;

				if (steamid) {
					let state = await stateTransformer.loadState(steamid);

					for (const commandReducer of commandReducers) {
						state = await commandReducer.processor(state, event);
					}

					await stateTransformer.saveState(state, steamid);
				}
			}

			if (topic === "gsi") {
				try {
					const gsi: Log = JSON.parse(value);
					const ctx =
						typeof gsi.auth === "string"
							? verify(gsi.auth, jwt ?? "")
							: gsi.auth;

					if (ctx instanceof Object) {
						const context = ctx as Context;

						let state = await stateTransformer.loadState(
							context.user.id,
						);

						for (const { data } of gsi.block) {
							for (const {
								public_player_state,
								private_player_state,
							} of data) {
								if (public_player_state) {
									for (const reducer of publicStateReducers) {
										try {
											state = await reducer.processor(
												state,
												context,
												public_player_state,
												gsi.timestamp,
											);
										} catch (e) {
											debug(
												"app::consumer::public_player_state",
											)(e);
											captureException(e, {
												contexts: {
													reducer: {
														name: reducer.name,
														type:
															"public_player_state",
													},
													message,
												},
												user: {
													id: context.user.id,
												},
											});
										}
									}
								}

								if (private_player_state) {
									for (const reducer of privateStateReducers) {
										try {
											state = await reducer.processor(
												state,
												context,
												private_player_state,
												gsi.timestamp,
											);
										} catch (e) {
											debug(
												"app::consumer::private_player_state",
											)(e);
											captureException(e, {
												contexts: {
													reducer: {
														name: reducer.name,
														type:
															"private_player_state",
													},
													message,
												},
												user: {
													id: context.user.id,
												},
											});
										}
									}
								}
							}
						}

						await stateTransformer.saveState(
							state,
							context.user.id,
						);
					}
				} catch (e) {
					debug("app::consumer::run")(e);
					const exceptionID = captureException(e, {
						contexts: {
							kafka: {
								topic,
								partition,
								message: JSON.stringify(message, null, 2),
							},
						},
					});
					debug("app::consumer::run")(exceptionID);
					throw e;
				}
			}
		},
	});

	if (KAFKA_START_OFFSET) {
		consumer.seek({
			offset: KAFKA_START_OFFSET,
			partition: parseInt(KAFKA_START_OFFSET_PARTITION),
			topic: "gsi",
		});
	}

	consumer.on("consumer.disconnect", () => {
		debug("app::kafka::consumer.disconnect")("Consumer disconnected");
		// const sentryID = captureMessage("Consumer disconnected");
		// debug("app::kafka::consumer.disconnect")(sentryID);
	});
	consumer.on("consumer.connect", () => {
		debug("app::kafka::consumer.connect")("Consumer connected");
		// const sentryID = captureMessage("Consumer connected");
		// debug("app::kafka::consumer.connect")(sentryID);
	});
	consumer.on("consumer.crash", async (crashEvent: ConsumerCrashEvent) => {
		debug("app::kafka::consumer.crash")(crashEvent);
		const sentryID = captureException(crashEvent.payload.error, {
			extra: {
				groupId: crashEvent.payload.groupId,
			},
		});
		debug("app::kafka::consumer.crash")(sentryID);
		try {
			await flush();
		} finally {
			// eslint-disable-next-line no-process-exit
			process.exit(-1);
		}
	});
})().catch((e) => {
	debug("app::anonymous_function")(e);
	captureException(e);

	// eslint-disable-next-line no-process-exit
	process.exit(-1);
});
