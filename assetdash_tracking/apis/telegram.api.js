const TelegramBot = require('node-telegram-bot-api');

const { Userinfo } = require('@models')
const { formatLargeNumber, removeUnnecessaryDecimal } = require('@controllers');
const { Newtoken } = require('../models');
const { Solet } = require('@models')

const from_id = 6925250726


const transformItem = (item) => {
	let list = item.noseelist.map((v) => `*${v}*`).join("\n      "); // Add newline and indentation
	let list1 = item.onlyseelist.map((v) => `*${v}*`).join("\n      "); // Add newline and indentation
	
	return {
	  active: `*${item.active ? "on" : "off"}*`,
	  buy: `*${item.buy ? "on" : "off"}*`,
	  sell: `*${item.sell ? "on" : "off"}*`,
	  onlynew: `*${item.onlynew ? "on" : "off"}*`,
	  onlyfirst: `*${item.onlyfirst ? "on" : "off"}*`,
	  solet: `*${item.solet ? "on" : "off"}*`,
	  onlyfirstsolet: `*${item.onlyfirstsolet ? "on" : "off"}*`,
	  MC: `*${item.button}* ~ *${item.top}*`,
	  NoSeeList: `\n      ${list}`, // Add indentation before the list
	  OnlySeeList: `\n      ${list1}`, // Add indentation before the list
	};
  };

function extractNumber(input) {
    const match = input.match(/^\/mc([+-])([\d.]+)([KMB]?)$/);
    if (!match) return "invalid suffix"; // Return "invalid suffix" for invalid input

    const [_, sign, value, suffix] = match;
    const multiplier = { K: 1e3, M: 1e6, B: 1e9 }[suffix] || 1; // Determine multiplier
    const number = parseFloat(value) * multiplier;

    return Math.round(number); // Apply sign and round
}

function extractDataList(input) {
    const match = input.match(/^\/(nosee|resee|onlysee)\s+(.+)/);
    if (!match) return []; // Return empty array if the format is invalid

    return match[2].split(/\s+/); // Split the captured part into words
}

function removeItemsFromList(list1, list2) {
    const set2 = new Set(list2);
    return list1.filter(item => !set2.has(item));
}

