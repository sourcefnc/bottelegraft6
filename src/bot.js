import { Telegraf, Markup, Scenes, session } from 'telegraf';
const { BaseScene, Stage } = Scenes;
import { message } from 'telegraf/filters';
import axios from 'axios';

import * as controller from './controller/controller.js';

const bot = new Telegraf('7184993857:AAFuVtgeIA8j0eaoBRZT1bERoBGNAi1k-XE');

const reStart = 'You don\'t have information on the system, start from the beginning now! \nClick /start to begin';
let favored = false; // biến xác nhận tin nhắn


async function getUserBalance(userId) {
    let balance = await axios.get(`http://localhost:3008/api/balance?userId=${userId}`)
        .then((response) => {
            let result = response.data;
            console.log(result);
            if (result) {
                return {
                    balance: parseFloat(result.balance),
                    wallet: result.wallet
                }
            }
            console.log(result, '<<<< balance false');
            return false;
        })
        ;
    return balance;
}
function customQuantity(str) {
    if (!/^[+-]?\d+(\.\d+)?$/.test(str)) {
        return NaN;
    }
    return parseFloat(str);
}
bot.start((ctx) => {
    if (ctx.from.username === undefined) {
        ctx.reply('Please set up your username to continue using the bot!')
        return;
    }
    let textStart = `Hello ${ctx.from.first_name} ! Nice to meet you.
Some terms and conditions you should know when using the service here,to ensure and avoid risks to your property, learn about it by clicking /rules`;
    ctx.reply(textStart,
        Markup.inlineKeyboard([
            Markup.button.callback('Confirm', 'bot_register')
        ])
    )
});

