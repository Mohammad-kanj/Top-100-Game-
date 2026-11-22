export interface GameSettings {
  end_condition?: 'both' | 'turns' | 'points';
  point_threshold?: number;
  turn_timer?: number;
  max_turns?: number;
  match_mode?: string;
  total_rounds?: number;
  boss_rush_duration?: number;
  sfx_enabled?: boolean;
  sfx_volume?: number;
  reduce_motion?: boolean;
  brightness?: number;
  color_theme?: 'red' | 'blue';
  scoring_mode?: string;
  max_strikes?: number;
}

export interface GameState {
  teams: string[];
  scores: number[];
  match_scores: number[];
  turns_taken: number[];
  current_turn: number;
  current_round: number;
  current_match_round: number;
  total_rounds: number;
  match_mode: string;
  revealed_indices: number[];
  revealed_by: Record<string, string>;
  current_round_title: string;
  current_round_subtitle?: string;
  current_round_answers: string[];
  is_round_over: boolean;
  is_match_over: boolean;
  winner?: string | null;
  surrendered?: boolean;
  end_condition?: 'both' | 'turns' | 'points';
  point_threshold?: number;
  boss_rush_duration?: number;
  settings?: GameSettings;
  strikes?: number[];
  eliminated?: boolean[];
}

export interface Category {
  index: number;
  title: string;
  subtitle?: string;
  count: number;
}

export interface LastGuess {
  text: string;
  status: 'none' | 'correct' | 'incorrect' | 'exists';
  message: string;
  points?: number;
  rank?: number;
  resolvedName?: string;
}

export interface FocusedTile {
  rank: number;
  name: string;
  team: string;
  isMissed?: boolean;
}

export interface ConfirmModalState {
  show: boolean;
  action: string | null;
  message: string;
}

export interface MatchConfig {
  match_mode: string;
  total_rounds: number;
  category_indices: number[];
  teams?: string[];
  boss_rush_duration?: number;
  point_threshold?: number;
  turn_timer?: number;
  max_turns?: number;
  end_condition?: 'both' | 'turns' | 'points';
}

export interface HostOverrideData {
  action: string;
  index?: number;
  team_index?: number;
  delta?: number;
}

export interface OnlinePlayerInfo {
  player_id: string;
  name: string;
  is_host: boolean;
  is_connected: boolean;
  consecutive_incorrect: number;
  eligible_for_surrender: boolean;
}

export interface OnlineRoomInfo {
  room_code: string;
  host_id: string;
  status: 'LOBBY' | 'PLAYING' | string;
  is_configured?: boolean;
  category_indices?: number[];
  selected_categories?: string[];
  players?: OnlinePlayerInfo[];
  active_player_id?: string | null;
  surrender_vote?: any;
  game_state?: any;
}
