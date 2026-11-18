import { useState, useEffect, useRef, useCallback } from 'react';
import { soundFx } from '../soundFx';

export interface OnlinePlayerInfo {
  player_id: string;
  name: string;
  is_host: boolean;
  is_connected: boolean;
  consecutive_incorrect: number;
  eligible_for_surrender: boolean;
}

export interface SurrenderVoteData {
  initiator_id: string;
  initiator_name: string;
  expires_at: number;
  votes: Record<string, boolean>;
}

export interface OnlineRoomInfo {
  room_code: string;
  host_id: string;
  status: 'LOBBY' | 'PLAYING';
  is_configured?: boolean;
  players: OnlinePlayerInfo[];
  active_player_id: string | null;
  turn_expires_at?: number | null;
  boss_rush_expires_at?: number | null;
  surrender_vote: SurrenderVoteData | null;
  game_state: any;
}

const SESSION_STORAGE_KEY = 'top100_online_session';

interface SavedSession {
  roomCode: string;
  playerId: string;
}

const getApiBase = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return `${window.location.protocol}//${window.location.host}`;
  }
  return 'http://127.0.0.1:8000';
};

export function useOnlineGame() {
  const [roomInfo, setRoomInfo] = useState<OnlineRoomInfo | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const isHost = Boolean(roomInfo && myPlayerId && roomInfo?.host_id === myPlayerId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastOnlineResult, setLastOnlineResult] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const explicitLeaveRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSessionRef = useRef<SavedSession | null>(null);

  // Clear errors
  const clearError = useCallback(() => setErrorMessage(null), []);

  // WebSocket Connection
  const connectWebSocket = useCallback((roomCode: string, playerId: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss:' : 'ws:';
    let wsHost = typeof window !== 'undefined' ? window.location.host : '127.0.0.1:8000';
    if (typeof window !== 'undefined' && window.location.port === '5173') {
      wsHost = `${window.location.hostname}:8000`;
    }
    const wsUrl = `${wsProto}//${wsHost}/ws/${roomCode}/${playerId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      // Keepalive ping every 15s
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'PING' }));
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'PONG') return;

        if (payload.room) {
          setRoomInfo(payload.room);
        }

        if (payload.type === 'GAME_STARTED' || payload.type === 'NEXT_ROUND_STARTED') {
          soundFx.playFanfare();
          setLastOnlineResult(null);
        } else if (payload.type === 'GUESS_RESULT') {
          const res = payload.extra;
          setLastOnlineResult(res);
          if (res?.status === 'correct') {
            soundFx.playCorrect();
          } else {
            soundFx.playIncorrect();
          }
        } else if (payload.type === 'TURN_PASSED') {
          soundFx.playIncorrect();
        } else if (payload.type === 'SURRENDER_PASSED') {
          soundFx.playFanfare();
        } else if (payload.type === 'RETURNED_TO_LOBBY') {
          soundFx.playClick();
        }
      } catch (e) {
        console.error('Error handling WebSocket message', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      // Auto-reconnect if session is active and not explicitly closed
      if (!explicitLeaveRef.current && currentSessionRef.current) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!explicitLeaveRef.current && currentSessionRef.current) {
            connectWebSocket(currentSessionRef.current.roomCode, currentSessionRef.current.playerId);
          }
        }, 1500);
      }
    };

    socketRef.current = ws;
  }, []);

  // Rehydrate existing active session on page mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed: SavedSession = JSON.parse(saved);
        if (parsed?.roomCode && parsed?.playerId) {
          fetch(`${getApiBase()}/online/room/${parsed.roomCode}`)
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error('Room not found');
            })
            .then((roomData: OnlineRoomInfo) => {
              const playerExists = roomData.players?.some((p) => p.player_id === parsed.playerId);
              if (playerExists) {
                setMyPlayerId(parsed.playerId);
                setRoomInfo(roomData);
                currentSessionRef.current = parsed;
                explicitLeaveRef.current = false;
                connectWebSocket(parsed.roomCode, parsed.playerId);
              } else {
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
              }
            })
            .catch(() => {
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
            });
        }
      }
    } catch (e) {
      console.warn('Session hydration error', e);
    }
  }, [connectWebSocket]);

  // Host game action
  const hostGame = async (hostName: string): Promise<boolean> => {
    try {
      clearError();
      const res = await fetch(`${getApiBase()}/online/create_room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_name: hostName })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || 'Could not create room.');
        return false;
      }

      setMyPlayerId(data.player_id);
      setRoomInfo(data.room);
      currentSessionRef.current = { roomCode: data.room_code, playerId: data.player_id };
      explicitLeaveRef.current = false;
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSessionRef.current));
      } catch {}
      connectWebSocket(data.room_code, data.player_id);
      return true;
    } catch (err: any) {
      setErrorMessage('Failed to connect to backend server.');
      return false;
    }
  };

  // Join game action
  const joinGame = async (roomCode: string, playerName: string): Promise<boolean> => {
    try {
      clearError();
      const res = await fetch(`${getApiBase()}/online/join_room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_code: roomCode, player_name: playerName })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || 'Could not join room.');
        return false;
      }

      setMyPlayerId(data.player_id);
      setRoomInfo(data.room);
      currentSessionRef.current = { roomCode: data.room_code, playerId: data.player_id };
      explicitLeaveRef.current = false;
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSessionRef.current));
      } catch {}
      connectWebSocket(data.room_code, data.player_id);
      return true;
    } catch (err: any) {
      setErrorMessage('Failed to connect to backend server.');
      return false;
    }
  };

  // Send WebSocket Actions
  const updateOnlineConfig = useCallback((config: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'UPDATE_CONFIG', config }));
    }
  }, []);

  const expireBossRush = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'BOSS_RUSH_EXPIRE' }));
    }
  }, []);

  const startOnlineMatch = useCallback((config: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'START_GAME', config }));
    }
  }, []);

  const submitOnlineGuess = useCallback((guess: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'SUBMIT_GUESS', guess }));
    }
  }, []);

  const passOnlineTurn = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'PASS_TURN' }));
    }
  }, []);

  const voteSurrender = useCallback((vote: boolean = true) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'VOTE_SURRENDER', vote }));
    }
  }, []);

  const returnToLobby = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'RETURN_TO_LOBBY' }));
    }
  }, []);

  const playOnlineAgain = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'PLAY_AGAIN' }));
    }
  }, []);

  const nextOnlineRound = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'NEXT_ROUND' }));
    }
  }, []);

  const leaveLobby = useCallback(() => {
    explicitLeaveRef.current = true;
    currentSessionRef.current = null;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {}
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setRoomInfo(null);
    setMyPlayerId(null);
    setIsConnected(false);
    clearError();
  }, [clearError]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  return {
    roomInfo,
    myPlayerId,
    isHost,
    isConnected,
    errorMessage,
    clearError,
    lastOnlineResult,
    hostGame,
    joinGame,
    updateOnlineConfig,
    expireBossRush,
    startOnlineMatch,
    submitOnlineGuess,
    passOnlineTurn,
    voteSurrender,
    returnToLobby,
    playOnlineAgain,
    nextOnlineRound,
    leaveLobby
  };
}
