from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import os
import re
import unicodedata
from difflib import SequenceMatcher

app = FastAPI(title="Top 100 Cyber Arcade API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STOP_WORDS = {
    "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for",
    "with", "by", "from", "part", "episode", "chapter", "edition", "deluxe"
}

ROMAN_NUMERALS = {
    "i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5",
    "vi": "6", "vii": "7", "viii": "8", "ix": "9", "x": "10",
    "xi": "11", "xii": "12"
}

ABBREVIATIONS = {
    "gta": "grand theft auto",
    "cod": "call of duty",
    "botw": "breath of the wild",
    "totk": "tears of the kingdom",
    "csgo": "counter strike global offensive",
    "cs:go": "counter strike global offensive",
    "pubg": "playerunknowns battlegrounds",
    "mcu": "marvel cinematic universe",
}

def remove_accents(input_str: str) -> str:
    nfkd = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd if not unicodedata.combining(c)])

def normalize_text(text: str) -> str:
    text = remove_accents(text.lower().strip())
    text = text.replace("&", " and ")

    tokens = text.split()
    expanded = [ABBREVIATIONS.get(t, t) for t in tokens]
    text = " ".join(expanded)

    words = []
    for w in text.replace("-", " ").replace(":", " ").replace("/", " ").replace(".", " ").split():
        if w in ROMAN_NUMERALS:
            words.append(ROMAN_NUMERALS[w])
        else:
            words.append(w)
    text = " ".join(words)

    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def strip_leading_articles(text: str) -> str:
    for art in ["the ", "a ", "an "]:
        if text.startswith(art):
            return text[len(art):].strip()
    return text

def extract_sequel_numbers(text: str) -> set[str]:
    return set(re.findall(r'\b\d+\b', text))

class GameSettings(BaseModel):
    scoring_mode: str = "top_answer"  # "top_answer" (101 - rank) or "deep_cut" (rank)
    turn_timer: int = 30              # seconds per turn (0 for unlimited)
    max_turns: int = 0                # per team (0 for unlimited)
    max_strikes: int = 3              # strikes before round elimination (0 for unlimited)
    match_mode: str = "single"        # "single" or "multi"
    total_rounds: int = 1             # 1 to 5 rounds
    sfx_enabled: bool = True
    sfx_volume: float = 0.7

class GameState:
    def __init__(self):
        self.teams: List[str] = ["Team 1", "Team 2", "Team 3"]
        self.scores: List[int] = [0, 0, 0]             # Active round scores
        self.match_scores: List[int] = [0, 0, 0]       # Cumulative tournament scores
        self.strikes: List[int] = [0, 0, 0]            # Strikes per team
        self.turns_taken: List[int] = [0, 0, 0]        # Turns taken per team
        self.eliminated: List[bool] = [False, False, False]
        self.current_turn: int = 0
        self.current_round_index: int = 0              # Index in rounds_data
        self.current_match_round: int = 1              # 1 to total_rounds
        self.playlist: List[int] = [0]                 # List of category indices
        self.revealed_indices: List[int] = []
        self.revealed_by: Dict[str, str] = {}          # index -> team name
        self.settings: GameSettings = GameSettings()
        self.is_round_over: bool = False
        self.is_match_over: bool = False
        self.rounds_data: List[Dict[str, Any]] = []
        self.load_json_data()

    def load_json_data(self):
        base_path = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_path, "rounds_data.json")
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.rounds_data = data.get("rounds", [])
                print(f"SUCCESS: Loaded {len(self.rounds_data)} rounds from {path}")
        except Exception as e:
            print(f"ERROR: Could not load JSON from {path}. Error: {e}")
            self.rounds_data = [{"title": "MISSING DATA", "answers": ["Error"] * 100}]

    def reset_round_state(self):
        self.revealed_indices = []
        self.revealed_by = {}
        self.scores = [0] * len(self.teams)
        self.strikes = [0] * len(self.teams)
        self.turns_taken = [0] * len(self.teams)
        self.eliminated = [False] * len(self.teams)
        self.current_turn = 0
        self.is_round_over = False

    def reset_match(self):
        self.match_scores = [0] * len(self.teams)
        self.current_match_round = 1
        self.is_match_over = False
        self.reset_round_state()

    def advance_turn(self):
        n = len(self.teams)
        if n == 0:
            return

        # Check if all teams are eliminated in strike mode
        if self.settings.max_strikes > 0 and all(self.eliminated):
            self.is_round_over = True
            return

        # Check if max turns reached for all teams
        if self.settings.max_turns > 0 and all(t >= self.settings.max_turns for t in self.turns_taken):
            self.is_round_over = True
            return

        # Advance to next non-eliminated team
        for step in range(1, n + 1):
            next_idx = (self.current_turn + step) % n
            if not self.eliminated[next_idx]:
                if self.settings.max_turns == 0 or self.turns_taken[next_idx] < self.settings.max_turns:
                    self.current_turn = next_idx
                    return

        # If no valid team could be found, round is over
        self.is_round_over = True

    def calculate_points(self, rank_index: int) -> int:
        rank = rank_index + 1
        if self.settings.scoring_mode == "deep_cut":
            return rank
        # Default: Top Answer Bonus (Rank 1 -> 100 pts, Rank 100 -> 1 pt)
        return max(1, 101 - rank)

