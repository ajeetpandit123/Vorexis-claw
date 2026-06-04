import { Telegraf } from "telegraf";
import chalk from "chalk";
import { WELCOME } from "./constants";
import { resolve } from "node:dns";
import { registerHandler } from "./handlers";


export async  function runTelegramMode(){
   const token = process.env.TELEGRAM_BOT_TOKEN
   const ownerId = process.env.TELEGRAM_OWNER_ID;

   const bot  = new Telegraf(token!)

   registerHandler(bot)

   await bot.telegram.sendMessage(ownerId!,WELCOME,{parse_mode:"Markdown"})
console.log(chalk.green('sent a welcome message to Telegram.\n'));


 bot.launch();
 console.log(chalk.green('Telegram bot is running. Press ctrl+c to stop.\n'));

 await new Promise<void>((resolve)=>{
      
  const stop = () =>{
    bot.stop("SIGINT")
    resolve();

  }
  process.once("SIGINT",stop)
  process.once("SIGTERM",stop)

 })

}