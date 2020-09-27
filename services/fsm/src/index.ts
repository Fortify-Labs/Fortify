import { config } from "dotenv";
config();

import debug from "debug";

import { sharedSetup } from "@shared/index";
sharedSetup();

import { container } from "./inversify.config";

import { KafkaConnector } from "@shared/connectors/kafka";

import { StateReducer } from "./definitions/stateReducer";
import { CommandReducer } from "./definitions/commandReducer";

import { verify } from "jsonwebtoken";

import { Log, PublicPlayerState, PrivatePlayerState } from "./gsiTypes";
import { Context } from "@shared/auth";

import { StateTransformationService } from "./services/stateTransformer";

import { FortifyEventTopics, FortifyEvent } from "@shared/events/events";
import { SystemEventType } from "@shared/events/systemEvents";

const {
	JWT_SECRET,
	KAFKA_FROM_START,
	KAFKA_START_OFFSET,
	KAFKA_START_OFFSET_PARTITION = "0",
	KAFKA_AUTO_COMMIT,
	KAFKA_GROUP_ID = "fsm-group",
} = process.env;

(async () => {
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
		eachMessage: async ({ message, topic }) => {
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
					const jwt = verify(gsi.auth, JWT_SECRET ?? "");

					if (jwt instanceof Object) {
						const context = jwt as Context;

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
					debug("app::consumer::eachMessage")(e);
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
})().catch(debug("app::anonymous_function"));
