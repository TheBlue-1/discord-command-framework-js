import { Bot, initGlobalErrorHandlers } from "discord-command-framework-js";
import { logger } from "../../src/logger";
import "./testCommandGroups";

const localConfigPath = "./local.config.json";

async function readConfig() {
  const config = (await import(localConfigPath)) as unknown;

  const token =
    typeof config === "object" &&
    config &&
    "token" in config &&
    typeof config.token === "string"
      ? config.token
      : undefined;

  if (token === undefined) {
    throw new Error("Token missing in local.config.json");
  }

  return { token };
}

async function start() {
  initGlobalErrorHandlers();
  const config = await readConfig();
  const { token } = config;

  const bot = new Bot(token);

  await bot.start();
}
start().catch((err) => {
  logger.error(err);
});
