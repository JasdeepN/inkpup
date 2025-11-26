# Task Breakdown and Action Plan Prompt

**⚠️ CRITICAL: THIS FILE IS READ-ONLY ⚠️**
**DO NOT MODIFY THIS PROMPT FILE. It is a template for agent workflows.**
**All work, plans, and context must be saved to memory-bank/, NOT here.**


## Instructions

Use this prompt to break down any complex task into actionable steps, assign #todos for each, and utilize available tools for tracking and execution. Each step should be clear, specific, and saved to #MemoryManagement for progress tracking.

**Important:** This prompt template is for planning only. All generated plans, tasks, and progress must be saved to the Memory Management system, NOT to this prompt file.

---

## ⚠️ Mandatory Outputs

**Every Plan phase MUST produce BOTH:**

1. **Plan File** → `memory-bank/plan-<feature>-<YYYY-MM-DD>.md`
2. **Memory Updates** → Update `activeContext.md`, `progress.md`, `decisionLog.md`

**Do not skip either output.** The plan file is the artifact; memory updates maintain continuity.

---

## 1. Define the Main Task

**Task:**  
<Describe the main objective or project here.>

---

## 2. Break Down the Task

**Major Components or Steps:**  
- <Step 1>
- <Step 2>
- <Step 3>
- ...

---

## 3. Outline Actionable Steps for Each Component

### Step 1: <Step Name>
- <Action 1>
- <Action 2>
- ...

### Step 2: <Step Name>
- <Action 1>
- <Action 2>
- ...

---

## 4. Assign #todos

For each actionable step, create a #todo:

- #todo <Action 1 of Step 1>
- #todo <Action 2 of Step 1>
- #todo <Action 1 of Step 2>
- ...

---

## 5. Utilize Tools

For each step, specify which tools or functions to use (e.g., code generation, unit testing, project management):

- <Step/Action>: <Tool/Function>
- ...

---

## 6. Save Plan & Update Memory

**⚠️ MANDATORY: Complete BOTH steps.**

### Step 1: Create Plan File

**Filename:** `memory-bank/plan-<feature-slug>-<YYYY-MM-DD>.md`

*(Example: `memory-bank/plan-image-gallery-2025-11-26.md`)*

Include in the file:
- Task definition and scope
- Breakdown of steps with #todos
- Tools and dependencies
- Success criteria
- Link to research brief (if exists)

### Step 2: Update Memory (ALL required)

```
#MemoryManagement updateContext "Planning: <feature> — Plan: plan-<feature>-<date>.md"
#MemoryManagement updateProgress "Done: Plan for <feature>; Doing: <first todo>; Next: <remaining todos>"
#MemoryManagement logDecision "<planning decision>" "Context: <rationale>" (if significant choices made)
```

**Checklist before proceeding to Execute:**
- [ ] Plan file created in `memory-bank/`
- [ ] `activeContext.md` updated with plan link
- [ ] `progress.md` updated with todos
- [ ] Planning decisions logged (if any)

**Do NOT modify this prompt file** - it is a template for creating plans, not for storing them.

---

## 7. Review and Adjust

Plan for periodic reviews and adjust steps as needed based on feedback or new information.

**Review Checklist:**

**⚠️ Required Artifacts (MUST have both):**
- [ ] **Plan file created:** `memory-bank/plan-<feature>-<YYYY-MM-DD>.md`
- [ ] **Memory updated:**
  - [ ] `activeContext.md` — current focus + link to plan file
  - [ ] `progress.md` — todos with status
  - [ ] `decisionLog.md` — planning decisions (if any)

---

## Example

**Task:** Develop a new feature for the web application.

**Major Components:**
- Research requirements
- Design the feature
- Implement the code
- Test the feature
- Deploy the feature

**Actionable Steps & #todos:**
- #todo Review existing documentation
- #todo Conduct user interviews
- #todo Create wireframes
- #todo Write implementation code
- #todo Write unit tests
- #todo Deploy to staging

**Tools:**
- Research: Documentation tools, #MemoryManagement for context retrieval
- Design: Figma, Memory Management for design decisions
- Implementation: Code editor, Copilot, Memory Management for patterns
- Testing: Unit test framework, Memory Management for test strategies
- Deployment: CI/CD pipeline, Memory Management for deployment logs

**Memory Management Usage:**
- Save plan: `#MemoryManagement updateProjectBrief`
- Track progress: `#MemoryManagement updateProgress`
- Log decisions: `#MemoryManagement logDecision`
- Update context: `#MemoryManagement updateContext`

---

*Use this template for each new task to ensure clarity, accountability, and progress tracking. All generated content should be saved to #MemoryManagement, not to this template file.*

---