game = GameState()

class TeamUpdate(BaseModel):
    teams: List[str]

class GuessInput(BaseModel):
    guess: str

class SelectCategoryInput(BaseModel):
    category_index: int

class StartMatchInput(BaseModel):
    match_mode: str
    total_rounds: int
    category_indices: List[int]
    teams: Optional[List[str]] = None

class HostOverrideInput(BaseModel):
    action: str  # "reveal", "strike", "score", "skip_turn", "finish_round"
    index: Optional[int] = None
    team_index: Optional[int] = None
    delta: Optional[int] = None

@app.get("/game/state")
def get_game_state():
    if not game.rounds_data or game.current_round_index >= len(game.rounds_data):
        current_round = {"title": "NO DATA", "answers": []}
    else:
        current_round = game.rounds_data[game.current_round_index]

    return {
        "teams": game.teams,
        "scores": game.scores,
        "match_scores": game.match_scores,
        "strikes": game.strikes,
        "turns_taken": game.turns_taken,
        "eliminated": game.eliminated,
        "current_turn": game.current_turn,
        "current_round": game.current_round_index,
        "current_match_round": game.current_match_round,
        "total_rounds": game.settings.total_rounds,
        "match_mode": game.settings.match_mode,
        "revealed_indices": game.revealed_indices,
        "revealed_by": game.revealed_by,
        "current_round_title": current_round.get("title", "UNKNOWN ROUND"),
        "current_round_answers": current_round.get("answers", []),
        "is_round_over": game.is_round_over,
        "is_match_over": game.is_match_over,
        "settings": game.settings.dict()
    }

@app.get("/game/categories")
def get_categories():
    return [
        {
            "index": i,
            "title": r.get("title", f"Category {i + 1}"),
            "count": len(r.get("answers", []))
        }
        for i, r in enumerate(game.rounds_data)
    ]

@app.post("/game/settings")
def update_settings(settings: GameSettings):
    game.settings = settings
    return {"message": "Settings updated", "settings": game.settings.dict()}

@app.post("/game/teams")
def update_teams(data: TeamUpdate):
    if not data.teams:
        return {"status": "error", "message": "At least one team required"}
    game.teams = data.teams
    game.scores = [0] * len(game.teams)
    game.match_scores = [0] * len(game.teams)
    game.strikes = [0] * len(game.teams)
    game.turns_taken = [0] * len(game.teams)
    game.eliminated = [False] * len(game.teams)
    game.current_turn = 0
    return {"message": "Teams updated successfully", "teams": game.teams}

@app.post("/game/select_category")
def select_category(data: SelectCategoryInput):
    if 0 <= data.category_index < len(game.rounds_data):
        game.current_round_index = data.category_index
        game.reset_round_state()
        return {"message": "Category selected", "index": game.current_round_index}
    return {"status": "error", "message": "Invalid category index"}

@app.post("/game/start_match")
def start_match(data: StartMatchInput):
    if data.teams and len(data.teams) > 0:
        game.teams = data.teams

    game.settings.match_mode = data.match_mode
    game.settings.total_rounds = max(1, min(5, data.total_rounds if data.match_mode == "multi" else 1))
    game.playlist = data.category_indices if data.category_indices else [0]
    game.current_round_index = game.playlist[0] if game.playlist else 0
    game.reset_match()
    return {"message": "Match started", "round": game.current_match_round, "total_rounds": game.settings.total_rounds}

