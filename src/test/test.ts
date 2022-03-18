import { Bot } from '../bot';
import { initGlobalErrorHandlers } from '../error-handling';
import * as config from './local.config.json';
import * as TestCommandGroups from './testCommandGroups';

TestCommandGroups;//init (dont removes import)

function start() {
  initGlobalErrorHandlers();
  const token = config.token
  const applicationId = config.applicationId

  const bot = new Bot(applicationId, token);

  bot.start();
}
start();
