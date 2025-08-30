// /connection/rabbitmq.connection.js
const amqp = require("amqplib");
const config = require("../../config");

let connection = null;
let channel = null;

async function createChannel() {
    if (!connection) {
        throw new Error("Cannot create channel: no connection");
    }

    channel = await connection.createChannel();

    // catch and log channel‑level errors
    channel.on("error", (err) => {
        console.error("❌ RabbitMQ channel error:", err);
    });

    channel.on("close", () => {
        console.warn("⚠️ RabbitMQ channel closed — recreating in 5s");
        setTimeout(createChannel, 5000);
    });

    console.log("✅ RabbitMQ channel created");
}

async function connectRabbitMQ() {
    console.log("🚀 ~ :31 ~ connectRabbitMQ ~ (config.rabbitmq.host:", (config.rabbitmq.host));
    try {
        connection = await amqp.connect(config.rabbitmq.host, {
            heartbeat: 30,       // ask RabbitMQ for a 30s heartbeat
            // you can also set locale, frameMax, etc. here
        });

        // catch and log connection‑level errors
        connection.on("error", (err) => {
            console.error("❌ RabbitMQ connection error:", err);
            // do not throw — we’ll reconnect on 'close'
        });

        connection.on("close", () => {
            console.warn("⚠️ RabbitMQ connection closed — reconnecting in 5s");
            setTimeout(connectRabbitMQ, 5000);
        });

        await createChannel();

        console.log("✅ RabbitMQ connected & channel ready");
    } catch (err) {
        console.error("❌ Initial RabbitMQ connection failed:", err);
        // retry after backoff
        setTimeout(connectRabbitMQ, 5000);
    }
}

function getChannel() {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized");
    }
    return channel;
}

module.exports = {
    connectRabbitMQ,
    getChannel,
};
