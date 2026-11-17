import React, { useState, useRef } from "react";
import {
  Zap,
  PanelLeftClose,
  Upload,
  ChevronDown,
  Users,
  Plus,
  Trash2,
  FolderPlus,
  X,
  LogOut
} from "lucide-react";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeProject,
  setActiveProject,
  projects = [],
  teamRoster = {},
  setTeamRoster = () => {},
  onUploadPrd,
  activeProjectData,
  onAddProject,
  currentUser,
  onLogout,
}) {
  const fileInputRef = useRef(null);
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const safeRoster = teamRoster || {};
  const prdStatus = activeProjectData?.prd_status || "missing";
  const prdFilename = activeProjectData?.prd_filename || "No PRD uploaded";

  const statusStyles = {
    indexed: {
      dot: "bg-emerald-500",
      ping: "bg-emerald-400",
      label: "Ready / Indexed",
    },
    processing: {
      dot: "bg-amber-500",
      ping: "bg-amber-400",
      label: "Processing Chunks",
    },
    missing: {
      dot: "bg-rose-500",
      ping: "bg-rose-400",
      label: "Missing PRD",
    },
  };

  const availableTechRoles = [
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
  ];

  const [selectedRoleKey, setSelectedRoleKey] = useState("frontend");
  const [memberInputName, setMemberInputName] = useState("");

  const handleLogoClick = () => {
    window.location.reload();
  };

  const handleUploadButtonClick = () => {
    if (!activeProjectData?.id) {
      alert("Please create or select an active project first before uploading a PRD.");
      setNewProjectModal(true);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onUploadPrd && activeProjectData?.id) {
      onUploadPrd(activeProjectData.id, file);
    }
    e.target.value = "";
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!memberInputName.trim()) return;

    setTeamRoster((prev) => ({
      ...(prev || {}),
      [selectedRoleKey]: memberInputName.trim(),
    }));

    setMemberInputName("");
  };

  const handleRemoveMember = (roleKey) => {
    setTeamRoster((prev) => {
      const updated = { ...(prev || {}) };
      delete updated[roleKey];
      return updated;
    });
  };

  const handleNameChange = (roleKey, newName) => {
    setTeamRoster((prev) => ({
      ...(prev || {}),
      [roleKey]: newName,
    }));
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    if (onAddProject) {
      onAddProject(newProjectName.trim());
    }
    setNewProjectName("");
    setNewProjectModal(false);
  };

  const getInitials = (name) => {
    if (!name) return "PM";
    return name
      .trim()
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <aside
        className={`${
          sidebarOpen ? "w-84" : "w-0"
        } transition-all duration-300 ease-in-out border-r border-slate-200 bg-white flex flex-col overflow-hidden relative shrink-0 shadow-sm`}
      >
        {/* BRAND HEADER */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-2.5 text-left cursor-pointer group focus:outline-none"
            title="Click to refresh"
          >
            <div className="h-9 w-9 rounded-lg bg-indigo-600 group-hover:bg-indigo-700 transition flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900 text-base leading-none block">
                SpecRoute
              </span>
              <span className="text-xs text-slate-500 font-medium">
                PM AI Assistant
              </span>
            </div>
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Upload PRD Action */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.md"
              className="hidden"
            />
            <button
              type="button"
              onClick={handleUploadButtonClick}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100/90 border border-indigo-200 text-indigo-700 py-2.5 px-3 rounded-lg font-medium text-sm transition cursor-pointer shadow-xs"
            >
              <Upload className="h-4 w-4 text-indigo-600" />
              <span>Upload Project PRD</span>
            </button>
          </div>

          {/* Project Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                Active Project
              </label>
              {onAddProject && (
                <button
                  type="button"
                  onClick={() => setNewProjectModal(true)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span>+ New</span>
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={activeProject || ""}
                onChange={(e) => setActiveProject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer shadow-xs"
              >
                {projects.length === 0 ? (
                  <option value="">No projects yet — create one</option>
                ) : (
                  projects.map((proj) => (
                    <option key={proj.id} value={proj.name}>
                      {proj.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3.5 top-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* PRD Status Indicator */}
            <div className="mt-2.5 flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="relative flex h-2.5 w-2.5 shrink-0"
                  title={statusStyles[prdStatus]?.label || "Status"}
                >
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                      statusStyles[prdStatus]?.ping || "bg-rose-400"
                    } opacity-75`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      statusStyles[prdStatus]?.dot || "bg-rose-500"
                    }`}
                  ></span>
                </span>
                <span className="font-medium text-slate-700 truncate" title={prdFilename}>
                  {prdFilename}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono uppercase">
                {prdStatus}
              </span>
            </div>
          </div>

          {/* TEAM ROSTER */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-500" />
                <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                  Project Team Roster
                </label>
              </div>
              <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full font-medium">
                {Object.keys(safeRoster).length} Assigned
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Add engineering roles needed for this project:
            </p>

            {/* ADD ROLE FORM */}
            <form
              onSubmit={handleAddMember}
              className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mb-4 space-y-2"
            >
              <div className="relative">
                <select
                  value={selectedRoleKey}
                  onChange={(e) => setSelectedRoleKey(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {availableTechRoles.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Assignee name (e.g. Sarah Obi)"
                  value={memberInputName}
                  onChange={(e) => setMemberInputName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* ROSTER LIST */}
            <div className="space-y-2.5">
              {Object.keys(safeRoster).length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-3">
                  No roles assigned yet. Add one above.
                </p>
              ) : (
                Object.entries(safeRoster).map(([roleKey, personName]) => {
                  const roleDef = availableTechRoles.find((r) => r.key === roleKey);
                  const roleTitle = roleDef ? roleDef.label : roleKey;

                  return (
                    <div
                      key={roleKey}
                      className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5 group hover:border-slate-300 transition"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{roleTitle}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(roleKey)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                          title="Remove role from this project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={personName}
                        onChange={(e) => handleNameChange(roleKey, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="h-8 w-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs shrink-0 border border-indigo-200">
                {getInitials(currentUser?.full_name)}
              </div>
            )}
            <div className="truncate">
              <span className="font-semibold text-slate-800 block text-xs leading-none truncate">
                {currentUser?.full_name || "Project Manager"}
              </span>
              <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                {currentUser?.email || "Signed In"}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer flex items-center"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* CREATE PROJECT MODAL */}
      {newProjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900">
                Create New Project
              </h3>
              <button
                onClick={() => setNewProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. E-Commerce Core API"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewProjectModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}