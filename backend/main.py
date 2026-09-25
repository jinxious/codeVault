import os
import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import jwt
import bcrypt

# Import our simple database connection and models
from database import engine, Base, get_db
import models
import ai_helper

# Create all database tables automatically if they don't exist
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Code Snippet Vault API", version="1.0.0")

# Enable CORS so our React frontend on localhost:5173 can make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "online", "message": "Code Snippet Vault API is running smoothly!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.utcnow().isoformat()}

# JWT authentication configuration
SECRET_KEY = os.getenv("JWT_SECRET", "student_vault_super_secret_key_2026")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)


# --- Helper Auth Functions ---
def hash_password(password: str) -> str:
    # Use bcrypt directly to hash the password safely
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_token(user_id: int, email: str) -> str:
    # Create a JWT token valid for 7 days
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated. Please log in.")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


# --- Pydantic Schemas for Requests ---
class UserAuthRequest(BaseModel):
    email: str
    password: str

class SnippetCreateRequest(BaseModel):
    title: str
    code: str
    language: str = "javascript"
    description: Optional[str] = ""
    tags: Optional[str] = ""

class SnippetUpdateRequest(BaseModel):
    title: str
    code: str
    language: str = "javascript"
    description: Optional[str] = ""
    tags: Optional[str] = ""

class AiCodeRequest(BaseModel):
    code: str
    language: str = "javascript"


# ==========================================
# 1. AUTHENTICATION ROUTES
# ==========================================

