
const axiosRetry = require('axios-retry').default;
const axios = require('axios');

const fs = require('fs')
const path = require('path')

const { Transaction } = require('@models')
const { Userinfo } = require('@models')
const { Newtoken } = require('@models')
const { Solet } = require('@models')


const { getHeader, log } = require('@utils')

const OUTPUT_GROUP = -1002418546161; // Gemsense group
const CLEAN_CALLS_TOPIC = 15713; // CLEAN CALLS topic in Gemsense

axiosRetry(axios, { retries: 5, retryDelay: axiosRetry.exponentialDelay });


function formatLargeNumber(number) {  

    let formattedNumber;  

	if (number === null)
		return "0";
	
    // Billion  
    if (number >= 1e9) {  
        formattedNumber = (number / 1e9).toFixed(2) + 'B';  
    }  
    // Million  
    else if (number >= 1e6) {  
        formattedNumber = (number / 1e6).toFixed(2) + 'M';  
    }  
    // Thousand  
    else if (number >= 1e3) {  
        formattedNumber = (number / 1e3).toFixed(2) + 'K';  
    }  
    // Less than 1000  
    else {  
        formattedNumber = number.toString();  
    }  

    // Remove unnecessary decimal places (e.g., convert 1.00K to 1K)  
    formattedNumber = removeUnnecessaryDecimal(formattedNumber);  

    return formattedNumber;  
}  

function removeUnnecessaryDecimal(formattedNumber) {  
    // if the formatted number ends with ".00", remove it, else if it ends with a "0" after a decimal point, remove that "0".  
    if(formattedNumber.endsWith('.00')) {  
        return formattedNumber.substring(0, formattedNumber.length - 3);  
    } else if(formattedNumber.indexOf('.') > 0 && formattedNumber.endsWith('0')) {  
        return formattedNumber.substring(0, formattedNumber.length - 1);  
    }  
    return formattedNumber;  
}  

function checknoseelist(noseelist, token) {
	for (let item of noseelist)
		if (item.length > 20 && item === token.token_address) 
			return false
		else if (item.length < 20 && item.toLowerCase() === token.symbol.toLowerCase())
			return false
	return true			
}

function checkonlyseelist(onlyseelist, token) {
	for (let item of onlyseelist)
		if (item.length > 20 && item === token.token_address) 
			return true
		else if (item.length < 20 && item.toLowerCase() === token.symbol.toLowerCase())
			return true
	return false
}


function isNewToken (e) {
	let t = new Date(e), a = new Date;
	a.setDate(a.getDate() - 1);
	return t > a
}

