import debug from "debug";
import { injectable } from "inversify";

import {
	Kafka,
	ConsumerConfig,
	ProducerConfig,
	ConsumerHeartbeatEvent,
} from "kafkajs";
import { HealthCheckable } from "../services/healthCheck";

const { KAFKA_CLIENT_ID, KAFKA_BROKERS } = process.env;

@injectable()
export class KafkaConnector implements HealthCheckable {
	public kafka: Kafka;

	name = "Kafka";
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<void>;

	private sessionTimeout = 30000;

	constructor() {
		this.kafka = new Kafka({
			brokers: JSON.parse(KAFKA_BROKERS ?? "null") ?? ["kafka:9092"],
			clientId: KAFKA_CLIENT_ID,
		});

		// Health check setup

		const consumer = this.consumer({
			groupId: "healthcheck",
			sessionTimeout: this.sessionTimeout,
		});
		consumer.run().catch(debug("app::kafka::healthCheck"));

		let lastHeartbeat = 0;
		consumer.on(
			"consumer.heartbeat",
			({ timestamp }: ConsumerHeartbeatEvent) =>
				(lastHeartbeat = timestamp),
		);

		this.healthCheck = async () => {
			// Consumer has heartbeat within the session timeout,
			// so it is healthy
			if (Date.now() - lastHeartbeat < this.sessionTimeout) {
				return true;
			}

			// Consumer has not heartbeat, but maybe it's because the group is currently rebalancing
			try {
				const { state } = await consumer.describeGroup();

				return ["CompletingRebalance", "PreparingRebalance"].includes(
					state,
				);
			} catch (e) {
				return false;
			}
		};

		this.shutdown = async () => consumer.disconnect();
	}

	public producer(config?: ProducerConfig) {
		return this.kafka.producer(config);
	}

	public consumer(config?: ConsumerConfig) {
		return this.kafka.consumer(config);
	}
}
