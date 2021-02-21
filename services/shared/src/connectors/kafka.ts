import { inject, injectable } from "inversify";

import {
	Kafka,
	ConsumerConfig,
	ProducerConfig,
	ConsumerHeartbeatEvent,
	logLevel,
	ICustomPartitioner,
	PartitionerArgs,
	Consumer,
} from "kafkajs";
import { Connector } from "../definitions/connector";
import { Logger } from "../logger";
import { HealthCheckable } from "../services/healthCheck";

const { KAFKA_CLIENT_ID, KAFKA_BROKERS } = process.env;

@injectable()
export class KafkaConnector implements HealthCheckable, Connector {
	private _kafka?: Kafka;

	name = "Kafka";
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<unknown>;

	consumers: Consumer[];

	private sessionTimeout = 30000;

	constructor(@inject(Logger) public logger: Logger) {
		// Health check setup
		this.healthCheck = async () => {
			return false;
		};
		this.shutdown = async () => {};

		this.consumers = [];
	}
	async connect() {
		this._kafka = new Kafka({
			brokers: JSON.parse(KAFKA_BROKERS ?? '["kafka:9092"]'),
			clientId: KAFKA_CLIENT_ID,
			logCreator: () => ({ namespace, level, log }) => {
				const { message, timestamp, ...extra } = log;

				let winstonLevel = toWinstonLogLevel(level);

				if (
					extra.error ===
					"The group is rebalancing, so a rejoin is needed"
				) {
					winstonLevel = "info";
				}

				if (
					message.startsWith("Consumer has joined the group") ||
					message.startsWith("The group is rebalancing") ||
					message.startsWith("Response Heartbeat")
				) {
					//
					winstonLevel = "debug";
				}

				this.logger.log({
					level: winstonLevel,
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
		let lastHeartbeat = 0;

		for (const consumer of this.consumers) {
			consumer.on(
				"consumer.heartbeat",
				({ timestamp }: ConsumerHeartbeatEvent) =>
					(lastHeartbeat = timestamp),
			);
		}

		this.healthCheck = async () => {
			// Consumer has heartbeat within the session timeout,
			// so it is healthy
			if (Date.now() - lastHeartbeat < this.sessionTimeout) {
				return true;
			}

			// Consumer has not heartbeat, but maybe it's because the group is currently rebalancing
			try {
				const groups = await Promise.all(
					this.consumers.map((consumer) => consumer.describeGroup()),
				);

				const rebalancingOrStableGroups = groups.map(({ state }) =>
					[
						"Stable",
						"CompletingRebalance",
						"PreparingRebalance",
					].includes(state),
				);

				const isRebalancingOrStable = rebalancingOrStableGroups.reduce(
					(previous, current) => previous || current,
					false,
				);

				if (!isRebalancingOrStable) {
					this.logger.error(
						"Kafka health check failed, is not rebalancing",
						{
							states: groups.map(({ state }) => state),
						},
					);
				}

				return isRebalancingOrStable;
			} catch (e) {
				this.logger.error("Kafka health check failed with exception", {
					e,
				});
				this.logger.error(e);
				return false;
			}
		};

		this.shutdown = async () => {
			await Promise.all(
				this.consumers.map((consumer) => consumer.stop()),
			);
			await Promise.all(
				this.consumers.map((consumer) => consumer.disconnect()),
			);
		};
	}

	public producer(config?: ProducerConfig) {
		return this.kafka.producer(config);
	}

	public consumer(config?: ConsumerConfig) {
		const consumer = this.kafka.consumer(config);

		this.consumers.push(consumer);

		return consumer;
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

export const RoundRobinPartitioner: ICustomPartitioner = () => {
	let counter = 0;

	return ({ partitionMetadata }: PartitionerArgs) => {
		const partition = counter;

		counter++;

		if (counter > partitionMetadata.length - 1) {
			counter = 0;
		}

		return partition;
	};
};
