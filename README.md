# Code Snippet Vault 🚀

A clean, student-friendly personal code repository web application built with **React**, **Python (FastAPI)**, and **PostgreSQL**.

---

## 📁 Project Structure

```text
codeVault/
├── backend/
│   ├── main.py            # API routes (Auth, Snippet CRUD, Version History, AI endpoints)
│   ├── database.py        # PostgreSQL connection with seamless fallback
│   ├── models.py          # Simple SQLAlchemy database tables (User, Snippet, SnippetVersion)
│   ├── ai_helper.py       # 3 AI functions (Photo-to-Code, Smart Fix, Hinglish Explain)
│   ├── .env               # Database URL & API Key configuration
│   └── requirements.txt   # Python dependencies
│
└── frontend/
    ├── index.html         # HTML entry point
    ├── package.json       # Frontend dependencies (React, Vite, Lucide-React, PrismJS)
    └── src/
        ├── main.jsx       # Mounts React app to DOM
        ├── App.jsx        # Root auth flow and view routing
        ├── index.css      # Dark-mode design system & component styles
        ├── Login.jsx      # Student-friendly sign in form
        ├── Register.jsx   # Simple user registration form
        ├── Dashboard.jsx  # Main hub (search, filter, card/list view, favorites)
        ├── SnippetModal.jsx # Snippet creator, editor & version history rollback
        └── AiModal.jsx    # Photo-to-Code, Smart Fix & Hinglish explanation UI
```

---

## ⚡ How to Run the Project

### 1. Start the Backend
Open a terminal in the `backend` folder:
```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```
Backend API will be running at: `http://localhost:8000`
API docs available at: `http://localhost:8000/docs`

### 2. Start the Frontend
Open a second terminal in the `frontend` folder:
```powershell
cd frontend
npm run dev
```
Frontend application will be running at: `http://localhost:5173`

---

## 🗄️ Database Configuration (PostgreSQL)

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/codevault_db
JWT_SECRET=student_vault_super_secret_key_2026
GEMINI_API_KEY=your_gemini_api_key_here
```
> *Note*: If PostgreSQL credentials are not yet configured or PostgreSQL is offline during testing, the app automatically uses a local SQLite fallback database (`backend/codevault.db`) so your application never crashes unexpectedly!

---

## 🧠 Core Features

1. **User Authentication**:
   - Register, Login, and Logout.
   - Secure bcrypt password hashing.
   - User isolation (users only see their own snippets).

2. **Snippet Management**:
   - Create, View, Edit, and Delete snippets.
   - Tagging system (e.g. `DSA`, `Python`, `Sorting`).
   - Star favorite snippets & quick filter for favorites.
   - Card View and List View switcher.

3. **Search & Realtime Filtering**:
   - Instant search across Title, Code, Description, and Tags.
   - Language filter pills (Python, JS, C++, Java, SQL, Go, Rust, etc.).

4. **Version History & Rollback**:
   - Automatic version snapshot created whenever snippet code is edited.
   - Browse previous versions with timestamps.
   - One-click rollback to restore older code versions.

5. **AI Coding Suite**:
   - **📷 Photo to Code**: Upload/paste a screenshot of code $\rightarrow$ AI extracts it into clean code.
   - **⚡ Smart Fix**: AI analyzes code for bugs, errors, and missing edge cases.
   - **💡 Hinglish Code Explanation**: Explains code step-by-step in natural **Hinglish** like a helpful teacher, with **Time Complexity** and **Space Complexity**.
