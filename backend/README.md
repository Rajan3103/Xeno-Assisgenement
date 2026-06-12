# XenoPulse CRM Backend

This is the FastAPI backend for XenoPulse CRM, managing customers and user authorization using SQLite and SQLAlchemy.

## Getting Started

### 1. Setup Virtual Environment
It is recommended to run this in a python virtual environment:
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Server
Run the FastAPI development server:
```bash
uvicorn app.main:app --reload
```

The server will start at `http://127.0.0.1:8000`.

## API Documentation
Once running, you can explore the interactive API docs at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Environment Variables
Ensure `.env` matches the configuration in `.env.example`.