@app.post("/game/guess")
def submit_guess(data: GuessInput):
    guess = data.guess.strip()
    if not guess or game.is_round_over:
        return {"status": "invalid"}

    current_round = game.rounds_data[game.current_round_index]
    answers = current_round.get("answers", [])

    norm_guess = normalize_text(guess)
    clean_guess = strip_leading_articles(norm_guess)
    if not clean_guess or clean_guess in STOP_WORDS:
        return {"status": "invalid"}

    guess_sequels = extract_sequel_numbers(norm_guess)

    best_match_index = -1
    best_score = 0.0

    # 1. Search for match among UNREVEALED answers
    for i, orig_name in enumerate(answers):
        if i in game.revealed_indices:
            continue

        norm_name = normalize_text(orig_name)
        clean_name = strip_leading_articles(norm_name)
        answer_sequels = extract_sequel_numbers(norm_name)

        # Sequel protection: e.g. "resident evil" will NOT match "resident evil 6"
        if answer_sequels and not (answer_sequels & guess_sequels):
            continue
        if guess_sequels and not (guess_sequels & answer_sequels):
            continue

        # Exact match
        if clean_guess == clean_name or norm_guess == norm_name:
            best_match_index = i
            best_score = 1.0
            break

        # Subtitle handling (e.g. colon or hyphen)
        if ":" in orig_name or " - " in orig_name:
            sep = ":" if ":" in orig_name else " - "
            parts = orig_name.split(sep, 1)
            main_part = strip_leading_articles(normalize_text(parts[0]))
            sub_part = strip_leading_articles(normalize_text(parts[1]))

            # Guess matched exact subtitle (e.g. "Endgame", "No Way Home", "Skyrim")
            if clean_guess == sub_part and sub_part not in STOP_WORDS and len(sub_part) >= 4:
                best_match_index = i
                best_score = 0.98
                break

            # Guess matched main part if only one unrevealed has this prefix
            if clean_guess == main_part and main_part not in STOP_WORDS and len(main_part) >= 4:
                same_prefix_count = sum(
                    1 for idx, a in enumerate(answers)
                    if idx not in game.revealed_indices and strip_leading_articles(normalize_text(a)).startswith(main_part)
                )
                if same_prefix_count == 1:
                    best_match_index = i
                    best_score = 0.95
                    break

        # Fuzzy ratio check with high threshold for typo tolerance
        fuzz = SequenceMatcher(None, clean_guess, clean_name).ratio()
        if fuzz >= 0.84 and fuzz > best_score:
            best_score = fuzz
            best_match_index = i

    # Process Correct Guess
    if best_match_index != -1 and best_score >= 0.84:
        rank = best_match_index + 1
        points = game.calculate_points(best_match_index)
        name = answers[best_match_index]

        game.revealed_indices.append(best_match_index)
        team_name = game.teams[game.current_turn]
        game.revealed_by[str(best_match_index)] = team_name

        game.scores[game.current_turn] += points
        game.match_scores[game.current_turn] += points
        game.turns_taken[game.current_turn] += 1

        # Check if all 100 tiles are revealed
        if len(game.revealed_indices) >= len(answers):
            game.is_round_over = True

        game.advance_turn()

        return {
            "status": "correct",
            "index": best_match_index,
            "name": name,
            "rank": rank,
            "points": points,
            "team": team_name
        }

    # 2. Check if already revealed
    for i in game.revealed_indices:
        orig_name = answers[i]
        norm_name = normalize_text(orig_name)
        clean_name = strip_leading_articles(norm_name)
        fuzz = SequenceMatcher(None, clean_guess, clean_name).ratio()
        if clean_guess == clean_name or fuzz >= 0.84 or (len(clean_guess) >= 4 and clean_guess in clean_name):
            return {"status": "exists", "name": orig_name, "index": i}

    # 3. Incorrect Guess
    cur_team = game.current_turn
    game.strikes[cur_team] += 1
    game.turns_taken[cur_team] += 1

    was_eliminated = False
    if game.settings.max_strikes > 0 and game.strikes[cur_team] >= game.settings.max_strikes:
        game.eliminated[cur_team] = True
        was_eliminated = True

    game.advance_turn()

    return {
        "status": "incorrect",
        "guess": guess,
        "team": game.teams[cur_team],
        "strikes": game.strikes[cur_team],
        "eliminated": was_eliminated
    }

