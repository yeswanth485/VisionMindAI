export type ActionStep = {
  step: number;
  action: string;
  risk: 'low' | 'medium' | 'high';
  status: 'pending' | 'done' | 'blocked' | 'pending_confirmation' | 'failed';
  result?: any;
  error?: string;
};

export type AgentPlan = {
  plan: ActionStep[];
  actions_executed: string[];
  status: 'success' | 'failed' | 'pending_confirmation' | 'in_progress';
  errors: string[];
};