import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import ClientIntakeCard from "./clientIntakeCard";
import DispatchedFeed from "./dispatchedFeed";
import VerdictCard from "./verdictCard";
import AuthModal from "./authModal";

const API_BASE = import.meta.env.VITE_API_URL || 'http://${window.location.hostname}:8000';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Authenticated user persisted in localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("specroute_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Clean initial intake states
  const [channel, setChannel] = useState("WhatsApp");
  const [sender, setSender] = useState("");
  const [clientMessage, setClientMessage] = useState("");

  // AI Verdict states (null until evaluated)
  const [prediction, setPrediction] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Dispatched feed states
  const [dispatchedHistory, setDispatchedHistory] = useState([]);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem("specroute_user", JSON.stringify(userData));
    setProjects([]);
    setActiveProjectId(null);
    setPrediction(null);
    setDispatchedHistory([]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("specroute_user");
    setProjects([]);
    setActiveProjectId(null);
    setPrediction(null);
    setDispatchedHistory([]);
  };

  // Fetch projects scoped to the active user
  const fetchProjects = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/projects?user_id=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          setActiveProjectId(data[0].id);
        } else {
          setActiveProjectId(null);
        }
      }
    } catch (err) {
      console.warn("Could not fetch user projects:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  // Fetch dispatched history whenever the active project changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser || !activeProjectId) {
        setDispatchedHistory([]);
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE}/api/tasks?project_id=${activeProjectId}&user_id=${currentUser.id}`
        );
        if (res.ok) {
          const tasks = await res.json();
          setDispatchedHistory(tasks);
        }
      } catch (err) {
        console.warn("Failed fetching tasks:", err);
      }
    };
    fetchTasks();
    setPrediction(null);
  }, [activeProjectId, currentUser]);

  const activeProjectData = projects.find((p) => p.id === activeProjectId) || null;

  // Create Project
  const handleAddProject = async (name) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/projects?user_id=${currentUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setProjects((prev) => [...prev, created]);
        setActiveProjectId(created.id);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create project");
      }
    } catch (err) {
      console.error("Project creation error:", err);
      alert("Backend connection failed.");
    }
  };

  // Team Roster Update
  const handleSetTeamRoster = async (rosterOrUpdater) => {
    if (!activeProjectData) return;
    const currentRoster = activeProjectData.team_roster || {};
    const newRoster =
      typeof rosterOrUpdater === "function" ? rosterOrUpdater(currentRoster) : rosterOrUpdater;

    setProjects((prev) =>
      prev.map((p) => (p.id === activeProjectData.id ? { ...p, team_roster: newRoster } : p))
    );

    try {
      await fetch(`${API_BASE}/api/projects/${activeProjectData.id}/roster`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roster: newRoster }),
      });
    } catch (err) {
      console.error("Roster sync error:", err);
    }
  };

  // PRD Upload Handler
  const handleUploadPrd = async (projectId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/projects/${projectId}/upload-prd`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, prd_filename: result.prd_filename, prd_status: "indexed" }
              : p
          )
        );
      } else {
        const err = await res.json();
        alert(err.detail || "Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to connect to backend upload endpoint.");
    }
  };

  // Run AI Triage via Gemini
  const handleRunTriage = async () => {
    if (!activeProjectData) {
      alert("Please create or select an active project first.");
      return;
    }
    if (!clientMessage.trim()) {
      alert("Please enter a client complaint message.");
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await fetch(`${API_BASE}/api/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: activeProjectData.id,
          client_message: clientMessage,
          channel: channel,
          sender: sender || "Anonymous Client",
        }),
      });

      if (res.ok) {
        const verdict = await res.json();
        setPrediction(verdict);
      } else {
        alert("Gemini analysis request failed.");
      }
    } catch (err) {
      console.error("Triage error:", err);
      alert("Backend connection error with Gemini API.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Dispatch ClickUp Ticket
  const handleDispatch = async () => {
    if (!prediction || !activeProjectData || !currentUser) return;

    try {
      const res = await fetch(`${API_BASE}/api/tasks?user_id=${currentUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: activeProjectData.id,
          title: prediction.clickupTitle,
          category: prediction.category,
          role: prediction.role,
          assignee: prediction.assignee || "Unassigned",
          priority: prediction.priority,
          prd_reference: prediction.matchedPrdText,
        }),
      });

      if (res.ok) {
        const savedTask = await res.json();
        setDispatchedHistory((prev) => [savedTask, ...prev]);
        setPrediction(null);
        setClientMessage("");
        if (savedTask.clickup_url) {
          alert(`Task pushed to ClickUp! ID: ${savedTask.id}`);
        }
      }
    } catch (err) {
      console.error("Failed to dispatch task:", err);
    }
  };

  // Unauthenticated Barrier
  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans text-base">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeProject={activeProjectData?.name || ""}
        setActiveProject={(name) => {
          const found = projects.find((p) => p.name === name);
          if (found) setActiveProjectId(found.id);
        }}
        projects={projects}
        teamRoster={activeProjectData?.team_roster || {}}
        setTeamRoster={handleSetTeamRoster}
        activeProjectData={activeProjectData}
        onUploadPrd={handleUploadPrd}
        onAddProject={handleAddProject}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeProject={activeProjectData?.name || "No Project Selected"}
        />

        <main className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6 flex flex-col">
            <ClientIntakeCard
              channel={channel}
              setChannel={setChannel}
              sender={sender}
              setSender={setSender}
              clientMessage={clientMessage}
              setClientMessage={setClientMessage}
              onRunTriage={handleRunTriage}
              loading={isEvaluating}
            />

            <DispatchedFeed dispatchedHistory={dispatchedHistory} />
          </div>

          <div className="w-full">
            <VerdictCard
              prediction={prediction}
              setPrediction={setPrediction}
              teamRoster={activeProjectData?.team_roster || {}}
              onDispatch={handleDispatch}
              loading={isEvaluating}
            />
          </div>
        </main>
      </div>
    </div>
  );
}