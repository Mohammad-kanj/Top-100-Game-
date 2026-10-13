import { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [guess, setGuess] = useState("");
  const [lastGuess, setLastGuess] = useState({ text: "---", status: "none", message: "" });
  const [lastRevealedIndex, setLastRevealedIndex] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, message: "" });
  const [editTeams, setEditTeams] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusedTile, setFocusedTile] = useState(null);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/state`);
      const data = await res.json();
      setGameState(data);
    } catch (err) {
      console.error("Failed to connect to backend", err);
    }
  };

  useEffect(() => {
    fetchState();
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.head.removeChild(link);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const submitGuess = async (e) => {
    e.preventDefault();
    if (!guess.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/game/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: guess.trim() })
      });
      const data = await res.json();

      if (data.status === "correct") {
        setLastGuess({ text: guess, status: "correct", message: `CORRECT: ${data.name} (#${data.index + 1})` });
        setLastRevealedIndex(data.index);
      } else if (data.status === "exists") {
        setLastGuess({ text: guess, status: "exists", message: `ALREADY FOUND!` });
      } else {
        setLastGuess({ text: guess, status: "incorrect", message: `INCORRECT: ${guess}` });
      }
      
      setGuess("");
      fetchState();
    } catch (err) {
      console.error("Guess failed", err);
    }
  };

  const requestAction = (endpoint, message) => {
    setConfirmModal({ show: true, action: endpoint, message });
  };

  const executeAction = async () => {
    if (!confirmModal.action) return;
    
    await fetch(`${API_BASE}/game/${confirmModal.action}`, { method: "POST" });
    if (['next_round', 'prev_round', 'give_up'].includes(confirmModal.action)) {
      setLastRevealedIndex(null);
      setLastGuess({ text: "---", status: "none", message: "" });
    }
    setConfirmModal({ show: false, action: null, message: "" });
    fetchState();
  };

  const saveTeams = async () => {
    await fetch(`${API_BASE}/game/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teams: editTeams })
    });
    setShowTeamModal(false);
    fetchState();
  };

  const handleTileClick = (index, rank, isRevealed, answerName) => {
    if (isRevealed) {
      const guessingTeam = gameState.revealed_by[index] || "UNKNOWN";
      setFocusedTile({ rank, name: answerName, team: guessingTeam });
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#002B5B] text-white flex items-center justify-center text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        CONNECTING TO SERVER...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#002B5B] text-white p-4 flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      
      <div className="grid grid-cols-[260px_1fr_260px] grid-rows-[auto_1fr] gap-x-6 gap-y-3 mb-6 max-w-[1250px] mx-auto w-full">
        
        <div className="row-span-2 w-full h-full bg-[#003B73] border-2 border-[#001A33] border-b-4 rounded-2xl p-4 shadow-lg flex flex-col justify-center gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => { setEditTeams([...gameState.teams]); setShowTeamModal(true); }}
              className="flex-1 bg-[#00509E] hover:bg-[#0066CC] border-2 border-[#001A33] border-b-4 text-white rounded-lg text-xs py-2.5 font-bold transition-all active:translate-y-1 active:border-b-2 tracking-wide"
            >
              TEAMS
            </button>
            <button 
              onClick={toggleFullscreen}
              className="flex-1 bg-[#00509E] hover:bg-[#0066CC] border-2 border-[#001A33] border-b-4 text-white rounded-lg text-xs py-2.5 font-bold transition-all active:translate-y-1 active:border-b-2 tracking-wide"
            >
              {isFullscreen ? 'EXIT' : 'FULL'}
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => requestAction('prev_round', 'Are you sure you want to go back?')} 
              className="flex-1 bg-[#00509E] hover:bg-[#0066CC] border-2 border-[#001A33] border-b-4 text-white rounded-lg py-2.5 text-xs font-bold transition-all active:translate-y-1 active:border-b-2 tracking-wider flex items-center justify-center gap-1"
            >
              ◀ PREV
            </button>
            <button 
              onClick={() => requestAction('next_round', 'Are you sure you want to advance?')} 
              className="flex-1 bg-[#00509E] hover:bg-[#0066CC] border-2 border-[#001A33] border-b-4 text-white rounded-lg py-2.5 text-xs font-bold transition-all active:translate-y-1 active:border-b-2 tracking-wider flex items-center justify-center gap-1"
            >
              NEXT ▶
            </button>
          </div>
        </div>

        <div className="flex justify-center items-start pt-1">
          <div className="bg-[#001A33] text-blue-200 border border-[#001A33] rounded-full px-6 py-1.5 text-sm font-bold tracking-widest shadow-inner">
            ROUND {gameState.current_round + 1}
          </div>
        </div>

        <div className={`row-span-2 w-full h-full rounded-[2.5rem] border-2 border-b-4 p-5 text-center font-bold flex flex-col justify-center items-center shadow-lg transition-colors duration-300
          ${lastGuess.status === 'correct' ? 'bg-[#FFDC00] border-[#B89B00] text-black shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]' : 
            lastGuess.status === 'incorrect' ? 'bg-[#FF4136] border-[#85144B] text-white' : 
            lastGuess.status === 'exists' ? 'bg-[#FF851B] border-[#B35C00] text-white' : 
            'bg-[#003B73] border-[#001A33] text-gray-200'}`}>
          <div className="text-sm mb-2 uppercase opacity-80 tracking-widest">LAST GUESS</div>
          <div className="text-xl md:text-2xl leading-tight px-2 drop-shadow-sm break-words w-full">{lastGuess.message || "---"}</div>
        </div>

        <div className="bg-[#003B73] border-2 border-[#001A33] border-b-4 rounded-2xl p-4 shadow-lg flex items-center justify-center text-center h-full">
          <h1 className="text-[#FFDC00] text-3xl md:text-4xl font-black uppercase tracking-tight drop-shadow-md px-4 leading-tight">
            {gameState.current_round_title || "LOADING ROUND..."}
          </h1>
        </div>
      </div>

      <div className="flex justify-center items-center gap-5 mb-6 max-w-[1250px] mx-auto w-full">
        {gameState.teams.map((team, idx) => {
          const isActive = idx === gameState.current_turn;
          return (
            <div key={idx} className={`px-6 py-3 rounded-xl border-2 min-w-[170px] text-center transition-all duration-300
              ${isActive 
                ? 'bg-[#FFDC00] border-[#B89B00] border-b-4 text-black scale-105 shadow-xl' 
                : 'bg-[#003B73] border-[#001A33] border-b-4 text-gray-200 shadow-md'}`}>
              <div className="font-bold text-sm mb-1 truncate tracking-wide">{team}</div>
              <div className="text-3xl font-black">{gameState.scores[idx]}</div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mb-6">
        <form onSubmit={submitGuess} className="w-[600px]">
          <input 
            type="text" 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type guess and hit Enter..."
            className="w-full bg-white text-black px-6 py-4 rounded-xl text-2xl font-bold border-4 border-gray-300 focus:border-[#00509E] shadow-inner outline-none transition-colors text-center"
            autoFocus
          />
        </form>
      </div>

      <div className="grid grid-cols-10 gap-2 max-w-[1250px] mx-auto w-full mb-6 bg-[#001A33] p-4 rounded-xl shadow-inner flex-1 border border-black/30">
        {Array.from({ length: 100 }).map((_, i) => {
          const rank = i + 1;
          const isRevealed = gameState.revealed_indices.includes(i);
          const isJustRevealed = lastRevealedIndex === i;
          const answerName = gameState.current_round_answers ? gameState.current_round_answers[i] : "";

          return (
            <div 
              key={rank} 
              onClick={() => handleTileClick(i, rank, isRevealed, answerName)}
              className={`h-14 rounded-lg flex items-center justify-center p-1 text-center transition-all cursor-pointer hover:brightness-90
                ${isRevealed 
                  ? (isJustRevealed 
                      ? 'bg-[#2ECC40] border-2 border-black border-b-4 text-white font-bold z-10 relative shadow-md scale-105'
                      : 'bg-[#FFDC00] border border-[#B89B00] border-b-4 text-black font-bold shadow-sm')
                  : 'bg-[#00509E] border border-[#002B5B] border-b-4 text-blue-200/60 font-black text-xl shadow-sm'}`}
            >
              {isRevealed ? (
                <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
                  <span className="text-[11px] leading-[1.2] text-center w-full px-0.5 line-clamp-2" title={answerName}>
                    {answerName}
                  </span>
                  <span className="text-[10px] opacity-75">(#{rank})</span>
                </div>
              ) : (
                <span className="drop-shadow-md">{rank}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center pb-4">
        <button 
          onClick={() => requestAction('give_up', 'Are you sure you want to REVEAL ALL remaining answers?')} 
          className="bg-red-600 hover:bg-red-500 text-white font-black px-10 py-3 rounded-full border-2 border-red-900 border-b-4 shadow-md transition-all active:translate-y-1 active:border-b-2 tracking-widest"
        >
          REVEAL ALL
        </button>
      </div>

      {focusedTile && (
        <div className="fixed inset-0 bg-[#001A33]/90 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer" onClick={() => setFocusedTile(null)}>
          <div className="bg-[#FFDC00] p-10 rounded-2xl border-4 border-[#B89B00] shadow-2xl text-center max-w-3xl transform transition-all scale-105 cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="text-[#8B7500] font-black tracking-widest mb-2 text-xl">RANK #{focusedTile.rank}</div>
            <div className="text-5xl font-black text-black mb-8 uppercase drop-shadow-md tracking-tight leading-tight">{focusedTile.name}</div>
            <div className="bg-[#003B73] text-white py-3 px-8 rounded-xl font-bold border-2 border-[#001A33] border-b-4 inline-block tracking-wide shadow-md">
              GUESSED BY: <span className="text-[#FFDC00] ml-2">{focusedTile.team}</span>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 bg-[#001A33]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#003B73] p-8 rounded-xl w-[450px] shadow-2xl border-2 border-[#001A33] text-center">
            <h2 className="text-2xl font-black text-white mb-6 drop-shadow-md tracking-wide uppercase">CONFIRM ACTION</h2>
            <p className="text-lg text-blue-200 font-bold mb-8">{confirmModal.message}</p>
            <div className="flex justify-between gap-4">
              <button onClick={() => setConfirmModal({ show: false, action: null, message: "" })} className="bg-gray-600 hover:bg-gray-500 px-4 py-3 rounded-lg font-bold text-white flex-1 border-2 border-gray-800 border-b-4 active:translate-y-1 active:border-b-2 transition-all tracking-wide">CANCEL</button>
              <button onClick={executeAction} className="bg-green-600 hover:bg-green-500 px-4 py-3 rounded-lg font-bold text-white flex-1 border-2 border-green-900 border-b-4 active:translate-y-1 active:border-b-2 transition-all tracking-wide">CONFIRM</button>
            </div>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 bg-[#001A33]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#003B73] p-6 rounded-xl w-[400px] shadow-2xl border-2 border-[#001A33]">
            <h2 className="text-2xl font-black text-white mb-5 drop-shadow-md tracking-wide">EDIT TEAMS</h2>
            <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
              {editTeams.map((team, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={team} onChange={(e) => { const newTeams = [...editTeams]; newTeams[i] = e.target.value; setEditTeams(newTeams); }} className="flex-1 bg-[#001A33] text-white px-3 py-2 rounded-lg font-bold outline-none border border-[#00509E] focus:border-[#FFDC00] shadow-inner" />
                  <button onClick={() => setEditTeams(editTeams.filter((_, idx) => idx !== i))} className="bg-red-600 hover:bg-red-500 px-4 rounded-lg font-black text-white border-2 border-red-900 border-b-4 active:translate-y-1 active:border-b-2 transition-all">X</button>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-4">
              <button onClick={() => setEditTeams([...editTeams, `Team ${editTeams.length + 1}`])} className="bg-[#00509E] hover:bg-[#0066CC] px-4 py-2 rounded-lg font-bold text-white flex-1 border-2 border-[#001A33] border-b-4 active:translate-y-1 active:border-b-2 transition-all tracking-wide">ADD</button>
              <button onClick={saveTeams} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-bold text-white flex-1 border-2 border-green-900 border-b-4 active:translate-y-1 active:border-b-2 transition-all tracking-wide">SAVE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}