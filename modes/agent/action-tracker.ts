import type {ActionLog,ActionStatus} from "./types.ts";
import  {isMutationType} from "./types.ts";


export class actionTracker {

        private actions: ActionLog[] = [];
    
     log(
        entry: Omit<ActionLog, 'id' | 'timestamp' >  & {
            id?: string;
            timestamp?: Date;
        },
           
     ):ActionLog {
          const action:ActionLog = {
            id:entry.id ?? `action_${this.actions.length}`,
            timestamp: entry.timestamp ?? new Date(),
            type: entry.type,
            status: entry.status ?? 'pending',  
            path: entry.path,
            details: {...entry.details},
            userApproved: entry.userApproved,
          };

           this.actions.push(action);
          return action;
     }

     getAction():readonly ActionLog[] {
        return this.actions;
     }

     getPendingMutations():ActionLog[] {
        return this.actions.filter(action => isMutationType(action.type) && action.status === 'pending');
     }

     updateStatus(id: string, status: ActionStatus , userApproved: boolean): void {
        const action = this.actions.find((x) => x.id === id);
        if (!action) return;
        action.status = status;
        if(userApproved !== undefined) {
            action.userApproved = userApproved;
        }   
    }
}