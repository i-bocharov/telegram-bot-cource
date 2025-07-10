const TelegramApi = require('node-telegram-bot-api');
const {gameOptions, againOptions} = require('./options');
const sequelize = require('./db');
const UserModel = require('./models');
const { where } = require('sequelize');
  
const token = '7845987553:AAGGiAC3V0dom-ZlS6dh2Xou15qm0aZbVAs';

const bot = new TelegramApi(token, { polling: true });

const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(chatId, 'Игра началась!');
      
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;
  await bot.sendMessage(chatId, `Я загадал цифру от 0 до 9, попробуй ее отгадать!`, gameOptions);
}

const start = async () => {

  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (e) {
    console.log('База данных не подключена');
  }

  bot.setMyCommands([
    { command: '/start', description: 'Начать работу с ботом' },
    { command: '/info', description: 'Получить информацию о себе' },
    { command: '/game', description: 'Начать игру' },])

  bot.on('message', async msg => {
    if (!msg.chat || !msg.chat.id) {
      console.warn('Нет chat.id в сообщении');
      return;
    }

    const text = msg.text;
    const chatId = msg.chat.id;

    try {   
      if (text === '/start') {
        const [user, created] = await UserModel.findOrCreate({
          where: { chatId },
          defaults: {}
        });

        try {
          await bot.sendSticker(chatId, 'https://cdn.tlgrm.ru/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/96/7.webp ');
        } catch (stickerError) {
          console.error('Ошибка при отправке стикера:', stickerError.message);
        }

        return bot.sendMessage(chatId, `Добро пожаловать в телеграм бот канала \n"Игорь Бочаров / Инвестиции и саморазвитие"`);
      }
      if (text === '/info') {
        const user = await UserModel.findOne({ where: { chatId } });

        if (!user) {
          return bot.sendMessage(chatId, 'Вы ещё не начали взаимодействовать с ботом.');
        }

        return bot.sendMessage(chatId, `Тебя зовут ${msg.from.first_name} ${msg.from.last_name}, в игре у тебя ${user.right} правильных ответов и ${user.wrong} неправильных ответов.`);
      }
      if (text === '/game') {
        return startGame(chatId);
      }

      return bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз!');
    } catch (e) {
      console.error('Ошибка при обработке сообщения:', e.message);

      return bot.sendMessage(chatId, 'Произошла какая-то ошибочка!');
    }   
  });

  bot.on('callback_query', async msg => {
    const data = msg.data;
    const chatId = msg.message.chat.id;

    if (data === '/again') {
      return startGame(chatId);
    }

    if (!(chatId in chats)) {
      return bot.sendMessage(chatId, 'Игра ещё не начата. Напишите /game для начала.');
    }

    const user = await UserModel.findOne({ where: { chatId } });

    if (data == chats[chatId]) {
      user.right += 1;

      await bot.sendMessage(chatId, `Поздравляю, ты отгадал число ${chats[chatId]}!`, againOptions)
    } else {
      user.wrong += 1;

      await bot.sendMessage(chatId, `К сожалению ты не угадал, бот загадал число ${chats[chatId]}. Попробуй еще раз!`, againOptions);
    }

    await user.save();
  });
}

start();