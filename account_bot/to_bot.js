const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");
const fs = require("fs");

const apiId = 20982656; // Your API ID
const apiHash = "e1bd37dccca4c5105f49f8919e45ce5f"; // Your API Hash
const botToken = "7714551641:AAGweuhb6wXo5LhM8BOXRdMrRAtjMwU6Trc"; // Your bot token
const botApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
const channelUsername = "solearlytrending"; // Channel username

// Logging function
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync("log.txt", `[${timestamp}] ${message}\n`, "utf8");
}

// Load session
let savedSession = "";
try {
    savedSession = fs.readFileSync("session.txt", "utf8");
    logMessage("Session loaded successfully.");
} catch (error) {
    console.error("No saved session found. Please authenticate first.");
    process.exit(1);
}

const client = new TelegramClient(new StringSession(savedSession), apiId, apiHash, {
    connectionRetries: 5,
});

(async () => {
    try {
        await client.connect();
        logMessage("Connected to Telegram!");

        // Fetch the channel entity
        const channel = await client.getEntity(channelUsername);
        logMessage(`Fetched channel entity: ${channelUsername}`);

        // Fetch the latest message from the channel
        const messages = await client.getMessages(channel, { limit: 1 });
        if (messages.length === 0) {
            console.error("No messages found in the channel.");
            logMessage("No messages found in the channel.");
            return;
        }

        const latestMessage = messages[0];
        logMessage(`Fetched latest message: ${JSON.stringify(latestMessage, null, 2)}`);

        // Send the message to the bot via HTTP request
        const payload = {
            chat_id: "@oleh_tradingbot", // Replace with your bot username or chat ID
            text: latestMessage.text || "[No Text]",
            parse_mode: "Markdown",
        };

        const response = await axios.post(botApiUrl, payload);
        if (response.data.ok) {
            logMessage("Message sent to the bot successfully via HTTP.");
        } else {
            logMessage(`Failed to send message to the bot: ${response.data.description}`);
        }
    } catch (error) {
        console.error("Error:", error.message);
        logMessage(`Error: ${error.message}`);
    } 
    // finally {
    //     await client.disconnect();
    //     logMessage("Disconnected from Telegram.");
    // }
})();