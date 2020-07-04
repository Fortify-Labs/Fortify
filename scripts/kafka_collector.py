# pip install kafka-python

import json
from kafka import KafkaConsumer

# consume earliest available messages, don't commit offsets
consumer = KafkaConsumer("gsi",
                         auto_offset_reset='earliest',
                         enable_auto_commit=False)

data = []

try:
    poll = consumer.poll(20000, update_offsets=False)

    for partition, msgs in poll.items():
        for msg in msgs:
            message = msg.value
            data.append(json.loads(message))

except Exception as e:
    print(e)

with open("gsi.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Successfully dumped gsi topic to gsi.json file")
