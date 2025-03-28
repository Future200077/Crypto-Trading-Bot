const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // npm install input

const apiId = 20982656; // Replace with your API ID
const apiHash = 'e1bd37dccca4c5105f49f8919e45ce5f'; // Replace with your API Hash

(async () => {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
        connectionRetries: 5,
    });

    console.log("Starting Telegram Client...");

    await client.start({
        phoneNumber: async () => await input.text("Enter your phone number: "),
        password: async () => await input.text("Enter your password (if 2FA enabled): "),
        phoneCode: async () => await input.text("Enter the code you received: "),
        onError: (err) => console.error(err),
    });

    console.log("You are now connected!");

    console.log(client.session.save());


})();
