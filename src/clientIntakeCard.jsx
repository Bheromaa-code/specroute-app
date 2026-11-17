import React from "react";
import { MessageSquare, Sparkles } from "lucide-react";

export default function ClientIntakeCard({
  channel,
  setChannel,
  sender,
  setSender,
  clientMessage,
  setClientMessage,
  onRunTriage,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          Client Message Ingestion
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Paste raw client feedback to cross-examine against your project PRD scope.
      </p>

      {/* Channel & Sender Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-slate-600 font-medium block mb-1">
            Source Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          >
            <option value="WhatsApp">🟢 WhatsApp Feed</option>
            <option value="Slack">🟣 Slack Channel</option>
            <option value="Email">🔵 Client Email</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600 font-medium block mb-1">
            Sender Name
          </label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Message Area */}
      <div className="mb-4">
        <label className="text-xs text-slate-600 font-medium block mb-1">
          Client Complaint
        </label>
        <textarea
          rows={5}
          value={clientMessage}
          onChange={(e) => setClientMessage(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none font-sans"
          placeholder="Paste WhatsApp message or email text here..."
        />
      </div>

      {/* Trigger Button */}
      <button
        onClick={onRunTriage}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm shadow-indigo-200"
      >
        <Sparkles className="h-4 w-4" />
        <span>Run AI Assistant</span>
      </button>
    </div>
  );
}