const checkBalance = async () => {
    try {
        const response = await axios.get('http://localhost:3008/balance');
        const { balance } = response.data;

        if (previousBalance !== null && previousBalance !== balance) {
            await notifyUsers(balance);
        }
        previousBalance = balance;
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
};

// Hàm thông báo người dùng
const notifyUsers = async (balance) => {
    for (const userId of users) {
        await bot.telegram.sendMessage(userId, `Balance đã thay đổi: ${balance}`);
    }
};

// Kiểm tra balance mỗi 5 giây
// setInterval(checkBalance, 60000);


const menu = Markup.keyboard([
    ['💹Balance', '🫴Saving', '🎁Bonus'],
    ['📤Withdraw', '📥Deposit', '📞Contact'],
]).resize();
// 
// Command
bot.command('savings', (ctx) => {
    ctx.reply('Start a savings now', Markup.inlineKeyboard([
        Markup.button.callback('Flexible', 'flexible'),
        Markup.button.callback('Fixed', 'fixed')
    ]))
})
bot.command('menu', (ctx) => {
    if (ctx.from.username === undefined) {
        ctx.reply('Please set up your username to continue using the bot!')
        return;
    }
    ctx.reply('Chọn một tùy chọn:', menu)
});

// Xử lý khi người dùng chọn tùy chọn
bot.hears('💹Balance', async (ctx) => {
    const userId = ctx.from.id;
    let userBalance = await axios.get(`http://localhost:3008/api/balance?userId=${userId}`)
        .then((response) => {
            return response.data.balance
        })
    if (userBalance === undefined) {
        ctx.reply(reStart);
        return;
    }
    console.log(userBalance);
    ctx.reply(`Your balance is: ${userBalance} $TON \nNote: you can withdraw this balance to your wallet or optionally add capital to savings packages.`,
        Markup.inlineKeyboard([
            Markup.button.callback('My wallet address', 'wallet_address')
        ])
    )
    return;

});
bot.hears('🫴Saving', async (ctx) => {
    const userId = ctx.from.id;

    axios.get(`http://localhost:3008/api/balance?userId=${userId}`)
        .then((response) => {
            let result = parseFloat(response.data.balance)
            console.log(result);
            if (result < 0.1) {
                let need = 0.1 - result;
                let needd2 = need.toFixed(8)
                ctx.reply(`Your current balance is ${result} $TON, the minimum amount to start saving when your balance is 0.1 $TON \nNote: Please deposit ${needd2} to be eligible to participate`);
                return;
            }
            if (!result) {
                console.log(result);
                ctx.reply(reStart);
                return;
            }
            if (result > 0.1) {
                ctx.reply('Make the most profitable and appropriate choice!. \nFlexible savings: Withdraw capital anytime you want (lower fixed profit). \nFixed savings: Automatically withdraw capital to balance upon maturity (attractive profit) !!!', Markup.inlineKeyboard([
                    Markup.button.callback('Flexible', 'flexible'),
                    Markup.button.callback('Fixed', 'fixed')
                ]))
            }
        });

})
bot.hears('🎁Bonus', async (ctx) => {
    ctx.reply('Reward claim failed, please try again later!')
    let response = await axios.post('http://localhost:3008/api/claim-bonus', {
        userId: ctx.from.id
    })
    console.log(response.data);
})

bot.hears('📥Deposit', (ctx) => {

    ctx.reply('You are requesting to make a deposit, send $TON to the wallet address below and don\'t forget to fill in the Memo section.');
    ctx.reply(`Deposit wallet address: *EQAHwuczopNsuz18ZAkBJJ9p28-djNQLzodjCtbwL61HyTq-*\nTag (MEMO) :  *${ctx.from.id}*\n_Warning: For a successful transfer, please make the Tag/Memo correct and make sure you send funds to the wallet address above !!_`, { parse_mode: 'Markdown' });
    ctx.reply('_Your balance will be updated automatically when you deposit successfully!_', { parse_mode: 'Markdown' })

})
bot.hears('📞Contact', (ctx) => {
    ctx.reply('If your problem cannot be resolved while using the bot, please contact admin: @kirra_cheen')
})
bot.command('tinNhan', (ctx) => {
    ctx.reply('Tin nhắn với nút inline', Markup.inlineKeyboard([
        Markup.button.url('Open Google', 'https://www.google.com'),
        Markup.button.callback('Call Me', 'call_me'),
        Markup.button.callback('Text Me', 'text_me')
    ]));
});

// Xử lý callback query khi người dùng nhấn nút inline
bot.action('fixed', (ctx) => ctx.reply('Feature under maintenance'));

bot.action('bot_register', (ctx) => {
    const user = {
        username: ctx.from.username,
        userId: ctx.from.id.toString(),
        firstName: ctx.from.first_name,
    }
    if (user.username === undefined) {
        console.log('Username is undefined !!');
        ctx.reply('You are trying to join a member without a telegram username, set it up in the telegram app\'s settings to continue using the bot!')
        return;
    }
    axios.post(`http://localhost:3008/api/register-bot`, user)
        .then(function (response) {
            console.log(response.data);
            let result = response.data.code;
            if (result === 0) {
                ctx.reply('Join membership successfully. \nPress /menu to open the bot functions')
            }
        })
        .catch(function (error) {
            console.log(error);
        });

});
bot.action('flexible', async (ctx) => {
    ctx.reply('receiving data...');
    const userId = ctx.from.id;
    let data = await controller.getDataFlexible(userId)
    ctx.reply(`Total flexible savings assets: ${data.totalAssets} $TON \nEligible assets: ${data.trueAssets} $TON\nProfit: ${data.unWithdrawn} $TON\nFinalized profit: ${data.withdrawn} $TON`,
        Markup.inlineKeyboard([
            Markup.button.callback('+ capital', 'add_capital_flexible'),
            Markup.button.callback('withdraw', 'withdraw_capital_flexible')
        ]))
})

const withdrawScene = new BaseScene('withdraw');
const acfScene = new BaseScene('addCapitalFlexible'); // acf VIẾT TẮT addCapitalFlexible
const wcfScene = new BaseScene('withdrawnCapitalFlexible');
const walletAddress = new BaseScene('walletAddress');


// ⁡⁢⁣⁣// --Bắt đầu sử lý hành động thêm vốn vào Flexible savings⁡

function feedbackMsg(quantity, userBalance) {
    if (quantity < 0.1) {
        return {
            msgWth: 'Please withdraw a minimum of 0.1 $TON, please try again!',
            msgWcf: 'Please withdraw a minimum of 0.1 $TON, please try again!',
            msgAcf: 'Please add minimum 0.1 $TON, try again!!',
            code: 1
        }
    }
    if (!quantity) {
        return {
            msgWth: 'Invalid action, try again!',
            msgWcf: 'Invalid action, try again!',
            msgAcf: 'Invalid action, try again!',
            code: 1
        }
    }
    if (quantity > userBalance) {
        return {
            msgWth: `You can only withdraw a maximum of ${userBalance} $TON, please try again!`,
            msgWcf: `You can only withdraw a maximum of ${userBalance} $TON, please try again!`,
            msgAcf: `You can only add up to ${userBalance} $TON, start again!`,
            code: 1
        }
    }
    return {
        msgWth: 'Confirmation of withdrawal request in progress!',
        msgWcf: 'Sent request !',
        msgAcf: `Adding ${quantity} $TON to flexible savings`,
        code: 0
    }
}
acfScene.enter((ctx) => {
    ctx.reply('Enter the amount you want to add to the flexible savings package !!');
});
acfScene.on('message', async (ctx) => {
    console.log('add capital scene');
    const userId = ctx.chat.id;
    let userBalance = await getUserBalance(userId);
    let msg = ctx.message.text;
    let quantity = customQuantity(msg);
    let handleAction = feedbackMsg(quantity, userBalance.balance);
    await ctx.telegram.sendMessage(ctx.message.chat.id, handleAction.msgAcf);
    if (handleAction.code === 0) {
        console.log('dps 3');
        let response = await axios.post('http://localhost:3008/api/add-capital-flexible', {
            userId: userId,
            quantity: quantity
        })
        await ctx.telegram.sendMessage(ctx.message.chat.id, `${response.data.result} \n`);
    }
    // Thoát khỏi scene sau khi xử lý xong
    ctx.scene.leave();
})

// //--Bắt đầu xử lý hành động rút vốn ra khỏi Flexible Savings

// ---- ⁡⁣⁢⁣withdrawn⁡⁡ --- ⁡⁢⁢⁢flexible⁡⁡ --- ----- ---- >>>

// Bắt đầu thực hiện chức năng yêu cầu rút tiền
withdrawScene.enter(async (ctx) => {
    const userId = ctx.from.id;
    let userData = await getUserBalance(userId)
    console.log('111', userData);
    if (userData.balance < 0.1) {
        console.log('112');

        ctx.reply('Your balance is less than 0.1 $TON, you can withdraw money when the balance is 0.1 $TON or more!')
        ctx.scene.leave();
        return;
    }
    if (userData.wallet === '') {
        ctx.reply('Please add your wallet address before withdrawing funds! \nTip: Tap Balance in the menu and select my wallet address!')
        ctx.scene.leave();
        return;
    }
    ctx.reply(`Enter the amount you want to withdraw! \nTip: Currently you can withdraw a maximum of ${userData.balance} $TON`)
})
withdrawScene.on('message', async (ctx) => {
    const userId = ctx.from.id;
    const value = customQuantity(ctx.message.text);
    let userBalance = await getUserBalance(userId);
    let handleData = feedbackMsg(value, userBalance.balance);
    await ctx.telegram.sendMessage(ctx.message.chat.id, handleData.msgWth);
    if (handleData.code === 0) {
        let response = await axios.post('http://localhost:3008/api/withdrawn-to-web3', {
            userId,
            value
        })
        await ctx.telegram.sendMessage(ctx.message.chat.id, response?.data?.result || 'Unknown error, please try again!');
    }
    ctx.scene.leave();
})
// kết thúc chức năng rút tiền

wcfScene.enter(ctx => {
    ctx.reply('Enter the amount you want to withdraw from the flexible savings plan!!')
})
wcfScene.on('message', async (ctx) => {
    const userId = ctx.from.id;
    let response = await controller.getDataFlexible(userId)
    let msg = ctx.message.text;
    let quantity = customQuantity(msg);
    let handleAction = feedbackMsg(quantity, response.totalAssets);
    await ctx.telegram.sendMessage(ctx.message.chat.id, handleAction.msgWcf);
    console.log('on msg text 5>>>', favored);
    if (handleAction.code === 0) {
        console.log('wth 3');
        let response = await controller.reqWithdrawnFlexible(quantity, userId)
        console.log('wth dr flex: >>>', response);
        await ctx.telegram.sendMessage(ctx.message.chat.id, `${response?.data?.result} \n`);
    }
    // Thoát khỏi scene sau khi xử lý xong
    ctx.scene.leave();
});
// <<< ---- ⁡⁢⁣⁢withdrawn⁡ -- ⁡⁢⁢⁢flexible⁡ ----
//edit wallet address

walletAddress.enter(async (ctx) => {
    let userWallet = await getUserBalance(ctx.from.id)
    console.log(userWallet);
    if (!userWallet) {
        ctx.reply(reStart)
        ctx.scene.leave();
        return;
    }
    if (userWallet.wallet !== '') {
        ctx.reply(`Your wallet address: ${userWallet.wallet}`);
        ctx.scene.leave();
        return;
    }
    ctx.reply('Please send your TON wallet address to save to your records.\n_Tip: Please add your TON wallet address before making a withdrawal!_', { parse_mode: 'Markdown' })

})
walletAddress.on('message', async (ctx) => {
    console.log(ctx.message.text);
    let response = await axios.post('http://localhost:3008/api/update-wallet', {
        userId: ctx.from.id,
        walletAddress: ctx.message.text
    })
    console.log(response);
    if (response.data) {
        ctx.reply(`${response.data.result}`)
    }
    ctx.scene.leave();
    return;
})

// Tạo Stage và thêm scene vào
const stage = new Stage([acfScene, wcfScene, withdrawScene, walletAddress]);
bot.use(session());
bot.use(stage.middleware());

// hành động tiến vào 1 trạng thái
bot.action('withdraw_capital_flexible', (ctx) => {
    ctx.scene.enter('withdrawnCapitalFlexible')
});
bot.action('add_capital_flexible', (ctx) => {
    ctx.scene.enter('addCapitalFlexible');
});

bot.hears('📤Withdraw', (ctx) => {
    ctx.scene.enter('withdraw')
})
bot.action('wallet_address', ctx => {
    ctx.scene.enter('walletAddress')
})
bot.command('app', ctx => {
    console.log(ctx.chat.id);
    const WEB_APP_URL = `https://b93f-113-185-50-61.ngrok-free.app/dashboard?userId=${ctx.chat.id}`
    ctx.reply(
        "Launch mini app from inline keyboard!",
        Markup.inlineKeyboard([Markup.button.webApp("Launch", WEB_APP_URL)]),
    )
});


console.log('bot is running !!');
bot.launch()