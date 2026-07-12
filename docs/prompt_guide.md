# Prompt Engineering & AI Workflow Guide (Karpathy Method)

This guide documents the **Karpathy Method** for optimizing AI-assisted coding workflows. It is structured into a copyable kickoff template, a library of layered prompts, and workspace-specific configuration practices.

---

## 🚀 Interactive Project Kickoff Template

Copy and paste this prompt when starting a new project or a major feature. It establishes the Spec Layer and structures the workflow into agile cycles:

```markdown
I am building [describe your project]. Before we start coding or writing, please interview me to identify the actual goal and the core decision this project is intended to drive. 

Once we define that, let's break the project into small, agile buckets. We will build one bucket at a time, and I want you to present a plan for each, followed by a checkpoint where I can review the output before we move on. 

Please also verify key decisions explicitly as we go to ensure we don't drift from the original intent.
```

---

## 📚 The Three-Layer Prompt Library

### 1. The Spec Layer
Use these prompts to bridge the gap between human intent and AI execution, ensuring clear project specifications before code is written.

* **Identify the True Goal:**
  > *"Interview me to identify the core goal of this project and the specific decisions this report/output needs to drive."*
* **Enforce Agile Slicing:**
  > *"Bias towards smaller and more compartmentalized specs. Break this large task into smaller buckets with clear, reviewable checkpoints."*
* **Ensure Architectural Precision:**
  > *"Review the spec and make me verify key decisions explicitly to ensure nothing is missed before we start building."*

### 2. The Verifier Layer
Use these prompts to prevent hallucinations, enforce high standards, and systematically test final deliverables.

* **Define Evaluation Criteria:**
  > *"Before you start, outline the specific evaluation criteria you will use to ensure a high-quality final product. Be precise about what 'good' looks like."*
* **Multi-Model Critiquing:**
  > *"Review this complex build/output using a secondary model/perspective to ensure logical consistency and verify the results."*
* **External Verification:**
  > *"Run automated tests, verify compilation/build status, and check output against my expected standards before finishing."*

### 3. The Environment Layer
Optimize your workspace environment and customize agent behaviors using rules and guardrails.

* **Verification Plan Enforcer:**
  Add this rule to your workspace customizations (`.agents/AGENTS.md`):
  > *"Before building anything that requires a multi-step execution, outline a step-by-step verification plan."*
* **Rule-Based Guardrails:**
  Enforce restrictions in `.agents/AGENTS.md` (e.g., preventing edits to legacy code or sensitive paths):
  > *"Do not edit or delete any files in the `/legacy` folder without explicit user confirmation."*
* **Workspace & Workflow Audit:**
  Ask your agent to analyze your repository setup:
  > *"Audit my current repository structure and workflow. Suggest improvements to my workspace rules (.agents/AGENTS.md) and skill definitions to make this an optimized, rule-based environment."*

---

## 💡 Core Philosophy

* **The Simulation Mindset:** Treat the AI as a **robot librarian** or a **statistical simulation** of a developer rather than an autonomous human.
* **Understand, Don't Just Execute:** Focus your energy on deeply understanding the problem space and verifying correctness, delegating the tedious code generation to the AI.
* **Control the Context:** Keep files clean, remove dead weight, and explicitly guide the model's focus to prevent context drift.
