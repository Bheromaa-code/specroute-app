import os
import shutil
import random
from contextlib import asynccontextmanager
from typing import Dict, List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import SessionLocal, Project, TeamMember, User, DispatchedTask, init_db
from aiEngine import run_gemini_triage
from clickupService import create_clickup_task

# ----------------- Storage Directories -----------------
UPLOAD_DIR = "uploaded_prds"
AVATARS_DIR = "uploaded_avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AVATARS_DIR, exist_ok=True)

# In-memory store for 6-digit confirmation codes
VERIFICATION_CODES: Dict[str, str] = {}

# ----------------- App Lifecycle -----------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="SpecRoute PM Engine API", lifespan=lifespan)

# ----------------- CORS Setup (Preflight Safe) -----------------
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for user avatars
app.mount("/avatars", StaticFiles(directory=AVATARS_DIR), name="avatars")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------- Request Schemas -----------------
class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class SendCodeRequest(BaseModel):
    email: str

class VerifyCodeRequest(BaseModel):
    email: str
    code: str

class ProjectCreate(BaseModel):
    name: str

class RosterUpdate(BaseModel):
    roster: Dict[str, str]

class TriageRequest(BaseModel):
    project_id: int
    client_message: str
    channel: Optional[str] = "WhatsApp"
    sender: Optional[str] = "Client"

class DispatchTaskRequest(BaseModel):
    project_id: int
    title: str
    category: str
    role: str
    assignee: str
    priority: Optional[str] = "🟡 Medium Priority"
    prd_reference: Optional[str] = ""

# ----------------- Authentication Routes -----------------
@app.post("/api/auth/send-code")
def send_verification_code(payload: SendCodeRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    code = f"{random.randint(100000, 999999)}"
    VERIFICATION_CODES[clean_email] = code
    print(f"\n==========================================")
    print(f"VERIFICATION CODE FOR {clean_email}: {code}")
    print(f"==========================================\n")
    return {"message": "Verification code generated", "dev_code": code}

@app.post("/api/auth/verify-code")
def verify_code(payload: VerifyCodeRequest):
    clean_email = payload.email.lower().strip()
    expected = VERIFICATION_CODES.get(clean_email)
    if not expected or expected != payload.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    return {"verified": True}

@app.post("/api/auth/register")
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    clean_email = data.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account already exists")

    user = User(
        full_name=data.full_name.strip(),
        email=clean_email,
        password=data.password,
        avatar_url=None
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    VERIFICATION_CODES.pop(clean_email, None)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "avatar_url": user.avatar_url,
    }

@app.post("/api/auth/login")
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == data.email.lower().strip(),
        User.password == data.password
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "avatar_url": user.avatar_url,
    }

@app.post("/api/auth/{user_id}/avatar")
async def upload_avatar(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    filename = f"avatar_{user_id}_{file.filename}"
    file_path = os.path.join(AVATARS_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    user.avatar_url = f"/avatars/{filename}"
    db.commit()
    db.refresh(user)
    return {"avatar_url": user.avatar_url}

# ----------------- User-Scoped Project & Roster Routes -----------------
@app.get("/api/projects")
def get_user_projects(user_id: int, db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.owner_id == user_id).all()
    result = []
    for p in projects:
        roster_dict = {tm.role_key: tm.assignee_name for tm in p.team_members}
        result.append({
            "id": p.id,
            "name": p.name,
            "prd_filename": p.prd_filename or "",
            "prd_status": p.prd_status or "missing",
            "team_roster": roster_dict
        })
    return result

@app.post("/api/projects")
def create_user_project(proj: ProjectCreate, user_id: int, db: Session = Depends(get_db)):
    if not proj.name.strip():
        raise HTTPException(status_code=400, detail="Project name cannot be empty")

    new_p = Project(
        name=proj.name.strip(),
        owner_id=user_id,
        prd_filename=None,
        prd_status="missing"
    )
    db.add(new_p)
    db.commit()
    db.refresh(new_p)
    return {
        "id": new_p.id,
        "name": new_p.name,
        "prd_filename": "",
        "prd_status": "missing",
        "team_roster": {}
    }

@app.put("/api/projects/{project_id}/roster")
def update_project_roster(project_id: int, payload: RosterUpdate, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    db.query(TeamMember).filter(TeamMember.project_id == project_id).delete()
    for role_key, assignee_name in payload.roster.items():
        if assignee_name.strip():
            db.add(TeamMember(project_id=project_id, role_key=role_key, assignee_name=assignee_name.strip()))
    db.commit()
    return {"status": "success", "roster": payload.roster}

@app.post("/api/projects/{project_id}/upload-prd")
async def upload_project_prd(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    file_path = os.path.join(UPLOAD_DIR, f"{project_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    proj.prd_filename = file.filename
    proj.prd_status = "indexed"
    db.commit()
    db.refresh(proj)

    return {
        "message": "PRD uploaded successfully",
        "prd_filename": file.filename,
        "status": "indexed"
    }

# ----------------- Gemini Triage Route -----------------
@app.post("/api/triage")
def run_triage(request: TriageRequest, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == request.project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    roster_dict = {tm.role_key: tm.assignee_name for tm in proj.team_members}

    prd_text = ""
    if proj.prd_filename:
        file_path = os.path.join(UPLOAD_DIR, f"{proj.id}_{proj.prd_filename}")
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    prd_text = f.read()
            except Exception:
                prd_text = ""

    verdict = run_gemini_triage(
        client_message=request.client_message,
        prd_content=prd_text,
        team_roster=roster_dict
    )
    return verdict

# ----------------- User-Scoped Dispatched Tasks + ClickUp Sync -----------------
@app.get("/api/tasks")
def get_dispatched_tasks(project_id: int, user_id: int, db: Session = Depends(get_db)):
    tasks = db.query(DispatchedTask).filter(
        DispatchedTask.project_id == project_id,
        DispatchedTask.user_id == user_id
    ).order_by(DispatchedTask.created_at.desc()).all()

    return [{
        "id": t.task_code,
        "title": t.title,
        "category": t.category,
        "role": t.role,
        "assignee": t.assignee,
        "timeAgo": t.created_at.strftime("%I:%M %p")
    } for t in tasks]

@app.post("/api/tasks")
def save_dispatched_task(task: DispatchTaskRequest, user_id: int, db: Session = Depends(get_db)):
    # 1. Push to real ClickUp Workspace
    cu_result = create_clickup_task(
        title=task.title,
        category=task.category,
        role=task.role,
        assignee=task.assignee,
        priority_str=task.priority,
        prd_reference=task.prd_reference
    )

    # Use ClickUp's real Task ID if successful, otherwise fallback to CLK-XXX
    task_code = (
        f"CU-{cu_result['clickup_id']}"
        if cu_result.get("success") and cu_result.get("clickup_id")
        else f"CLK-{random.randint(100, 999)}"
    )

    # 2. Save record to local SQLite database
    db_task = DispatchedTask(
        task_code=task_code,
        user_id=user_id,
        project_id=task.project_id,
        title=task.title,
        category=task.category,
        role=task.role,
        assignee=task.assignee
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return {
        "id": db_task.task_code,
        "title": db_task.title,
        "category": db_task.category,
        "role": db_task.role,
        "assignee": db_task.assignee,
        "clickup_url": cu_result.get("clickup_url"),
        "timeAgo": "Just now"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)