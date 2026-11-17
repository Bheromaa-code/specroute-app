import React from "react";
import { Clock, ExternalLink } from "lucide-react";

export default function DispatchedFeed({ dispatchedHistory = [] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 flex flex-col shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Recently Dispatched to ClickUp
          </h3>
        </div>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto">
        {dispatchedHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">No tasks dispatched yet.</p>
        ) : (
          dispatchedHistory.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 text-[11px]">{item.timeAgo}</span>
                <span
                  className={`px-2 py-0.5 rounded-full border text-[8px] font-semibold ${
                    item.category === "DEFECT_BUG"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : item.category === "SCOPE_CREEP"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {item.category}
                </span>
                
              </div>
              <p className="text-xs text-slate-800 font-medium line-clamp-1 mb-2">
                {item.title}
              </p>
              <div className="flex items-center justify-between text-[11px]">
                
                <span className="text-slate-500">
                  Assigned: <strong className="text-slate-700">{item.assignee}</strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}