const getTransaction = async () => {

	let finalCheck, response;		//	this is the final transaction id, identify using transaction id, this is unique like timestamp, and works well....

	try {
		finalCheck = fs.readFileSync(path.join(__dirname, '../logs/final_check.log'), encoding='utf-8')
	} catch (e) {
		fs.writeFileSync(path.join(__dirname, '../logs/final_check.log'), '', encoding='utf-8')
	}
	
	for (let i=0; i<Number(process.env.RETRIES); i++) {
		try {
			response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/whalewatch/transactions/list?page=1&limit=20&2024-12-30T09:55:17}`, { headers: getHeader(), timeout: 15000 })
			break
		} catch (e) {
			log('Retry send request')
		}
	}
	if (response) {
		
		let result = [];

		for (let k = 0; k < response.data.transactions.length; k++)
			if (response.data.transactions[k].id == finalCheck)
				break;
			else
				result.push(response.data.transactions[k])

		await addTransaction(result)

		fs.writeFileSync(path.join(__dirname, '../logs/final_check.log'), response.data.transactions[0].id);

		try{
			await checkTransaction(result)
		} catch (e) {
			log('Network Error')
		}
		
	}
	
	setTimeout(getTransaction, 1000)

}

const addTransaction = async (data) => {
	if (data.length === 0) {
		log(`No data updated`)	
	}else {
		log(`${data.length} data added to MongoDB.`)
	}
	try {
		console.log(data.length);
		await Transaction.insertMany(data)
	} catch (e) {
		console.log(e)
	}
}


const checkTransaction_mon = async (data, order) => {

	let data_token = data.map((item) => item.swap_token_id);
	let symbols = data.map((item) => item.swap_token.symbol);

	const now = new Date(data[0].timestamp);
	const twoMinutesAgo = new Date(now - (2*60+5)*1000);
	
	const transactionIds = await Transaction.aggregate([  
		{  
			$match: {
				timestamp: { $gte: twoMinutesAgo },  
				swap_token_id: { $in: data_token }, // Assuming 'data' is your array of token IDs  
				transaction_type: order,
			}
		},
	]);
	  
	console.log(order, transactionIds.length)

	let non_dup = [];
	const order1 = (order === "buy") ? "bought" : "sold";
	const sym = (order === "buy") ? "⭐" : " ❌";

	let response, message, alarmmessage;

	for (let item of data) {
		if (item.is_token_first_seen == true) {
			let new_flag = false;
			try {
				response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/trade_bot/token?swap_token_id=${item.swap_token.id}`, { headers: getHeader(), timeout: 15000 });
			} catch (e) {
				console.log(e)
				continue;
			}

			if (item.transaction_type === order){
				if (isNewToken(item.swap_token.created_timestamp)) {
					await Newtoken.create(item.swap_token)
					new_flag = true;
					message = `‼️‼️‼️‼️🥇(FIRST)‼️‼️‼️‼️ \n ${item.swap_whalewatch_list.name} whales just ${order1} $${formatLargeNumber(item.trade_amount_rounded)} of 👶*${item.swap_token.symbol}*👶 (*MC: ${formatLargeNumber(item.token_market_cap)}*) \n *[* \`${item.swap_token.token_address}\` *]*  \n🔗: *Links*\n └ [NEO](https://neo.bullx.io/terminal?chainId=1399811149&address=${item.swap_token.token_address}) | [GMGN](https://gmgn.ai/sol/token/${item.swap_token.token_address}) | [PF](https://pump.fun/coin/${item.swap_token.token_address}) | [DS](https://dexscreener.com/solana/${item.swap_token.token_address}) | [WEB](${response.data.website_url}) | [X](${response.data.twitter_url})`;
					
					// const firstnew = await Solet.find({
					// 	ca: item.swap_token.token_address
					// });

					// if (firstnew.length > 0) {
					// 	message1 = `👀Whale bought Sol Early Trending!!👀\n 👀*${item.swap_whalewatch_list.name}*👀 (*MC: ${formatLargeNumber(item.token_market_cap)}*)👀\n *[* \`${item.swap_token.token_address}\` *]*  \n🔗: *Links*\n └ [NEO](https://neo.bullx.io/terminal?chainId=1399811149&address=${item.swap_token.token_address}) | [GMGN](https://gmgn.ai/sol/token/${item.swap_token.token_address}) | [PF](https://pump.fun/coin/${item.swap_token.token_address}) | [DS](https://dexscreener.com/solana/${item.swap_token.token_address}) | [WEB](${response.data.website_url}) | [X](${response.data.twitter_url})`;	
					// }
						
				}
				else
					message = `‼️‼️‼️‼️🥇(FIRST)‼️‼️‼️‼️ \n ${item.swap_whalewatch_list.name} whales just ${order1} $${formatLargeNumber(item.trade_amount_rounded)} of *${item.swap_token.symbol}* (*MC: ${formatLargeNumber(item.token_market_cap)}*) \n *[* \`${item.swap_token.token_address}\` *]*  \n🔗: *Links*\n └ [NEO](https://neo.bullx.io/terminal?chainId=1399811149&address=${item.swap_token.token_address}) | [GMGN](https://gmgn.ai/sol/token/${item.swap_token.token_address}) | [PF](https://pump.fun/coin/${item.swap_token.token_address}) | [DS](https://dexscreener.com/solana/${item.swap_token.token_address}) | [WEB](${response.data.website_url}) | [X](${response.data.twitter_url})`;
				console.log(message)
			}

			try {
				// Retrieve active users who have either "buy" or "sell" permission
				const activeUsers = await Userinfo.find({
					active: true,
				});
		
				// Iterate over each active user
				for (let user of activeUsers) {
					// Check if the token is not in the "No See" list and if the market cap is within range
					if (
						checknoseelist(user.noseelist, item.swap_token) &&
						( user.onlyseelist.length === 0 || checkonlyseelist(user.onlyseelist, item.swap_token) ) && 	//onlysee
						item.token_market_cap > user.button &&
						item.token_market_cap < user.top &&
						(!user.onlynew || new_flag ) && 
						(!user.onlyfirstsolet) &&
						( (user.buy && order === "buy" ) || (user.sell && order === "sell") )
					) {
						// Send the message to the user's group with the specified message thread ID
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
					if (new_flag){
						const firstnew = await Solet.find({
							ca: item.swap_token.token_address
						});
						if (firstnew.length > 0) {
							alarmmessage = `👀Whale bought Sol Early Trending!!👀\n 👀*${item.swap_whalewatch_list.name}*👀 (*MC: ${formatLargeNumber(item.token_market_cap)}*)👀\n *[* \`${item.swap_token.token_address}\` *]*  \n🔗: *Links*\n └ [NEO](https://neo.bullx.io/terminal?chainId=1399811149&address=${item.swap_token.token_address}) | [GMGN](https://gmgn.ai/sol/token/${item.swap_token.token_address}) | [PF](https://pump.fun/coin/${item.swap_token.token_address}) | [DS](https://dexscreener.com/solana/${item.swap_token.token_address}) | [WEB](${response.data.website_url}) | [X](${response.data.twitter_url})`;	
							await global.telegramBot.sendMessage(
								user.groupid,
								alarmmessage,
								{
									message_thread_id: user.threadid,
									parse_mode: 'Markdown', // Enables Markdown formatting
									disable_web_page_preview: true // Disable web page preview
								}
							);
						}

					}

					// if (message1) {
					// 	await global.telegramBot.sendMessage(
					// 		user.groupid,
					// 		message1,
					// 		{
					// 			message_thread_id: user.threadid,
					// 			parse_mode: 'Markdown', // Enables Markdown formatting
					// 			disable_web_page_preview: true // Disable web page preview
					// 		}
					// 	);
					// }

				}
			} catch (error) {
				console.error("Error sending messages to active users:", error);
			}

		}

	}


	for (let first of transactionIds) {
		if (!non_dup.includes(first.swap_token_id)) {
			non_dup.push(first.swap_token_id);

			let cnt = 0, sum = 0,  group_trx = [], final, new_flag = false;

			for (let second of transactionIds) {

				if (non_dup[non_dup.length-1] == second.swap_token_id) {
					cnt++;
					group_trx.push(second);
					sum = sum + second.trade_amount_rounded;
				}
			}

			if (cnt > 1) {
				
				try {
					response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/trade_bot/token?swap_token_id=${first.swap_token.id}`, { headers: getHeader(), timeout: 15000 });
				} catch (e) {
					console.log(e)
					continue;
				}

				message = "";
				for (let k =0; k<cnt; k++)
					message = message+sym;

				final = group_trx.reduce((prev, current) => {  
					return (prev.timestamp > current.timestamp) ? prev : current;  
				});

				if (isNewToken(final.swap_token.created_timestamp)) {
					message = `${message} \n ${cnt} whales just ${order1} $${formatLargeNumber(sum)} of 👶*${first.swap_token.symbol}*👶 (*MC: ${formatLargeNumber(final.token_market_cap) }*) in last 2 minutes. \n *[* \`${first.swap_token.token_address}\` *]* \n🔗: *Links*\n └ [NEO](https://neo.bullx.io/terminal?chainId=1399811149&address=${first.swap_token.token_address}) | [GMGN](https://gmgn.ai/sol/token/${first.swap_token.token_address}) | [PF](https://pump.fun/coin/${first.swap_token.token_address}) | [DS](https://dexscreener.com/solana/${first.swap_token.token_address}) | [WEB](${response.data.website_url}) | [X](${response.data.twitter_url})`;
					new_flag = true
				}
				else
					message = `${message} \n ${cnt} whales just ${order1} $${formatLargeNumber(sum)} of *${first.swap_token.symbol}* (*MC: ${formatLargeNumber(final.token_market_cap) }*) in last 2 minutes. \n *[* \`${first.swap_token.token_address}\` *]* \n🔗: *Links*\n └ [NEO](https://neo.bullx.io/terminal?chainId=1399811149&address=${first.swap_token.token_address}) | [GMGN](https://gmgn.ai/sol/token/${first.swap_token.token_address}) | [PF](https://pump.fun/coin/${first.swap_token.token_address}) | [DS](https://dexscreener.com/solana/${first.swap_token.token_address}) | [WEB](${response.data.website_url}) | [X](${response.data.twitter_url})`;

				try {
					// Iterate through all active users in the database
					const activeUsers = await Userinfo.find({
						active: true,
					});

					console.log(activeUsers.length)

					// Filter users based on the conditions
					for (let user of activeUsers) {
						// Check if the token is not in the No See list and the market cap is within range
						if (
							checknoseelist(user.noseelist, first.swap_token) &&
							( user.onlyseelist.length === 0 || checkonlyseelist(user.onlyseelist, first.swap_token) ) && 	//onlysee
							final.token_market_cap > user.button &&
							final.token_market_cap < user.top &&
							(!user.onlynew || new_flag ) &&
							(!user.onlyfirst ) &&
							(!user.onlyfirstsolet) &&
							( (user.buy && order === "buy" ) || (user.sell && order === "sell") )
						) {
							// Send the message to the user
							console.log(user.groupid, user.threadid)
							await global.telegramBot.sendMessage(
								user.groupid,
								message,
								{
									message_thread_id: user.threadid,
									parse_mode: 'Markdown',
									disable_web_page_preview: true
								}
							);
						}
					}
				} catch (error) {
					console.error("Error sending messages to active users:", error);
				}

			}
		}
	}
	
}

const checkTransaction = async (data) => {
	if (data.length === 0) return 

	console.log(data.map((item) => item.swap_token.symbol));

	await checkTransaction_mon(data, "buy");
	await checkTransaction_mon(data, "sell");
	
	return true

}

module.exports = {
	getTransaction,
	addTransaction,
	formatLargeNumber,
	removeUnnecessaryDecimal
}