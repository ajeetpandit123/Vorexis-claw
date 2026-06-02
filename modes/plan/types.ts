

export interface PlanStep{
    id: string;
    description: string;
    title: string;
    hints?: string[];
    complexity?: "low" | "medium" | "high";
    
}


export interface Plan {
    goal: string;
    steps: PlanStep[];
    researchSummary?: string;
}