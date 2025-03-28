const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const { resourceLimits } = require("worker_threads");
const TelegramBot = require("node-telegram-bot-api");
const axios = require('axios');

const apiId = 29356431;
const apiHash = "a667cd36b584e3253bf117ff7eeb741b";

const botToken = "8154482680:AAEAo6NTkwPwGM_8uc77Hdr_HoTw-yrevE4"; // Your bot token

// FORWARD_GROUP = 8049308224

// const bot = new TelegramBot(botToken, { polling: true });

// Create or open log file
const logFile = "log.txt";
function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, 'utf8');
}

function Makeformate(message_text, entities, ch) {

    for(let entity in entities) {
        if (entities[entity].offset == ch) {
            
            if (entities[entity].className == "MessageEntityTextUrl"){
                const start = entities[entity].offset;
                const end = start + entities[entity].length;
                const substring = message_text.substring(start, end);
                return `[${substring}](${entities[entity].url})`
            }

            else {
                const start = entities[entity].offset;
                const end = start + entities[entity].length;
                const substring = message_text.substring(start, end);
                return `*${substring}*`
            }
                
        }
        if (entities[entity].offset < ch && entities[entity].offset + entities[entity].length > ch)
            return ""
    }
    
    return message_text[ch];
}


let savedSession = "";
try {
    savedSession = fs.readFileSync("session.txt", "utf8");
    logMessage("Session loaded successfully.");
} catch (error) {
    console.error("No saved session found. Please authenticate first.");
    logMessage("No saved session found.");
    process.exit(1);
}

const client = new TelegramClient(new StringSession(savedSession), apiId, apiHash, {
    connectionRetries: 5,
});

(async () => {
    try {
        await client.connect();
        logMessage("Connected to Telegram!");

        // Fetch the channel messages
        const channelUsername = "solearlytrending";
        const channel = await client.getEntity(channelUsername);
        logMessage(`Fetched channel entity: ${JSON.stringify(channel, null, 2)}`);

        let latestid = 0;
        
        setInterval(async () => {
            try{
                const messages = await client.getMessages(channel, { limit: 15 });
                if (messages.length === 0) {
                    console.error("No messages found in the channel.");
                    logMessage("No messages found in the channel.");
                    await client.disconnect();
                    process.exit(0);
                }

                for(let id = messages.length - 1; id >= 0; id--) {
                    const latestMessage = messages[id];

                    if (latestMessage) {
                        if (!latestMessage || !latestMessage.id || !latestMessage.peerId) {
                            console.error("The message or its peerId is invalid.");
                            logMessage("The message or its peerId is invalid.");
                            await client.disconnect();
                            process.exit(1);
                        }

                        // Fetch the user entity for @oleh_tradingbot
                        const targetUsername = "@oleh_tradingbot";
                        const targetUser = await client.getEntity(targetUsername);

                        if (latestMessage.id > latestid) {

                            latestid = latestMessage.id

                            logMessage(`Fetched latest message: ${JSON.stringify(latestMessage, null, 2)}`);
                            
                            const message_text = latestMessage.message;
                            const entities = latestMessage.entities;
                            const replyMarkup = JSON.stringify(latestMessage.replyMarkup)

                            logMessage(`${JSON.stringify(entities, null, 2)}`)        

                            // if (!message_text) continue;

                            if (!message_text || !Array.isArray(entities)) {
                                console.warn("Message text or entities are undefined. Skipping message.");
                                logMessage("Message text or entities are undefined. Skipping message.");
                                continue;
                            }

                            // Filter entities to remove "MessageEntityTextUrl" with the same offset and length as "MessageEntityBold"
                            let filteredEntities = [];
                            try{
                                filteredEntities = entities.filter((entity, _, allEntities) => {
                                    if (entity.className === "MessageEntityBold") {
                                        // Check if a "MessageEntityBold" entity exists with the same offset and length
                                        return !allEntities.some(e =>
                                            e.className === "MessageEntityTextUrl" &&
                                            e.offset === entity.offset &&
                                            e.length === entity.length
                                        );
                                    }
                                    return true; // Keep other entities
                                });
                            }catch(e){
                                filteredEntities=[];   
                            }
                        
                            var result = "";

                            // if(message_text && message_text.length > 0){
                            //     for(let ch = 0; ch < message_text.length; ch++) {
                            //         result = result + Makeformate(message_text, filteredEntities, ch)
                            //     }
                            // }
                            // else result = result + ""

                            if (message_text && message_text.length > 0) {
                                for (let ch = 0; ch < message_text.length; ch++) {
                                    // Check if filteredEntities is empty
                                    if (filteredEntities.length === 0) {
                                        result = result + message_text[ch]; // Directly append the character if no entities are present
                                    } else {
                                        result = result + Makeformate(message_text, filteredEntities, ch); // Proceed with formatting if there are entities
                                    }
                                }
                            } else {
                                result = result + ""; // If message_text is empty, keep result empty
                            }
                            // else  result = result + Makeformate(message_text, filteredEntities, 0)
                            // result = result + "#BUTTON#" + replyMarkup + "#TOKEN" + entities[0].url.slice(-44);
                            // result = result + "#BUTTON#" + replyMarkup + "#TOKEN" + entities[0]?.url?.slice(-44);
                            result = result + "#BUTTON#" + replyMarkup + (entities?.[0]?.url ? `#TOKEN${entities[0].url.slice(-44)}` : "");

                            console.log(result)

                            logMessage(`Message forwarded successfully. ${result}`);

                            await client.sendMessage(targetUser, {
                                message : result,  
                                parse_mode: "Markdown",});

                        }
                    }

                }
            }catch(error){
                if (error.errorMessage.includes("FLOOD_WAIT")) {
                    const waitTime = parseInt(error.errorMessage.match(/\d+/)[0]); // Extract seconds
                    console.warn(`Flood wait detected! Sleeping for ${waitTime} seconds...`);
                    logMessage(`Flood wait detected! Sleeping for ${waitTime} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000)); // Wait
                } else {
                    console.error("Unexpected error:", error.message);
                    logMessage(`Unexpected error: ${error.message}`);
                }
            }
        }, 5000)
        
            

    } catch (error) {
        console.error("Error:", error.message);
        console.error("Stack trace:", error.stack);
        logMessage(`Error: ${error.message}`);
        logMessage(`Stack trace: ${error.stack}`);
    }
})();



// parse_mode : "Markdown",