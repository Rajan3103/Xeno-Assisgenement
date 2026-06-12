# XenoPulse Channel Service

This is the communication broker microservice for XenoPulse. It exposes API endpoints to send notifications via Email (SMTP), SMS (Twilio), and WhatsApp (Twilio).

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
Run the FastAPI development server on port `8001`:
```bash
uvicorn app.main:app --port 8001 --reload
```

The server will start at `http://127.0.0.1:8001`.

## API Documentation
Once running, you can explore the interactive API docs at:
- Swagger UI: `http://127.0.0.1:8001/docs`
- ReDoc: `http://127.0.0.1:8001/redoc`

## Environment Variables
Ensure `.env` matches the configuration in `.env.example`.