@app.post("/api/auth/register")
def register_user(req: UserAuthRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    # Create new user
    new_user = models.User(
        email=req.email.lower(),
        password_hash=hash_password(req.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate token
    token = create_token(new_user.id, new_user.email)
    return {"token": token, "email": new_user.email, "user_id": new_user.id}


@app.post("/api/auth/login")
def login_user(req: UserAuthRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password.")
    
    token = create_token(user.id, user.email)
    return {"token": token, "email": user.email, "user_id": user.id}


@app.get("/api/auth/me")
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "created_at": current_user.created_at}


# ==========================================
# 2. SNIPPETS CRUD ROUTES
# ==========================================

@app.get("/api/snippets")
def get_user_snippets(
    search: Optional[str] = None,
    language: Optional[str] = None,
    tag: Optional[str] = None,
    favorite: Optional[bool] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only get snippets that belong to the logged-in user
    query = db.query(models.Snippet).filter(models.Snippet.user_id == current_user.id)

    # Filter by favorite if requested
    if favorite is True:
        query = query.filter(models.Snippet.is_favorite == True)

    # Filter by language
    if language and language.strip():
        query = query.filter(models.Snippet.language.ilike(language.strip()))

    # Filter by tag
    if tag and tag.strip():
        query = query.filter(models.Snippet.tags.ilike(f"%{tag.strip()}%"))

    # Search by title, code, description, or tags
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (models.Snippet.title.ilike(term)) |
            (models.Snippet.code.ilike(term)) |
            (models.Snippet.description.ilike(term)) |
            (models.Snippet.tags.ilike(term))
        )

    snippets = query.order_by(models.Snippet.updated_at.desc()).all()
    
    # Return snippets list
    return [
        {
            "id": s.id,
            "title": s.title,
            "code": s.code,
            "language": s.language,
            "description": s.description,
            "tags": s.tags,
            "is_favorite": s.is_favorite,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "version_count": len(s.versions)
        }
        for s in snippets
    ]


@app.post("/api/snippets")
def create_snippet(
    req: SnippetCreateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Snippet title is required.")
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Snippet code is required.")

    # 1. Create main snippet
    snippet = models.Snippet(
        user_id=current_user.id,
        title=req.title.strip(),
        code=req.code,
        language=req.language.lower().strip() or "javascript",
        description=req.description or "",
        tags=req.tags or "",
        is_favorite=False
    )
    db.add(snippet)
    db.commit()
    db.refresh(snippet)

    # 2. Automatically record Version 1
    version1 = models.SnippetVersion(
        snippet_id=snippet.id,
        version_number=1,
        code=snippet.code,
        language=snippet.language
    )
    db.add(version1)
    db.commit()

    return {
        "id": snippet.id,
        "title": snippet.title,
        "code": snippet.code,
        "language": snippet.language,
        "description": snippet.description,
        "tags": snippet.tags,
        "is_favorite": snippet.is_favorite,
        "created_at": snippet.created_at,
        "updated_at": snippet.updated_at,
        "version_count": 1
    }


@app.get("/api/snippets/{snippet_id}")
def get_snippet_details(
    snippet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found.")

    return {
        "id": snippet.id,
        "title": snippet.title,
        "code": snippet.code,
        "language": snippet.language,
        "description": snippet.description,
        "tags": snippet.tags,
        "is_favorite": snippet.is_favorite,
        "created_at": snippet.created_at,
        "updated_at": snippet.updated_at,
        "versions": [
            {
                "id": v.id,
                "version_number": v.version_number,
                "code": v.code,
                "language": v.language,
                "created_at": v.created_at
            }
            for v in snippet.versions
        ]
    }


@app.put("/api/snippets/{snippet_id}")
def update_snippet(
    snippet_id: int,
    req: SnippetUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found.")

    # Check if code or language changed to save a new version
    code_changed = (snippet.code != req.code) or (snippet.language != req.language)

    snippet.title = req.title.strip()
    snippet.description = req.description or ""
    snippet.tags = req.tags or ""
    snippet.code = req.code
    snippet.language = req.language.lower().strip() or "javascript"
    snippet.updated_at = datetime.datetime.utcnow()

    if code_changed:
        # Determine next version number
        latest_version = db.query(models.SnippetVersion).filter(
            models.SnippetVersion.snippet_id == snippet.id
        ).order_by(models.SnippetVersion.version_number.desc()).first()

        next_ver = (latest_version.version_number + 1) if latest_version else 1

        new_version = models.SnippetVersion(
            snippet_id=snippet.id,
            version_number=next_ver,
            code=snippet.code,
            language=snippet.language
        )
        db.add(new_version)

    db.commit()
    db.refresh(snippet)

    return {"message": "Snippet updated successfully", "id": snippet.id}


@app.delete("/api/snippets/{snippet_id}")
def delete_snippet(
    snippet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found.")

    db.delete(snippet)
    db.commit()
    return {"message": "Snippet deleted successfully."}


@app.patch("/api/snippets/{snippet_id}/favorite")
def toggle_favorite(
    snippet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found.")

    snippet.is_favorite = not snippet.is_favorite
    db.commit()
    return {"is_favorite": snippet.is_favorite}


# ==========================================
# 3. VERSION HISTORY & ROLLBACK
# ==========================================

@app.get("/api/snippets/{snippet_id}/versions")
def get_snippet_versions(
    snippet_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found.")

    versions = db.query(models.SnippetVersion).filter(
        models.SnippetVersion.snippet_id == snippet.id
    ).order_by(models.SnippetVersion.version_number.desc()).all()

    return [
        {
            "id": v.id,
            "version_number": v.version_number,
            "code": v.code,
            "language": v.language,
            "created_at": v.created_at
        }
        for v in versions
    ]


@app.post("/api/snippets/{snippet_id}/rollback/{version_id}")
def rollback_snippet_version(
    snippet_id: int,
    version_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    snippet = db.query(models.Snippet).filter(
        models.Snippet.id == snippet_id,
        models.Snippet.user_id == current_user.id
    ).first()

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found.")

    target_version = db.query(models.SnippetVersion).filter(
        models.SnippetVersion.id == version_id,
        models.SnippetVersion.snippet_id == snippet.id
    ).first()

    if not target_version:
        raise HTTPException(status_code=404, detail="Version not found.")

    # Roll back snippet code and language
    snippet.code = target_version.code
    snippet.language = target_version.language
    snippet.updated_at = datetime.datetime.utcnow()

    # Record the rollback as a new version
    latest = db.query(models.SnippetVersion).filter(
        models.SnippetVersion.snippet_id == snippet.id
    ).order_by(models.SnippetVersion.version_number.desc()).first()

    new_ver_number = (latest.version_number + 1) if latest else 1

    new_version_entry = models.SnippetVersion(
        snippet_id=snippet.id,
        version_number=new_ver_number,
        code=snippet.code,
        language=snippet.language
    )
    db.add(new_version_entry)
    db.commit()

    return {
        "message": f"Successfully rolled back to Version {target_version.version_number}",
        "code": snippet.code,
        "language": snippet.language
    }


# ==========================================
# 4. AI ENDPOINTS
# ==========================================

@app.post("/api/ai/photo-to-code")
async def ai_photo_to_code(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    contents = await file.read()
    result = ai_helper.extract_code_from_image(contents, mime_type=file.content_type or "image/png")
    return result


@app.post("/api/ai/smart-fix")
def ai_smart_fix(
    req: AiCodeRequest,
    current_user: models.User = Depends(get_current_user)
):
    result = ai_helper.smart_fix_code(req.code, req.language)
    return result


@app.post("/api/ai/explain")
def ai_explain_code(
    req: AiCodeRequest,
    current_user: models.User = Depends(get_current_user)
):
    result = ai_helper.explain_code_hinglish(req.code, req.language)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

