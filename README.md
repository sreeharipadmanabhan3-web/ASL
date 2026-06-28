# ASL Recognition Web App

Real-time American Sign Language recognition using hand tracking with MediaPipe, React frontend, and Flask backend with SQLite authentication.

## Features

- 🤟 **Real-time Hand Tracking** — MediaPipe hand landmark detection
- 🎬 **Gesture Recording** — Capture 30-frame sequences for sign recognition
- 💬 **Dual Chat Interface** — ASL signer and receiver communication
- 🔐 **User Authentication** — SQLite-backed login/register system
- 📱 **Responsive Design** — Works on desktop and mobile

## Quick Start

### 1. Install Dependencies

**Frontend (React/Vite):**
```bash
npm install
```

**Backend (Flask):**
```bash
cd backend
pip install -r requirements.txt
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Run Server
```bash
cd backend
python run.py
```

The app will be available at `http://localhost:5000`

## Development Mode

**Run frontend dev server (with hot reload):**
```bash
npm run dev
```

**Run backend separately:**
```bash
cd backend
FLASK_DEBUG=true python run.py
```

For development, set `VITE_API_URL=http://localhost:5000` in a `.env` file.

## Default Credentials

- **Username:** `admin`
- **Password:** `1234`

Or click "Continue as Guest" to use the app without an account.

## Project Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service
│   └── types.ts            # TypeScript types
├── backend/                # Flask backend
│   ├── app.py              # Main Flask app
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Server runner
├── dist/                   # Built frontend (generated)
└── public/                 # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create new account
- `POST /api/auth/login` — Login with credentials
- `POST /api/auth/guest` — Create guest session
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user

### Messages
- `GET /api/messages` — Get all messages
- `POST /api/messages` — Send a message

### Users
- `GET /api/users` — Get all users
- `GET /api/users/:id` — Get user by ID

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- MediaPipe Hands

**Backend:**
- Flask
- Flask-SQLAlchemy (SQLite)
- Flask-JWT-Extended
- Flask-Bcrypt
- Flask-CORS

## License

MIT
