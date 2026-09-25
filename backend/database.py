import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database connection URL (PostgreSQL)
# Format: postgresql://username:password@localhost:5432/database_name
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/codevault_db")

# Fallback mechanism: if PostgreSQL is not yet initialized or fails,
# we allow seamless local testing with SQLite so the student's project never crashes abruptly
try:
    engine = create_engine(DATABASE_URL)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Warning: Could not connect to PostgreSQL at {DATABASE_URL}. Using local SQLite fallback for testing. Error: {e}")
    DATABASE_URL = "sqlite:///./codevault.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models
Base = declarative_base()

# Simple helper function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
Base.metadata.create_all(bind=engine)