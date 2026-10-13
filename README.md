# Top 100 - Party Game 🏆

I built **Top 100** to bring the ultimate trivia night to my friends! It’s a fast-paced multiplayer party game where teams battle it out to guess items across massive 100-answer lists. Powered by a React frontend and a FastAPI backend, it features live scoring, clean responsive boards, and non-stop friendly rivalry.

---

## 🛠️ Tech Stack
* **Frontend:** React (Vite), Tailwind CSS
* **Backend:** FastAPI (Python), Uvicorn, Pydantic
* **State Management:** Custom REST endpoints & React hooks

---

## 🚀 How to Run Locally

Because the application uses a Python backend alongside a React frontend, open **two separate terminal windows** inside the project root folder.

### Terminal 1: Backend (FastAPI)
1. Open a terminal in the root project directory.
2. Install the Python dependencies (first-time only):
   ```bash
   pip install fastapi pydantic uvicorn
   ```
3. Start the server:
   ```bash
   fastapi dev main.py
   ```
   *The backend will run on `http://127.0.0.1:8000`.*

### Terminal 2: Frontend (React)
1. Open a second terminal window in the root project directory.
2. Navigate into your React folder and install the packages:
   ```bash
   cd top-100-ui
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser to play.*

---

