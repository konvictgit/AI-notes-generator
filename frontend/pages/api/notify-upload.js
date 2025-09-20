import { Kafka, Partitioners } from "kafkajs";

let kafka;
let producer;

function getKafkaProducer() {
  if (producer) return producer;
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || "ai-study-notes-frontend",
    brokers: (process.env.KAFKA_BROKERS || "").split(","),
    ssl: !!process.env.KAFKA_SASL,
    sasl: process.env.KAFKA_USERNAME
      ? {
          mechanism: "plain",
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD,
        }
      : undefined,
  });
  producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });
  return producer;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { fileKey, metadata } = req.body;
  try {
    const prod = getKafkaProducer();
    await prod.connect();
    const payload = {
      fileKey,
      metadata,
      timestamp: Date.now(),
    };
    await prod.send({
      topic: process.env.KAFKA_TOPIC_UPLOADS || "pdf_uploaded",
      messages: [{ key: fileKey, value: JSON.stringify(payload) }],
    });
    // optional: disconnect to keep serverless nice. In production use persistent producer.
    await prod.disconnect();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to send kafka message" });
  }
}
