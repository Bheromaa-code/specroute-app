from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./specroute.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    dispatched_tasks = relationship("DispatchedTask", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prd_filename = Column(String, nullable=True)
    prd_status = Column(String, default="missing")

    owner = relationship("User", back_populates="projects")
    team_members = relationship("TeamMember", back_populates="project", cascade="all, delete-orphan")
    dispatched_tasks = relationship("DispatchedTask", back_populates="project", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    role_key = Column(String, nullable=False)
    assignee_name = Column(String, nullable=False)

    project = relationship("Project", back_populates="team_members")

class DispatchedTask(Base):
    __tablename__ = "dispatched_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    role = Column(String, nullable=False)
    assignee = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="dispatched_tasks")
    project = relationship("Project", back_populates="dispatched_tasks")

def init_db():
    Base.metadata.create_all(bind=engine)