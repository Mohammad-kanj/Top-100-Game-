export interface GameSettings {
  scoring_mode?: string;
  turn_timer?: number;
  max_turns?: number;
  max_strikes?: number;
  match_mode?: string;
  total_rounds?: number;
  sfx_enabled?: boolean;
  sfx_volume?: number;
}

export interface GameState {
  teams: string[];
  scores: number[];
  match_scores: number[];
  strikes: number[];
  turns_taken: number[];
  eliminated: boolean[];
  current_turn: number;
  current_round: number;
  current_match_round: number;
  total_rounds: number;
  match_mode: string;
  revealed_indices: number[];
  revealed_by: Record<string, string>;
  current_round_title: string;
  current_round_answers: string[];
  is_round_over: boolean;
  is_match_over: boolean;
  settings?: GameSettings;
}

export interface Category {
  index: number;
  title: string;
  count: number;
}

export interface LastGuess {
  text: string;
  status: 'none' | 'correct' | 'incorrect' | 'exists';
  message: string;
}

export interface FocusedTile {
  rank: number;
  name: string;
  team: string;
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
}

export interface HostOverrideData {
  action: string;
  index?: number;
  team_index?: number;
  delta?: number;
}
