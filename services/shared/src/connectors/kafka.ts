import { injectable } from "inversify";

import { Kafka, ConsumerConfig, ProducerConfig } from "kafkajs";

const { KAFKA_CLIENT_ID, KAFKA_BROKERS } = process.env;

@injectable()
export class KafkaConnector {
	public kafka: Kafka;

	constructor() {
		this.kafka = new Kafka({
			brokers: JSON.parse(KAFKA_BROKERS ?? "null") ?? ["kafka:9092"],
			clientId: KAFKA_CLIENT_ID,
		});
	}

	public producer(config?: ProducerConfig) {
		return this.kafka.producer(config);
	}

	public consumer(config?: ConsumerConfig) {
		return this.kafka.consumer(config);
	}
}
