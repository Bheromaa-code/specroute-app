import React, { useState } from "react";
import {
  PanelLeft,
  Bell,
  Cpu,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function Navbar({ sidebarOpen, setSidebarOpen, activeProject }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Simulated notifications relevant to a PM triage workflow
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New WhatsApp message received",
      desc: "Incoming report from Alex Rivera (Client CEO)",
      time: "2m ago",
      unread: true,
    },
    {
      id: 2,
      title: "ClickUp Task Synced",
      desc: "Task #CLK-841 assigned to Marcus Vance",
      time: "15m ago",
      unread: true,
    },
    {
      id: 3,
      title: "PRD Baseline Indexed",
      desc: "v2_Core_Specs.md chunking complete (42 chunks)",
      time: "1h ago",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 relative">
      {/* LEFT: Sidebar Toggle & Active Project Display */}
      <div className="flex items-center space-x-3">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
            title="Expand Sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-900 font-semibold text-base tracking-tight">
            {activeProject}
          </span>
        </div>
      </div>

      {/* RIGHT: Model Status & Notification Bar */}
      <div className="flex items-center space-x-4">
        

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-xs transition ${
                      n.unread ? "bg-indigo-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-normal">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}