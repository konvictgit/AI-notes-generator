const { Kafka } = require('kafkajs')

function createKafkaClient() {
  const brokers = (process.env.KAFKA_BROKERS || '').split(',').filter(Boolean)
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'ai-study-notes-worker',
    brokers,
    ssl: !!process.env.KAFKA_USERNAME,
    sasl: process.env.KAFKA_USERNAME ? {
      mechanism: 'plain',
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD
    } : undefined
  })
  return kafka
}

module.exports = { createKafkaClient }
