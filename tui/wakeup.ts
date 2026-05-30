import {select,isCancel} from "@clack/prompts";
import chalk from "chalk";
import figlet from "figlet";
import { runCliMode } from "../modes/cli";

const BANNER_FONT = "ANSI Shadow";
const SHADOW = chalk.hex("#5b4d9e");
const FACE = chalk.hex("#e8dcf8").bold;


function printBannnerWithShadow(ascii: string) {
  const bannerLines = ascii.replace(/\s+$/, "").split("\n");
  const maxLen = Math.max(...bannerLines.map(line => line.length), 0);
  const rowWidth = maxLen + 2;

  for (const line of bannerLines) {
    console.log(SHADOW((" " + line ).padEnd(rowWidth)));

}
process.stdout.write(`\x1b[${bannerLines.length}A`);
    for (const line of bannerLines) { 
        console.log(FACE((" " + line).padEnd(rowWidth)));
    }
     console.log();
}






export async function runWakeup() {

 let ascii: string;
    try {
        ascii = figlet.textSync("Vorexis-claw", { font: BANNER_FONT });
        
    }catch (error) {
      ascii = figlet.textSync("Vorexis-claw", { font: "standard" });
    }
    

    printBannnerWithShadow(ascii);


    const mode = await select({
        message:"Welcome to Vorexis-claw! which mode do you want to start with? ",
        options:[
            {value:"cli",label:"CLI"},
            {value:"telegram",label:"Telegram "},
            {value:"exit",label:"Exit"}
        ],
    
    })

    if(isCancel(mode || mode === "exit")){
        console.log(chalk.dim("Exiting..."));
        return;
    }

    if(mode === "cli"){
       await  runCliMode();
    }else if(mode === "telegram"){
        console.log(chalk.green("Starting Vorexis-claw in Telegram bot mode..."));
    } 
}

