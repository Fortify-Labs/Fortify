import { injectable, inject } from "inversify";
import { ProducerConfig } from "kafkajs";
import { Logger } from "../logger";

import { KafkaConnector } from "../connectors/kafka";
import { FortifyEventClass } from "../events/events";

const { LOCAL_EVENT_CAPTURE = "false" } = process.env;

@injectable()
export class EventService {
	constructor(
		@inject(KafkaConnector) private kafka: KafkaConnector,
		@inject(Logger) private logger: Logger,
	) {}

	async sendEvent<T>(
		event: FortifyEventClass<T>,
		key?: string,
		config?: ProducerConfig,
	) {
		if (LOCAL_EVENT_CAPTURE === "true") {
			this.logger.info("Captured event", {
				topic: event._topic,
				key,
				event,
			});
			return;
		}

		const producer = this.kafka.producer(config);
		await producer.connect();
		await producer.send({
			topic: event._topic,
			messages: [
				{
					key,
					value: event.serialize(),
				},
			],
		});
		await producer.disconnect();
	}
}
