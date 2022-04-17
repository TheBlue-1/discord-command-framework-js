import { Bot, initGlobalErrorHandlers } from 'discord-command-framework-js';

import * as config from './local.config.json';
import * as TestCommandGroups from './testCommandGroups';

TestCommandGroups; //init (doesn't remove import)

function start() {
  initGlobalErrorHandlers();
  const token = config.token;

  const bot = new Bot(token);

  bot.start();
}
start();
