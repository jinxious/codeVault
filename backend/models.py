import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

# 1. User Model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    snippets = relationship("Snippet", back_populates="owner", cascade="all, delete-orphan")


# 2. Snippet Model
class Snippet(Base):
    __tablename__ = "snippets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), default="javascript")
    description = Column(Text, default="")
    tags = Column(String(255), default="")  # Stored as comma-separated: "Python, DSA, Sorting"
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="snippets")
    versions = relationship("SnippetVersion", back_populates="snippet", cascade="all, delete-orphan", order_by="SnippetVersion.version_number.desc()")


# 3. Snippet Version Model (for version history and rollback)
class SnippetVersion(Base):
    __tablename__ = "snippet_versions"

    id = Column(Integer, primary_key=True, index=True)
    snippet_id = Column(Integer, ForeignKey("snippets.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), default="javascript")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship back to snippet
    snippet = relationship("Snippet", back_populates="versions")