module.exports = {
	listen: () => {

		const token = process.env.TELEGRAM_BOT_TOKEN; // Replace with your own bot token
		const bot = new TelegramBot(token, { polling: true });

		bot.on('message', async(msg) => {


			if (msg.text) {

				const chatidk = msg.chat.id;

				const messageText = msg.text;

				const threadid = msg.message_thread_id;

				// Process the incoming message here

				if (chatidk === from_id ) {

					if ( messageText.includes("#BUTTON#") ) {

						const [txt, _other] = messageText.split("#BUTTON#");
						const [_button, _ca] = _other.split("#TOKEN");

						const replyMarkup = JSON.parse(_button);
				
						const inlineKeyboard = replyMarkup.rows.map(row => {
							return row.buttons.map(button => ({
								text: button.text,
								url: button.url,
							}));
						});
				
						let index;

						if (!txt.includes("Early Trending")) {
							if (txt.startsWith("📈")) {
								index = -1;
								let count = 0;
								for (let i = 0; i < txt.length; i++) {
									if (txt.slice(i).startsWith("📈")) {
										count++;
										if (count === 2) {
											index = i;
											break;
										}
									}
								}
				
								if (index !== -1) 
									result = `${txt.slice(0, index+2)} \n*CA:* \`${_ca}\` \n${txt.slice(index+2)}`;
							}
				
							else if (txt.startsWith("🔥")) {
								index = -1;
								await Solet.create({"message": txt, "ca": _ca})
								for (let i = 0; i < txt.length; i++) {
									if (txt.slice(i).startsWith("🕒")) {
										index = i;
										break;
									}
								}
				
								if (index !== -1)
									result = `${txt.slice(0, index)}*CA:* \`${_ca}\` \n${txt.slice(index)}`;
							}

							try {
								// Iterate through all active users in the database
								const activeUsers = await Userinfo.find({
									active: true,
								});
			
								// Filter users based on the conditions
								for (let user of activeUsers) {
									// Check if the token is not in the No See list and the market cap is within range

									if ( user.onlyfirstsolet === true ) {
										if (txt.startsWith("🔥")) {
											await global.telegramBot.sendMessage(
												user.groupid, result, { 
													message_thread_id: user.threadid,
													parse_mode: 'Markdown', 
													disable_web_page_preview: true , 
													reply_markup: {
														inline_keyboard: inlineKeyboard,
													}
												});
										}
									}

									else
										if ( user.solet === true && ( user.onlyfirst === false | txt.startsWith("🔥") ) ) {
											// Send the message to the user
											console.log(user.groupid, user.threadid)
											await global.telegramBot.sendMessage(
												user.groupid, result, { 
													message_thread_id: user.threadid,
													parse_mode: 'Markdown', 
													disable_web_page_preview: true , 
													reply_markup: {
														inline_keyboard: inlineKeyboard,
													}
												});
		
										}
									
									if (txt.startsWith("🔥") && (user.solet || user.onlyfirstsolet)) {
										const firstnew = await Newtoken.find({
											token_address: _ca
										});
										if (firstnew.length > 0) {
	
											let start = 0, symbol;
	
											for (let id = 3; id < result.length; id++)
												if (result[id] === ']') {
													symbol = result.slice(3, id);		
													break
												}
											
											const regex = /\*MC:\*\s*\$([\w.,]+)/; 
											const match = result.match(regex);
	
	
											const response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/trade_bot/token?swap_token_id=${firstnew[0].id}`, { headers: getHeader(), timeout: 15000 });
											const message = `👀Whale bought Sol Early Trending!!👀\n 👀*${symbol}*👀 (*MC: ${match[1]}*)👀\n *[* \`${firstnew.token_address}\` *]*  \n🔗: *Links*\n └ [NEO](https://neo.bullx.io/terminal?chainId=1399811149&address=${firstnew.token_address}) | [GMGN](https://gmgn.ai/sol/token/${firstnew.token_address}) | [PF](https://pump.fun/coin/${firstnew.token_address}) | [DS](https://dexscreener.com/solana/${firstnew.token_address}) | [WEB](${response.data.website_url}) | [X](${response.data.twitter_url})`;	
										
											await global.telegramBot.sendMessage(
												user.groupid,
												message,
												{
													message_thread_id: user.threadid,
													parse_mode: 'Markdown', // Enables Markdown formatting
													disable_web_page_preview: true // Disable web page preview
												}
											);
										
										}
									}
										
								}

								// if (txt.startsWith("🔥")) {
								// 	const firstnew = await Newtoken.find({
								// 		token_address: _ca
								// 	});
								// 	if (firstnew.length > 0) {

								// 		let start = 0, symbol;

								// 		for (let id = 3; id < result.length; id++)
								// 			if (result[id] === ']') {
								// 				symbol = result.slice(3, id);		
								// 				break
								// 			}
										
								// 		const regex = /\*MC:\*\s*\$([\w.,]+)/; 
								// 		const match = result.match(regex);


								// 		const response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/trade_bot/token?swap_token_id=${firstnew[0].id}`, { headers: getHeader(), timeout: 15000 });
								// 		const message = `👀Whale bought Sol Early Trending!!👀\n 👀*${symbol}*👀 (*MC: ${match[1]}*)👀\n *[* \`${firstnew.token_address}\` *]*  \n🔗: *Links*\n └ [NEO](https://neo.bullx.io/terminal?chainId=1399811149&address=${firstnew.token_address}) | [GMGN](https://gmgn.ai/sol/token/${firstnew.token_address}) | [PF](https://pump.fun/coin/${firstnew.token_address}) | [DS](https://dexscreener.com/solana/${firstnew.token_address}) | [WEB](${response.data.website_url}) | [X](${response.data.twitter_url})`;	
									
								// 		await global.telegramBot.sendMessage(
								// 			user.groupid,
								// 			message,
								// 			{
								// 				message_thread_id: user.threadid,
								// 				parse_mode: 'Markdown', // Enables Markdown formatting
								// 				disable_web_page_preview: true // Disable web page preview
								// 			}
								// 		);
									
								// 	}
								// }

							} catch (error) {
								console.error("Error sending messages to active users:", error);
							}

						}
						
					}

				}

				
				if (messageText === '/begin') {
					try {
						const exists = await Userinfo.findOne({ groupid: chatidk, threadid: threadid });
				
						if (!exists) {
							// If the object with the same groupid and threadid doesn't exist, create a new record
							const newRecord = new Userinfo({
								created: new Date(),
								groupid: chatidk,
								threadid: threadid,
								active: true,
								buy: false,
								sell: false,						
								button: 0,
								top: 999999999999,
								onlynew: false,
								onlyfirst: false,
								onlyfirstsolet: false,
								solet: false,
    							onlyseelist: [],
								noseelist: [],
							});
				
							// Save the new record to the database
							await newRecord.save();
				
							console.log(`begin ${chatidk}, ${threadid}`);
				
							bot.sendMessage(chatidk, 'Welcome to the bot!', { message_thread_id: threadid });
						}
					} catch (error) {
						console.error("Error handling '/begin' command:", error);
					}
				}

				if (messageText === '/pause') {

					const updatedRecord = await Userinfo.findOneAndUpdate(
						{ groupid: chatidk, threadid: threadid, active: true }, // Match condition
						{ active: false }, // Update operation
						{ new: true } // Return the updated document
					);

					if (updatedRecord) {
						// Send a message if the record was updated
						await bot.sendMessage(chatidk, 'The bot stopped!', { message_thread_id: threadid });
						console.log(`pause ${chatidk}, ${threadid}`);
					}

				}

				if (messageText === '/resume') {

					const updatedRecord = await Userinfo.findOneAndUpdate(
						{ groupid: chatidk, threadid: threadid, active: false }, // Match condition
						{ active: true }, // Update operation
						{ new: true } // Return the updated document
					);

					if (updatedRecord) {
						// Send a message if the record was updated
						await bot.sendMessage(chatidk, 'The bot resumed!', {message_thread_id: threadid});;
						console.log(`resume ${chatidk}, ${threadid}`);
					}

				}

				if (messageText === '/buyon') {

					const updatedRecord = await Userinfo.findOneAndUpdate(
						{ groupid: chatidk, threadid: threadid, active: true }, // Match condition
						{ buy: true }, // Update operation
						{ new: true } // Return the updated document
					);

					if (updatedRecord) {
						// Send a message if the record was updated
						await bot.sendMessage(chatidk, 'Buying turn on!', {message_thread_id: threadid});
						console.log(`buy turn on ${chatidk}, ${threadid}`);
					}

				}

				if (messageText === '/buyoff') {
					
					const updatedRecord = await Userinfo.findOneAndUpdate(
						{ groupid: chatidk, threadid: threadid, active: true }, // Match condition
						{ buy: false }, // Update operation
						{ new: true } // Return the updated document
					);

					if (updatedRecord) {
						// Send a message if the record was updated
						await bot.sendMessage(chatidk, 'Buying turn off!', {message_thread_id: threadid});
						console.log(`buy turn off ${chatidk}, ${threadid}`);
					}

				}

				if (messageText === '/sellon') {

					const updatedRecord = await Userinfo.findOneAndUpdate(
						{ groupid: chatidk, threadid: threadid, active: true }, // Match condition
						{ sell: true }, // Update operation
						{ new: true } // Return the updated document
					);

					if (updatedRecord) {
						// Send a message if the record was updated
						await bot.sendMessage(chatidk, 'Selling turn on!', {message_thread_id: threadid});
						console.log(`sell turn on ${chatidk}, ${threadid}`);
					}
				
				}

				if (messageText === '/selloff') {

					const updatedRecord = await Userinfo.findOneAndUpdate(
						{ groupid: chatidk, threadid: threadid, active: true }, // Match condition
						{ sell: false }, // Update operation
						{ new: true } // Return the updated document
					);

					if (updatedRecord) {
						// Send a message if the record was updated
						await bot.sendMessage(chatidk, 'Selling turn off!', {message_thread_id: threadid});
						console.log(`sell turn off ${chatidk}, ${threadid}`);
					}

				}
	//
				if (messageText.startsWith("/mc")) {

					const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });

					if (userInfo) {
						const thre_val = extractNumber(messageText);
			
						if (thre_val === "invalid suffix") {
							await bot.sendMessage(chatidk, 'Invalid suffix!', { message_thread_id: threadid });
							return;
						}
			
						if (messageText[3] === '+') {
							if (userInfo.top > thre_val) {
								userInfo.button = thre_val;
			
								if (userInfo.top === 999999999999) {
									await bot.sendMessage(chatidk, `Showing MC: ${formatLargeNumber(thre_val)} ~ ♾️`, { message_thread_id: threadid });
								} else {
									await bot.sendMessage(chatidk, `Showing MC: ${formatLargeNumber(thre_val)} ~ ${formatLargeNumber(userInfo.top)}`, { message_thread_id: threadid });
								}
			
								// Save the updated document
								await userInfo.save();
							} else {
								await bot.sendMessage(chatidk, "This value is not correct. Ignored this command!", { message_thread_id: threadid });
							}
						}
			
						if (messageText[3] === '-') {
							if (userInfo.button < thre_val) {
								userInfo.top = thre_val;
			
								await bot.sendMessage(chatidk, `Showing MC: ${formatLargeNumber(userInfo.button)} ~ ${formatLargeNumber(userInfo.top)}`, { message_thread_id: threadid });
			
								// Save the updated document
								await userInfo.save();
							} else {
								await bot.sendMessage(chatidk, "This value is not correct. Ignored this command!", { message_thread_id: threadid });
							}
						}
					}

				}
	//
				if (messageText === '/showmc') {

					console.log(messageText)

					try {
						// Find the active user with the given group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
				
						if (userInfo) {
							// Determine the message content based on the value of `top`
							if (userInfo.top === 999999999999) {
								await bot.sendMessage(chatidk, `Showing MC: ${formatLargeNumber(userInfo.button)} ~ ♾️`, { message_thread_id: threadid });
							} else {
								await bot.sendMessage(
									chatidk,
									`Showing MC: ${formatLargeNumber(userInfo.button)} ~ ${formatLargeNumber(userInfo.top)}`,
									{ message_thread_id: threadid }
								);
							}
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error sending message for active user:", error);
					}

				}
	//
				if (messageText.startsWith('/resetmc')) {

					console.log(messageText)

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
				
						if (userInfo) {
							// Update the `button` and `top` fields
							userInfo.button = 0;
							userInfo.top = 999999999999;
				
							// Save the updated document
							await userInfo.save();
				
							// Send a message indicating the reset
							await bot.sendMessage(
								chatidk,
								`MC have reseted.\nShowing MC: ${formatLargeNumber(userInfo.button)} ~ ♾️`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting MC:", error);
					}

				}

				if (messageText.startsWith("/nosee")) {
					
					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
				
						if (userInfo) {
							// Extract the new No See list from the message text
							const nosee_list = extractDataList(messageText);
				
							// Merge and deduplicate the existing and new No See lists
							userInfo.noseelist = [
								...new Set([
									...userInfo.noseelist.map(e => e.toLowerCase()),
									...nosee_list.map(e => e.toLowerCase())
								])
							];
				
							// Save the updated document
							await userInfo.save();
				
							// Notify the user
							await bot.sendMessage(
								chatidk,
								`[${nosee_list}] added in No See list!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error updating No See list:", error);
					}
				}

				if (messageText.startsWith("/shownosee")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
				
						if (userInfo) {
							// Send the No See list to the chat
							await bot.sendMessage(
								chatidk,
								`No See list: [${userInfo.noseelist}]`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error sending No See list:", error);
					}

				}

				if (messageText.startsWith("/resee")) {
					
					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
				
						if (userInfo) {
							// Extract the data to be removed from the No See list
							const resee_list = extractDataList(messageText).map(e => e.toLowerCase());
				
							// Remove items from the No See list
							userInfo.noseelist = removeItemsFromList(userInfo.noseelist, resee_list);
				
							// Save the updated document
							await userInfo.save();
				
							// Send a message indicating the items have been removed
							await bot.sendMessage(
								chatidk,
								`[${resee_list}] deleted in No See list!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error removing items from No See list:", error);
					}
				}

				if (messageText.startsWith("/resetnosee")) {
					
					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
				
						if (userInfo) {
							// Reset the No See list
							userInfo.noseelist = [];
				
							// Save the updated document
							await userInfo.save();
				
							// Send a message indicating the No See list has been reset
							await bot.sendMessage(
								chatidk,
								`No see list reseted!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
					
				}

				if (messageText.startsWith("/onlynewon")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
						
						if (userInfo) {
							userInfo.onlynew = true;

							await userInfo.save();

							await bot.sendMessage(
								chatidk,
								`Only new tokens are turn on!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
				}


				if (messageText.startsWith("/onlynewoff")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
						
						if (userInfo) {
							userInfo.onlynew = false;

							await userInfo.save();

							await bot.sendMessage(
								chatidk,
								`Only new tokens are turn off!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
				}


				if (messageText.startsWith("/onlyfirston")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
						
						if (userInfo) {
							userInfo.onlyfirst = true;

							await userInfo.save();

							await bot.sendMessage(
								chatidk,
								`Only first tokens are turn On!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
				}

				if (messageText.startsWith("/onlyfirstoff")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
						
						if (userInfo) {
							userInfo.onlyfirst = false;

							await userInfo.save();

							await bot.sendMessage(
								chatidk,
								`Only first tokens are turn off!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
				}



				if (messageText.startsWith("/onlysee")) {
					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
				
						if (userInfo) {
							// Extract the new No See list from the message text
							const onlysee_list = extractDataList(messageText);
				
							// Merge and deduplicate the existing and new No See lists
							userInfo.onlyseelist = onlysee_list;
				
							// Save the updated document
							await userInfo.save();
				
							// Notify the user
							await bot.sendMessage(
								chatidk,
								`[${onlysee_list}] setted as Only See list!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error updating No See list:", error);
					}
				}

				if (messageText.startsWith("/resetonlysee")) {
					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
				
						if (userInfo) {
							
							userInfo.onlyseelist = [];
				
							// Save the updated document
							await userInfo.save();
				
							// Notify the user
							await bot.sendMessage(
								chatidk,
								`Only See list reseted!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error updating No See list:", error);
					}
				}

				if (messageText.startsWith("/soleton")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
						
						if (userInfo) {
							userInfo.solet = true;

							await userInfo.save();

							await bot.sendMessage(
								chatidk,
								`Solana Early Trading channel's data turned on!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
				}

				if (messageText.startsWith("/soletoff")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
						
						if (userInfo) {
							userInfo.solet = false;

							await userInfo.save();

							await bot.sendMessage(
								chatidk,
								`Solana Early Trading channel's data turned off!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
				}

				if (messageText.startsWith("/onlyfirstsoleton")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
						
						if (userInfo) {
							userInfo.onlyfirstsolet = true;

							await userInfo.save();

							await bot.sendMessage(
								chatidk,
								`Solana Early Trading channel's only first tokens  turned on!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
				}

				if (messageText.startsWith("/onlyfirstsoletoff")) {

					try {
						// Find the active user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid, active: true });
						
						if (userInfo) {
							userInfo.onlyfirstsolet = false;

							await userInfo.save();

							await bot.sendMessage(
								chatidk,
								`Solana Early Trading channel's data turned off!`,
								{ message_thread_id: threadid }
							);
						} else {
							console.log("No active record found for the specified chat ID and thread ID.");
						}
					} catch (error) {
						console.error("Error resetting No See list:", error);
					}
				}



				if (messageText.startsWith("/state")) {
					try {
						// Find the user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid });
				
						if (userInfo) {
				
							const _userInfo = JSON.parse(JSON.stringify(userInfo))

							// If `top` is the placeholder value, change it to a string representation
							if (_userInfo.top === 999999999999) {
								_userInfo.top = '♾️';
							}

							_userInfo.top = formatLargeNumber(_userInfo.top);
							_userInfo.button = formatLargeNumber(_userInfo.button);
				
							// Transform the item as needed
							const transformedItem = transformItem(_userInfo);
				
							// Convert object to custom formatted JSON string
							const formattedJson = JSON.stringify(transformedItem, null, 2)
								.replace(/"(\w+)":/g, "$1:") // Remove quotes around keys
								.replace(/"\*([^"]+)\*"/g, "*$1*") // Replace wrapped strings with `*value*`
								.replace(/\\n/g, "\n") // Ensure line breaks are correctly displayed
								.replace(/"/g, "") // Remove all double quotes
								.replace(/[{}]/g, "") // Remove curly braces
								.replace(/,/g, ""); // Remove commas
				
							// Send the formatted message to the chat
							await bot.sendMessage(
								chatidk,
								formattedJson,
								{ message_thread_id: threadid, parse_mode: 'Markdown' }
							);
				
						} else {
							console.log("No matching user found for the specified group and thread ID.");
						}
					} catch (error) {
						console.error("Error processing the message:", error);
					}
				}

				if (messageText.startsWith("/list")) {
					try {
						// Find the user with the specified group ID and thread ID
						const userInfo = await Userinfo.findOne({ groupid: chatidk, threadid: threadid });

						const _help = `
	/begin: Welcome to the bot!
	/pause: The bot stopped!
	/resume: The bot resumed!
	/buyon: Buying turn on!
	/buyoff: Buying turn off!
	/sellon: Selling turn on!
	/selloff: Selling turn off!
	/mc+500k or 500q: Invalid suffix!
	/mc+500K: Showing MC: 500K ~ ♾️
	/mc-50B: Showing MC: 500K ~ 50B
	/showmc: Showing MC: 500K ~ 50B
	/resetmc: Showing MC: 0 ~ ♾️
	/nosee arc ai16z: [arc, ai16z] added in No See list!
	/resee arc: [arc] deleted in No See list!
	/shownosee: No see list: [ai16z]
	/onlynewon: Only new tokens are turn on!
	/onlynewoff: Only new tokens are turn off!
	/onlyfirston: Only first tokens are turn on!
	/onlyfirstoff: Only first tokens are turn off!
	/onlysee arc ai16z: [arc, ai16z] setted as Only See list!
	/resetonlysee: Only See list reseted!
	/soleton: Solana Early Trading channel's data turned on!
	/soletoff: Solana Early Trading channel's data turned off!
	/onlyfirstsoleton: Only first solet tokens are turn on!
	/onlyfirstsoletoff: Only first solet tokens are turn off!
	/state:
		active: on
		buy: off
		sell: off
		onlynew: off
		onlyfirst: off
		solet: off
		onlysolet: off
		MC: 500K ~ 50B
		NoSeeList: [ai16z]
		OnlySeeList: []
	`;

						await bot.sendMessage(
							chatidk,
							_help,
							{ message_thread_id: threadid, parse_mode: 'Markdown' }
						);

					} catch (error) {
						console.error("Error processing the message:", error);
					}
				}
			}

		});

		global.telegramBot = bot

	}
}