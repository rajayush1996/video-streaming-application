const amqp = require("amqplib");
const config = require("../../config/config");
const queueDetails = require("../features/rabbitmq");

let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(config.rabbitmq.host);
        channel = await connection.createChannel();
    
        // Create and assert queues
        for (const queueName of Object.values(rabbitmqConfig.queues)) {
            await channel.assertQueue(queueName, { durable: true });
        }

        console.log("✅ RabbitMQ Connected & Queues Asserted!");
    } catch (error) {
        console.error("❌ RabbitMQ Connection Failed:", error);
    }
}

function getChannel() {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized");
    }
    return channel;
}

function getQueue(name) {
    return rabbitmqConfig.queues[name] || null;
}

module.exports = { connectRabbitMQ, getChannel, getQueue };
