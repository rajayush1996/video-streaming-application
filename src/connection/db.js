const mongoose = require("mongoose");
const logger = require("../features/logger");
const config = require("../../config");
const seedEmailProviders = require("../seeds/emailProvider.seed");

const fs = require("fs");
const path = require("path");

let queues = {};

// Function to Load All Queue Configurations from `config/rabbitmq/`
function loadQueues() {
    const queueDir = path.join(__dirname, "../features/rabbitmq");
    const files = fs.readdirSync(queueDir);

    files.forEach((file) => {
        if (file.endsWith(".json")) {
            const queueConfig = JSON.parse(
                fs.readFileSync(path.join(queueDir, file), "utf-8")
            );
            queues[queueConfig.name] = queueConfig;
        }
    });

    console.log("✅ Loaded RabbitMQ Queues:", Object.keys(queues));
}

const connectDB = async () => {
    try {
        const dbUri = `${config.database.url}${config.database.dbname}`;
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        if (config.debug_mongoose) {
            mongoose.set("debug", true);
        }
        logger.info("db connected");
        await seedEmailProviders();
        loadQueues();
    } catch (err) {
        logger.error("db error", err);
    }
};

module.exports = connectDB;
