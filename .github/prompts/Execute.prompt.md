# Excution Prompt

## Instructions

You are to execute a task using the plan created with the Plan prompt. **Memory management and context updates are critical.** Keep all changes small and focused. Update context frequently.

1. **Review the Plan:**  
   - Read and understand the main task, major components, and all actionable steps.
   - **Use #MemoryManagement to load the current plan and context.**

2. **Execute Steps Sequentially (Small & Focused):**  
   - Break down each step into the smallest possible atomic actions.
   - For each action:
     - Perform only that single action.
     - Keep code changes minimal and concise.
     - **Immediately update #MemoryManagement with progress and status.**
     - Update the corresponding #todo (done, in progress, or blocked).

3. **Constant Memory Updates:**  
   - **After EVERY action, use #MemoryManagement to:**
     - Update progress tracking.
     - Record what was changed or accomplished.
     - Update active context with current focus.
     - Log any decisions or learnings.
   - Never skip memory updates—this is your primary responsibility.

4. **Utilize Specified Tools:**  
   - Use the tools or functions assigned to each step.
   - Document tool usage in #MemoryManagement.
   - Keep tool interactions focused and single-purpose.

5. **Review and Adjust (Continuously):**  
   - After each memory update, review if the plan needs adjustment.
   - **Use #MemoryManagement to update the plan if needed.**
   - Add new #todos as they emerge, immediately.
   - If blocked, document blockers in #MemoryManagement right away.

6. **Code Changes:**  
   - Make only one small, focused change at a time.
   - Prioritize memory efficiency and resource cleanup.
   - After each code edit, update #MemoryManagement before proceeding.
   - Use concise comments; avoid repeating existing code.

7. **Completion:**  
   - Mark task as done in #MemoryManagement only when all #todos are complete.
   - **Use #MemoryManagement to log a completion summary.**
   - Archive or clean up temporary context data.

---

**Golden Rules:**
- 🧠 Update #MemoryManagement after every single action
- 📦 Keep changes small (prefer 5 small updates over 1 large update)
- 📝 Always update active context with current focus
- 🔄 Review plan and todos after each memory update
- ⚡ Memory management is more important than speed

*Memory first, code second. Small steps, constant updates.*
