import asyncio
import os
import sys
import uuid

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.join(os.getcwd(), ".."))

from app.services.multimodal_pipeline import MultimodalPipeline
from app.api.agent_routes import planner

async def test_full_system():
    print("--- 🔍 Starting System Logic Verification ---")
    pipeline = MultimodalPipeline()
    
    # 1. Test Multimodal Pipeline (Studio Logic)
    print("\n[1/3] Testing Studio Pipeline...")
    test_file_path = "../../frontend/reference_resume_professional.pdf"
    
    if os.path.exists(test_file_path):
        with open(test_file_path, "rb") as f:
            content = f.read()
        
        print(f"File loaded: {test_file_path} ({len(content)} bytes)")
        
        try:
            # This was causing 'coroutine' errors before
            result = await pipeline.process_input(
                file_content=content,
                filename="reference_resume_professional.pdf",
                user_goal="Summarize this profile"
            )
            
            print("✅ Pipeline Success!")
            print(f"Summary Snippet: {result.get('summary', '')[:100]}...")
            print(f"Input Type: {result.get('input_type')}")
            print(f"Confidence: {result.get('confidence_score')}")
            
            # Verify Agent result was correctly awaited
            agent_res = result.get('agent_result', {})
            if agent_res.get('status') in ['success', 'pending']:
                print("✅ Agent Integration Success! (Plan was awaited)")
            else:
                print(f"⚠️ Agent Status: {agent_res.get('status')}")
                
        except Exception as e:
            print(f"❌ Pipeline Failed: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"⚠️ Test file not found: {test_file_path}")

    # 2. Test Agent Planning (Agent Tab Logic)
    print("\n[2/3] Testing Neural Agent Planner...")
    try:
        context = {"summary": "Experienced software engineer with 5 years in AI."}
        goal = "Draft a cover letter for a Senior Developer role."
        
        # Verify both generation and execution (were missing wait/async before)
        plan = await planner.generate_plan(goal, context)
        print(f"✅ Plan Generated: {len(plan.get('plan', []))} steps")
        
        exec_result = await planner.execute_plan(plan, context)
        print(f"✅ Plan Executed: Status {exec_result.get('status')}")
        
    except Exception as e:
        print(f"❌ Agent Planner Failed: {e}")

    # 3. Test API Key Connectivity (RAG/Fusion Logic)
    print("\n[3/3] Testing AI Connectivity (OpenRouter)...")
    try:
        from app.core.ai_client import ai_client
        response = await ai_client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello. Identify yourself."}],
            max_tokens=20
        )
        print(f"✅ API Auth Success! AI says: {response.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"❌ API Auth Failed: {e}")

    print("\n--- ✨ All Tests Complete ---")

if __name__ == "__main__":
    asyncio.run(test_full_system())
