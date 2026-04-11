'use client';

import { useState } from 'react';

export default function AgentCommandCenter() {
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !context) return;
    
    setExecuting(true);
    try {
      // In a real implementation, this would call the agent endpoint
      // For now, we'll simulate the agent response
      const agentResponse = {
        plan: [
          { step: 1, action: "Analyze input data", risk: "low", status: "done" },
          { step: 2, action: "Generate insights", risk: "low", status: "done" },
          { step: 3, action: "Recommended: Export results", risk: "low", status: "pending" }
        ],
        actions_executed: ["analyze_input", "generate_insights"],
        status: "pending_confirmation",
        errors: []
      };
      
      setPlan(agentResponse);
    } catch (error) {
      console.error('Agent error:', error);
    } finally {
      setExecuting(false);
    }
  };

    const handleConfirmAction = (stepIndex: number) => {
    if (!plan?.plan?.[stepIndex]) return;
    
    // Create a new plan array with the step updated
    const updatedPlanSteps = plan.plan.map((step: any, index: number) => {
      if (index === stepIndex) {
        return { ...step, status: "done" };
      }
      return step;
    });
    
    const updatedPlan = {
      ...plan,
      plan: updatedPlanSteps,
      actions_executed: [...plan.actions_executed, plan.plan[stepIndex].action],
      status: plan.plan.every((step: any) => step.status === "done") ? "success" : "pending_confirmation"
    };
    
    setPlan(updatedPlan);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          AI Agent Command Center
        </h1>
        <p className="text-gray-600 mb-8">
          Set goals for the AI agent to execute based on processed content
        </p>
        
        <form onSubmit={handleGoalSubmit} className="mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal for AI Agent
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Summarize the key points and create an action plan"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Context (from previous analysis)
            </label>
            <div className="h-32 w-full border border-gray-300 rounded-md p-3 bg-white">
              {context ? (
                <pre className="text-sm text-gray-600 overflow-auto">{JSON.stringify(context, null, 2)}</pre>
              ) : (
                <p className="text-gray-400 italic">No context available. Process a file first in the Studio.</p>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={executing || !goal.trim() || !context}
            className="w-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 disabled:opacity-50"
          >
            {executing ? 'Processing...' : 'Run Agent'}
          </button>
        </form>
        
        {plan && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Execution Plan
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {plan.plan.map((step: any, index: number) => (
                <div 
                  key={index} 
                  className={`border-b last:border-b-0 p-4 flex items-start space-x-3 ${
                    step.status === 'done' ? 'bg-green-50' : 
                    step.status === 'pending_confirmation' ? 'bg-yellow-50' : 
                    step.status === 'blocked' ? 'bg-red-50' : 
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex-0 w-12 h-12 flex-shrink-0">
                    {step.status === 'done' ? (
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414-1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : step.status === 'pending_confirmation' ? (
                      <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.529 0-2.492-1.646-1.742-2.98l5.58-9.92z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 0a10 10 0 100 20 10 10 0 000-20zM13 16h-2v-2h-2v-2H7v-2h2V7h2v2h2v2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      Step {step.step}: {step.action}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      Risk: {step.risk.toUpperCase()} | Status: {step.status.toUpperCase().replace('_', ' ')}
                    </p>
                    {step.status === 'pending_confirmation' && (
                      <button
                        onClick={() => handleConfirmAction(index)}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Confirm & Execute
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Execution Status
              </h3>
              <p className="text-sm text-gray-600">
                Status: <span className={`font-semibold text-${plan.status === 'success' ? 'green-600' : plan.status === 'failed' ? 'red-600' : 'yellow-600'}`}>
                  {plan.status.toUpperCase().replace('_', ' ')}
                </span>
              </p>
              {plan.actions_executed.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Actions executed: {plan.actions_executed.join(', ')}
                </p>
              )}
              {plan.errors.length > 0 && (
                <div className="mt-2 p-3 bg-red-50 rounded">
                  <h4 className="text-sm font-medium text-red-800 mb-1">Errors:</h4>
                  <ul className="text-xs text-red-600 space-y-1">
                    {plan.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {!plan && !executing && (
          <p className="text-gray-500 text-center py-12">
            Set a goal and run the AI agent to see the execution plan here.
          </p>
        )}
      </div>
    </div>
  );
}