---
applyTo: '**'
---

# Memory Management Toolset Usage

All memory-related actions in this project must use the **Memory Management** toolset as defined in `Tools.toolsets.jsonc`. This toolset provides explicit tools for:
- Progress tracking (`updateProgress`)
- Context updates (`updateContext`)
- Decision logging (`logDecision`)
- Project documentation (`updateProjectBrief`, `updateProductContext`, `updateSystemPatterns`, `updateArchitect`)
- Memory viewing (`showMemory`)
- Mode switching (`switchMode`)

## How to Use
- Always use the Memory Management toolset for updating, tracking, and viewing project memory and documentation.
- When recording project progress, use `updateProgress`.
- For context changes, use `updateContext`.
- Log architectural or implementation decisions with `logDecision`.
- Update project briefs, product context, and system patterns using their respective tools.
- Use `showMemory` to view current memory files.
- Switch between memory modes with `switchMode` as needed for context (e.g., architect, code, debug).

## Example Workflow
1. Start a new feature: use `updateContext` to set the current focus.
2. Complete a milestone: use `updateProgress` to mark tasks as done and set next steps.
3. Make a key decision: use `logDecision` to record the rationale.
4. Update documentation: use `updateProjectBrief` or `updateProductContext` as appropriate.
5. Review memory: use `showMemory` to display current state.

Refer to the Memory Management toolset in `Tools.toolsets.jsonc` for the full list of available tools and their descriptions.
