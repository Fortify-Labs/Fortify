import { inject, injectable } from "inversify";

import {
	Kafka,
	ConsumerConfig,
	ProducerConfig,
	ConsumerHeartbeatEvent,
	logLevel,
} from "kafkajs";
import { Connector } from "../definitions/connector";
import winston from "winston";
import { Logging } from "../logging";
import { HealthCheckable } from "../services/healthCheck";

const { KAFKA_CLIENT_ID, KAFKA_BROKERS } = process.env;

@injectable()
export class KafkaConnector implements HealthCheckable, Connector {
	private _kafka?: Kafka;
	public logger: winston.Logger;

	name = "Kafka";
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<unknown>;

	private sessionTimeout = 30000;

	constructor(@inject(Logging) public logging: Logging) {
		this.logger = logging.createLogger();

		// Health check setup
		this.healthCheck = async () => {
			return false;
		};
		this.shutdown = async () => {};
	}
	async connect() {
		this._kafka = new Kafka({
			brokers: JSON.parse(KAFKA_BROKERS ?? '["kafka:9092"]'),
			clientId: KAFKA_CLIENT_ID,
			logCreator: () => ({ namespace, level, log }) => {
				const { message, timestamp, ...extra } = log;

				this.logger.log({
					level: toWinstonLogLevel(level),
					message,
					"@timestamp": timestamp,
					extra,
					namespace,
				});
			},
		});
	}

	get kafka(): Kafka {
		if (!this._kafka) {
			throw new Error("Not connected to Kafka");
		}

		return this._kafka;
	}

	public async setupHealthCheck() {
		const consumer = this.consumer({
			groupId: "healthcheck",
			sessionTimeout: this.sessionTimeout,
		});
		await consumer
			.run()
			.catch(
				(e) =>
					this.logger.error("Kafka health check failed", { e }) &&
					this.logger.error(e),
			);

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

		this.shutdown = async () => {
			await consumer.stop();
			await consumer.disconnect();
		};
	}

	public producer(config?: ProducerConfig) {
		return this.kafka.producer(config);
	}

	public consumer(config?: ConsumerConfig) {
		return this.kafka.consumer(config);
	}
}

const toWinstonLogLevel = (level: logLevel) => {
	switch (level) {
		case logLevel.ERROR:
		case logLevel.NOTHING:
			return "error";
		case logLevel.WARN:
			return "warn";
		case logLevel.INFO:
			return "info";
		case logLevel.DEBUG:
			return "debug";
	}
};