@app.post("/game/pass_turn")
def pass_turn():
    """Called on timer expiration or pass."""
    if game.is_round_over:
        return {"status": "round_over"}

    cur_team = game.current_turn
    game.strikes[cur_team] += 1
    game.turns_taken[cur_team] += 1

    was_eliminated = False
    if game.settings.max_strikes > 0 and game.strikes[cur_team] >= game.settings.max_strikes:
        game.eliminated[cur_team] = True
        was_eliminated = True

    game.advance_turn()
    return {
        "status": "passed",
        "team": game.teams[cur_team],
        "strikes": game.strikes[cur_team],
        "eliminated": was_eliminated
    }

@app.post("/game/override")
def host_override(data: HostOverrideInput):
    """Hidden host override for adjustments."""
    current_round = game.rounds_data[game.current_round_index]
    answers = current_round.get("answers", [])

    if data.action == "reveal" and data.index is not None and 0 <= data.index < len(answers):
        idx = data.index
        if idx not in game.revealed_indices:
            game.revealed_indices.append(idx)
            target_team_idx = data.team_index if (data.team_index is not None and 0 <= data.team_index < len(game.teams)) else game.current_turn
            team_name = game.teams[target_team_idx]
            game.revealed_by[str(idx)] = team_name
            pts = game.calculate_points(idx)
            game.scores[target_team_idx] += pts
            game.match_scores[target_team_idx] += pts
            return {"status": "ok", "message": f"Revealed #{idx + 1} ({answers[idx]}) for {team_name}"}

    elif data.action == "strike" and data.team_index is not None and 0 <= data.team_index < len(game.teams):
        delta = data.delta if data.delta is not None else 1
        game.strikes[data.team_index] = max(0, game.strikes[data.team_index] + delta)
        if game.settings.max_strikes > 0:
            game.eliminated[data.team_index] = (game.strikes[data.team_index] >= game.settings.max_strikes)
        return {"status": "ok", "strikes": game.strikes[data.team_index]}

    elif data.action == "score" and data.team_index is not None and 0 <= data.team_index < len(game.teams):
        delta = data.delta if data.delta is not None else 10
        game.scores[data.team_index] = max(0, game.scores[data.team_index] + delta)
        game.match_scores[data.team_index] = max(0, game.match_scores[data.team_index] + delta)
        return {"status": "ok", "score": game.scores[data.team_index], "match_score": game.match_scores[data.team_index]}

    elif data.action == "skip_turn":
        game.advance_turn()
        return {"status": "ok", "current_turn": game.current_turn}

    elif data.action == "finish_round":
        game.is_round_over = True
        return {"status": "ok", "message": "Round finished by host"}

    return {"status": "error", "message": "Invalid override command"}

@app.post("/game/next_round")
def next_round():
    # If in tournament multi-round
    if game.settings.match_mode == "multi" and game.current_match_round < game.settings.total_rounds:
        game.current_match_round += 1
        playlist_idx = (game.current_match_round - 1) % len(game.playlist)
        game.current_round_index = game.playlist[playlist_idx]
        game.reset_round_state()
        return {"message": "Advanced to next match round", "round": game.current_match_round}
    elif game.settings.match_mode == "multi":
        game.is_match_over = True
        return {"message": "Tournament complete", "is_match_over": True}

    # Sequential single advance
    if game.current_round_index < len(game.rounds_data) - 1:
        game.current_round_index += 1
        game.reset_round_state()
    return {"message": "Advanced to next round", "round": game.current_round_index}

@app.post("/game/prev_round")
def prev_round():
    if game.current_round_index > 0:
        game.current_round_index -= 1
        game.reset_round_state()
    return {"message": "Returned to previous round", "round": game.current_round_index}

@app.post("/game/give_up")
def give_up():
    current_round = game.rounds_data[game.current_round_index]
    answers = current_round.get("answers", [])
    for i in range(len(answers)):
        if i not in game.revealed_indices:
            game.revealed_indices.append(i)
            game.revealed_by[str(i)] = "REVEALED"
    game.is_round_over = True
    return {"message": "All answers revealed", "count": len(answers)}

@app.post("/game/reset_match")
def reset_match():
    game.reset_match()
    return {"message": "Match reset successfully"}