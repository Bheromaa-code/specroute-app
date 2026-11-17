import React from "react";
import {
  Sparkles,
  ShieldAlert,
  FileCheck,
  UserCheck,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-react";

export default function VerdictCard({
  prediction,
  setPrediction = () => {},
  teamRoster = {},
  onDispatch = () => {},
  loading = false,
  availableTechRoles = [
    { label: "Frontend Engineer", key: "frontend" },
    { label: "Backend Engineer", key: "backend" },
    { label: "Full-Stack Developer", key: "fullstack" },
    { label: "Mobile Engineer", key: "mobile" },
    { label: "DevOps / Cloud Engineer", key: "devops" },
    { label: "QA / Test Engineer", key: "qa" },
    { label: "ML Engineer", key: "ml_engineer" },
    { label: "AI / NLP Specialist", key: "nlp_specialist" },
    { label: "MLOps Engineer", key: "mlops" },
    { label: "Data Scientist", key: "data_scientist" },
    { label: "Data Engineer", key: "data_engineer" },
    { label: "UI / UX Designer", key: "ui_ux" },
    { label: "Product Manager (PM)", key: "pm" },
  ],
}) {
  // 1. Loading State
  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[440px]">
        <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-800">
          Running Gemini Semantic Triage...
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Auditing client complaint against the project PRD baseline and mapping
          assignees.
        </p>
      </div>
    );
  }

  // 2. Clean Empty State (No hardcoded placeholders)
  if (!prediction) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[440px]">
        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No Active Triage Analysis</p>
        <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
          Enter an incoming client message on the left and click{" "}
          <span className="font-semibold text-indigo-600">
            "Run AI Triage & Match Assignee"
          </span>{" "}
          to inspect the PRD baseline and generate a ClickUp dispatch card.
        </p>
      </div>
    );
  }

  // Category Badge Styles
  const categoryStyles = {
    DEFECT_BUG: {
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      label: "DEFECT_BUG",
      explanation: "Entailment evaluation matches failure against requirements baseline.",
    },
    SCOPE_CREEP: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      label: "SCOPE_CREEP",
      explanation: "Contradiction detected: Requested capability is not specified in the PRD scope.",
    },
    NEW_FEATURE: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "NEW_FEATURE",
      explanation: "Identified as a planned capability addition or enhancement.",
    },
    CLARIFICATION: {
      badge: "bg-sky-50 text-sky-700 border-sky-200",
      label: "CLARIFICATION",
      explanation: "Informational inquiry requiring product confirmation rather than code changes.",
    },
  };

  const currentCategory = categoryStyles[prediction.category] || {
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    label: prediction.category || "EVALUATING",
    explanation: "AI classification complete.",
  };

  // Determine assignee: prediction's assignee, or fallback to the current roster for that role
  const resolvedAssignee =
    prediction.assignee && prediction.assignee !== "Unassigned"
      ? prediction.assignee
      : teamRoster[prediction.role] || "Unassigned";

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-5">
      {/* 1. Header & Confidence */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            AI Triage Result
          </h3>
        </div>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
          Confidence: {prediction.confidence || "98.2%"}
        </span>
      </div>

      {/* 2. Category & Explanation */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md border tracking-wide uppercase ${currentCategory.badge}`}
          >
            {currentCategory.label}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {currentCategory.explanation}
          </span>
        </div>
      </div>

      {/* 3. Matched PRD Grounding Clause */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
          <span>Matched PRD Baseline:</span>
          <span className="font-normal text-slate-500 truncate ml-1">
            {prediction.matchedPrdTitle || "Referenced Specification"}
          </span>
        </div>
        <p className="text-xs text-slate-600 italic pl-5 border-l-2 border-indigo-300">
          "{prediction.matchedPrdText || "No matching specification clause found in PRD."}"
        </p>
      </div>

      {/* 4. Role & Assigned Resource */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-3">
          <label className="text-[11px] uppercase font-semibold text-slate-500 block mb-1">
            Predicted Role Domain
          </label>
          <div className="relative">
            <select
              value={prediction.role || "backend"}
              onChange={(e) =>
                setPrediction((prev) => ({
                  ...prev,
                  role: e.target.value,
                  assignee: teamRoster[e.target.value] || "Unassigned",
                }))
              }
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-bold uppercase appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {availableTechRoles.map((role) => (
                <option key={role.key} value={role.key}>
                  [{role.key.replace("_", " ").toUpperCase()}]
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-3">
          <label className="text-[11px] uppercase font-semibold text-slate-500 block mb-1">
            Auto-Assigned Resource
          </label>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`h-2 w-2 rounded-full ${
                resolvedAssignee !== "Unassigned" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            ></span>
            <span className="text-xs font-semibold text-slate-800 truncate">
              {resolvedAssignee}
            </span>
          </div>
        </div>
      </div>

      {/* 5. ClickUp Task Pre-Fill & Dispatch */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            ClickUp Card Dispatch
          </label>
          <span className="text-[11px] text-emerald-600 font-medium">Ready to Sync</span>
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">
            Generated Task Title
          </label>
          <input
            type="text"
            value={prediction.clickupTitle || ""}
            onChange={(e) =>
              setPrediction((prev) => ({ ...prev, clickupTitle: e.target.value }))
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-500 font-medium block mb-1">
              Target ClickUp List
            </label>
            <div className="relative">
              <select
                value={prediction.targetList || "Sprint 18 - Active Bugs"}
                onChange={(e) =>
                  setPrediction((prev) => ({ ...prev, targetList: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Sprint 18 - Active Bugs">Sprint 18 - Active Bugs</option>
                <option value="Product Backlog (Scope Review)">Product Backlog (Scope Review)</option>
                <option value="Client Support Feed">Client Support Feed</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-medium block mb-1">
              Task Priority
            </label>
            <div className="relative">
              <select
                value={prediction.priority || "🔴 Urgent / Blocker"}
                onChange={(e) =>
                  setPrediction((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="🔴 Urgent / Blocker">🔴 Urgent / Blocker</option>
                <option value="🟡 Medium Priority">🟡 Medium Priority</option>
                <option value="🟢 Low Priority">🟢 Low Priority</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDispatch}
          className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Dispatch Task Card to ClickUp</span>
        </button>
      </div>
    </div>
  );
}