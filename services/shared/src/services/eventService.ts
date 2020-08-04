import { injectable, inject } from "inversify";

import { KafkaConnector } from "../connectors/kafka";
import { FortifyEventClass } from "../events/events";

@injectable()
export class EventService {
	constructor(@inject(KafkaConnector) private kafka: KafkaConnector) {}

	async sendEvent<T>(event: FortifyEventClass<T>, key?: string) {
		const producer = this.kafka.producer();
		await producer.connect();
		producer.send({
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
