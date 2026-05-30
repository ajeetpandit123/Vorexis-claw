import chalk from "chalk";
import{select,isCancel} from "@clack/prompts";
import { runAgentMode } from "./agent/orchestrator";



export async function runCliMode(){

    while(true){
        const mode = await select({
            message:"choose CLI sub-mode",
            options:[
                {value:"agent",label:"agent Mode"},
                {value:"plan",label:"plan Mode"},
                {value:"ask",label:"Ask mode"},
                {value:"back",label:"Back to main menu"}
            ]   
        });

        if(isCancel(mode) || mode === "back") return;

        if(mode === "agent"){
           await runAgentMode();
    }
    if(mode === "plan"){
        console.log(chalk.green("Starting plan mode...")); 
    }       
    if(mode === "ask"){
        console.log(chalk.green("Starting ask mode...")); 
    }   

    if(mode !== "agent" && mode !== "plan" && mode !== "ask"){
        console.log(chalk.red("Invalid mode selected. Please try again."));
    }   
}

}
