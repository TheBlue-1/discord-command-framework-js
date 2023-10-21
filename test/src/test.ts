import { Bot, initGlobalErrorHandlers } from "discord-command-framework-js";

import * as config from "./local.config.json";
import "./testCommandGroups";

function start() {
  initGlobalErrorHandlers();
  const token = config.token;

  const bot = new Bot(token);

  bot.start();
}
start();
