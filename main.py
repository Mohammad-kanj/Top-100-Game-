from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import os
import re
import unicodedata
import asyncio
import time
import random
import uuid
from difflib import SequenceMatcher
import socket

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

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
    "xi": "11", "xii": "12", "xiii": "13", "xiv": "14", "xv": "15",
    "xvi": "16", "xvii": "17", "xviii": "18", "xix": "19", "xx": "20",
    "xxi": "21", "xxii": "22", "xxiii": "23", "xxiv": "24", "xxv": "25",
    "xxvi": "26", "xxvii": "27", "xxviii": "28", "xxix": "29", "xxx": "30",
    "xxxi": "31", "xxxii": "32", "xxxiii": "33", "xxxiv": "34", "xxxv": "35",
    "xxxvi": "36", "xxxvii": "37", "xxxviii": "38", "xxxix": "39", "xl": "40",
    "xli": "41", "xlii": "42", "xliii": "43", "xliv": "44", "xlv": "45",
    "xlvi": "46", "xlvii": "47", "xlviii": "48", "xlix": "49", "l": "50"
}

ABBREVIATIONS = {
    # Gaming
    "gta": "grand theft auto",
    "cod": "call of duty",
    "botw": "breath of the wild",
    "totk": "tears of the kingdom",
    "csgo": "counter strike global offensive",
    "cs:go": "counter strike global offensive",
    "cs": "counter strike",
    "pubg": "playerunknowns battlegrounds",
    "rdr": "red dead redemption",
    "rdr2": "red dead redemption 2",
    "wow": "world of warcraft",
    "ff": "final fantasy",
    "ac": "assassins creed",
    "mk": "mario kart",
    "lol": "league of legends",
    "pkmn": "pokemon",
    "smash": "super smash bros",
    "ssb": "super smash bros",
    "tf2": "team fortress 2",

    # Pop Culture, Movies & Anime
    "lotr": "lord of the rings",
    "hp": "harry potter",
    "got": "game of thrones",
    "mcu": "marvel cinematic universe",
    "dcu": "dc extended universe",
    "sw": "star wars",
    "st": "stranger things",
    "bb": "breaking bad",
    "bcs": "better call saul",
    "potc": "pirates of the caribbean",
    "atla": "avatar the last airbender",
    "fma": "fullmetal alchemist",
    "aot": "attack on titan",
    "dbz": "dragon ball z",
    "dbs": "dragon ball super",
    "op": "one piece",
    "jjk": "jujutsu kaisen",
    "mha": "my hero academia",
    "ds": "demon slayer",
    "hxh": "hunter x hunter",

    # Geography & Countries
    "usa": "united states",
    "us": "united states",
    "uk": "united kingdom",
    "uae": "united arab emirates",
    "drc": "democratic republic of the congo",
    "car": "central african republic",
    "nz": "new zealand",
    "sa": "south africa",
    "prc": "china",
    "ussr": "russia",

    # Common Terms & Titles
    "dr": "doctor",
    "mr": "mister",
    "mrs": "missus",
    "ms": "miss",
    "st": "saint",
    "mt": "mount",
    "vs": "versus",
    "vol": "volume",
    "pt": "part",
    "ep": "episode",
    "gen": "generation"
}

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def evaluate_guess_match(clean_guess: str, clean_name: str) -> tuple[bool, float]:
    if not clean_guess or not clean_name:
        return False, 0.0
    if clean_guess == clean_name:
        return True, 1.0

    clean_guess_nospace = clean_guess.replace(" ", "")
    clean_name_nospace = clean_name.replace(" ", "")
    if clean_guess_nospace == clean_name_nospace and len(clean_guess_nospace) >= 4:
        return True, 0.98

    min_len = min(len(clean_guess), len(clean_name))
    diff = abs(len(clean_guess) - len(clean_name))

    # Levenshtein distance check for typos
    if min_len >= 4 and diff <= 2:
        dist = levenshtein_distance(clean_guess, clean_name)
        if dist <= 1:
            return True, 0.90
        if dist <= 2 and min_len >= 5:
            return True, 0.85

    # SequenceMatcher ratio check
    ratio = SequenceMatcher(None, clean_guess, clean_name).ratio()
    if min_len >= 4 and ratio >= 0.82:
        return True, ratio

    return False, ratio

def remove_accents(input_str: str) -> str:
    nfkd = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd if not unicodedata.combining(c)])

def normalize_text(text: str) -> str:
    text = remove_accents(text.lower().strip())
    text = text.replace("&", " and ")

    # Normalize common superhero and character words
    common_contractions = {
        "spiderman": "spider man",
        "ironman": "iron man",
        "batman": "bat man",
        "pacman": "pac man",
        "antman": "ant man",
        "aquaman": "aqua man",
        "xmen": "x men"
    }
    for orig_c, rep_c in common_contractions.items():
        text = re.sub(r'\b' + orig_c + r'\b', rep_c, text)

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
    nums = set()
    for w in re.findall(r'\b[a-z0-9]+\b', text.lower()):
        if w.isdigit():
            nums.add(w)
        elif w in ROMAN_NUMERALS:
            nums.add(ROMAN_NUMERALS[w])
    return nums

class GameSettings(BaseModel):
    end_condition: str = "both"        # "both", "turns", "points"
    point_threshold: int = 500        # Target points to win (0 for off, or 250, 500, 750, 1000, 1500, 2500)
    turn_timer: int = 30              # seconds per turn (0 for untimed, 30, 60, 90)
    max_turns: int = 0                # per team (0 for unlimited, 10, 15, 20)
    match_mode: str = "single"        # "single", "multi", "boss_rush"
    total_rounds: int = 1             # 1 to 5 rounds
    boss_rush_duration: int = 300     # 300 (5m), 600 (10m), 900 (15m)
    sfx_enabled: bool = True
    sfx_volume: float = 0.7

class GameState:
    def __init__(self):
        self.teams: List[str] = ["Team 1", "Team 2", "Team 3"]
        self.scores: List[int] = [0, 0, 0]             # Active round scores
        self.match_scores: List[int] = [0, 0, 0]       # Cumulative tournament scores
        self.turns_taken: List[int] = [0, 0, 0]        # Turns taken per team
        self.current_turn: int = 0
        self.current_round_index: int = 0              # Index in rounds_data
        self._current_match_round: int = 1              # 1 to total_rounds
        self.playlist: List[int] = [0]                 # List of category indices
        self.revealed_indices: List[int] = []
        self.revealed_by: Dict[str, str] = {}          # index -> team name or "MISSED"
        self.settings: GameSettings = GameSettings()
        self.is_round_over: bool = False
        self._is_match_over: bool = False
        self.winner: Optional[str] = None
        self.surrendered: bool = False
        self.rounds_data: List[Dict[str, Any]] = []
        self.load_json_data()

    @property
    def current_match_round(self) -> int:
        for _ in range(5):
            if self._current_match_round != 1:
                break
            time.sleep(0.02)
        return self._current_match_round

    @current_match_round.setter
    def current_match_round(self, val: int):
        self._current_match_round = val

    @property
    def is_match_over(self) -> bool:
        for _ in range(5):
            if not self._is_match_over:
                break
            time.sleep(0.02)
        return self._is_match_over

    @is_match_over.setter
    def is_match_over(self, val: bool):
        self._is_match_over = val

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
        self.turns_taken = [0] * len(self.teams)
        self.current_turn = 0
        self.is_round_over = False
        self.winner = None
        self.surrendered = False

    def reset_match(self):
        self.match_scores = [0] * len(self.teams)
        self.current_match_round = 1
        self.is_match_over = False
        self.winner = None
        self.surrendered = False
        self.reset_round_state()

    def end_game(self, winner: Optional[str] = None):
        self.is_round_over = True
        if winner is not None:
            self.winner = winner
            self.is_match_over = True
        elif self.settings.match_mode in ("single", "boss_rush") or self.current_match_round >= self.settings.total_rounds:
            self.is_match_over = True
            scores_to_check = self.match_scores if self.settings.match_mode == "multi" else self.scores
            if scores_to_check:
                max_s = max(scores_to_check)
                win_idx = scores_to_check.index(max_s)
                self.winner = self.teams[win_idx]

        # Reveal all remaining unanswered tiles so players can inspect the board
        if self.rounds_data and self.current_round_index < len(self.rounds_data):
            current_round = self.rounds_data[self.current_round_index]
            answers = current_round.get("answers", [])
            for i in range(len(answers)):
                if i not in self.revealed_indices:
                    self.revealed_indices.append(i)
                    self.revealed_by[str(i)] = "MISSED"

    def advance_turn(self):
        n = len(self.teams)
        if n <= 1:
            if self.settings.end_condition in ("turns", "both") and self.settings.max_turns > 0:
                if self.turns_taken and self.turns_taken[0] >= self.settings.max_turns:
                    self.end_game()
            return

        # Check if max turns reached for all teams (only if end_condition is "turns" or "both")
        if self.settings.end_condition in ("turns", "both") and self.settings.max_turns > 0:
            if all(t >= self.settings.max_turns for t in self.turns_taken):
                self.end_game()
                return

        # Advance to next team
        for step in range(1, n + 1):
            next_idx = (self.current_turn + step) % n
            if self.settings.end_condition not in ("turns", "both") or self.settings.max_turns == 0 or self.turns_taken[next_idx] < self.settings.max_turns:
                self.current_turn = next_idx
                return

        self.end_game()

    def calculate_points(self, rank_index: int) -> int:
        # Deep Cut Bonus: points equal the rank of the answer (Rank 1 = 1 pt, Rank 99 = 99 pts, Rank 100 = 100 pts)
        return rank_index + 1

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
    boss_rush_duration: Optional[int] = 300
    point_threshold: Optional[int] = None
    turn_timer: Optional[int] = None
    max_turns: Optional[int] = None
    end_condition: Optional[str] = None

class HostOverrideInput(BaseModel):
    action: str  # "reveal", "score", "skip_turn", "finish_round"
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
        "strikes": [0] * len(game.teams),
        "turns_taken": game.turns_taken,
        "eliminated": [False] * len(game.teams),
        "current_turn": game.current_turn,
        "current_round": game.current_round_index,
        "current_match_round": game.current_match_round,
        "total_rounds": game.settings.total_rounds,
        "match_mode": game.settings.match_mode,
        "boss_rush_duration": game.settings.boss_rush_duration,
        "end_condition": game.settings.end_condition,
        "point_threshold": game.settings.point_threshold,
        "winner": game.winner,
        "revealed_indices": game.revealed_indices,
        "revealed_by": game.revealed_by,
        "current_round_title": current_round.get("title", "UNKNOWN ROUND"),
        "current_round_subtitle": current_round.get("subtitle", ""),
        "current_round_answers": current_round.get("answers", []),
        "is_round_over": game.is_round_over,
        "is_match_over": game.is_match_over,
        "surrendered": game.surrendered,
        "settings": game.settings.dict()
    }

@app.get("/game/categories")
def get_categories():
    return [
        {
            "index": i,
            "title": r.get("title", f"Category {i + 1}"),
            "subtitle": r.get("subtitle", ""),
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
    game.reset_match()
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
    if data.match_mode != "boss_rush":
        active_teams = data.teams if (data.teams and len(data.teams) > 0) else game.teams
        if len(active_teams) <= 1 and game.settings.turn_timer > 0:
            return {
                "status": "error",
                "message": "At least 2 teams required to start a timed match. Add teams or play Boss Rush mode."
            }

    if data.match_mode == "boss_rush":
        solo_team = data.teams[0] if data.teams and len(data.teams) > 0 else "Solo Player"
        game.teams = [solo_team]
        game.settings.match_mode = "boss_rush"
        game.settings.total_rounds = 1
        game.settings.boss_rush_duration = data.boss_rush_duration or 300
    else:
        if data.teams and len(data.teams) > 0:
            game.teams = data.teams
        game.settings.match_mode = data.match_mode
        game.settings.total_rounds = max(1, min(5, data.total_rounds if data.match_mode == "multi" else 1))

    if data.point_threshold is not None:
        game.settings.point_threshold = data.point_threshold
    if data.turn_timer is not None:
        game.settings.turn_timer = data.turn_timer
    if data.max_turns is not None:
        game.settings.max_turns = data.max_turns
    if data.end_condition is not None:
        game.settings.end_condition = data.end_condition

    game.playlist = data.category_indices if data.category_indices else [0]
    game.current_round_index = game.playlist[0] if game.playlist else 0
    game.reset_match()
    return {
        "message": "Match started",
        "round": game.current_match_round,
        "total_rounds": game.settings.total_rounds,
        "match_mode": game.settings.match_mode,
        "boss_rush_duration": game.settings.boss_rush_duration,
        "point_threshold": game.settings.point_threshold
    }

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

        # Parenthesis alternative/original title handling: e.g. "Attack on Titan (Shingeki no Kyojin)"
        if "(" in orig_name and ")" in orig_name:
            main_p = strip_leading_articles(normalize_text(orig_name.split("(")[0]))
            inside_m = re.search(r"\((.*?)\)", orig_name)
            inside_p = strip_leading_articles(normalize_text(inside_m.group(1))) if inside_m else ""
            if clean_guess and (clean_guess == main_p or (len(clean_guess) >= 4 and clean_guess == inside_p)):
                best_match_index = i
                best_score = 0.99
                break
            if clean_guess and len(clean_guess) >= 4:
                if SequenceMatcher(None, clean_guess, main_p).ratio() >= 0.84:
                    best_match_index = i
                    best_score = 0.95
                    break
                if inside_p and SequenceMatcher(None, clean_guess, inside_p).ratio() >= 0.84:
                    best_match_index = i
                    best_score = 0.95
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

        # Smart Typo & Fuzzy Matching via Levenshtein & SequenceMatcher
        is_matched, match_score = evaluate_guess_match(clean_guess, clean_name)
        if is_matched and match_score > best_score:
            best_score = match_score
            best_match_index = i

    # Process Correct Guess
    if best_match_index != -1 and best_score >= 0.82:
        rank = best_match_index + 1
        points = game.calculate_points(best_match_index)
        name = answers[best_match_index]

        game.revealed_indices.append(best_match_index)
        team_name = game.teams[game.current_turn]
        game.revealed_by[str(best_match_index)] = team_name

        game.scores[game.current_turn] += points
        game.match_scores[game.current_turn] += points
        game.turns_taken[game.current_turn] += 1

        # Check if point threshold reached to win
        target = game.settings.point_threshold
        active_score = game.match_scores[game.current_turn] if game.settings.match_mode == "multi" else game.scores[game.current_turn]

        if game.settings.end_condition in ("points", "both") and target > 0 and active_score >= target:
            game.end_game(winner=team_name)
        elif len(game.revealed_indices) >= len(answers):
            game.end_game()
        elif game.settings.match_mode != "boss_rush":
            game.advance_turn()

        return {
            "status": "correct",
            "index": best_match_index,
            "name": name,
            "rank": rank,
            "points": points,
            "team": team_name,
            "winner": game.winner,
            "is_round_over": game.is_round_over,
            "is_match_over": game.is_match_over
        }

    # 2. Check if already revealed
    for i in game.revealed_indices:
        orig_name = answers[i]
        norm_name = normalize_text(orig_name)
        clean_name = strip_leading_articles(norm_name)
        answer_sequels = extract_sequel_numbers(norm_name)

        # Sequel protection: e.g. typing "final fantasy" should NOT trigger "already revealed" on "final fantasy xv"
        if answer_sequels and not (answer_sequels & guess_sequels):
            continue
        if guess_sequels and not (guess_sequels & answer_sequels):
            continue

        is_matched, match_score = evaluate_guess_match(clean_guess, clean_name)
        if clean_guess == clean_name or is_matched or (len(clean_guess) >= 4 and clean_guess in clean_name):
            return {"status": "exists", "name": orig_name, "index": i}
        if "(" in orig_name and ")" in orig_name:
            main_p = strip_leading_articles(normalize_text(orig_name.split("(")[0]))
            inside_m = re.search(r"\((.*?)\)", orig_name)
            inside_p = strip_leading_articles(normalize_text(inside_m.group(1))) if inside_m else ""
            if clean_guess == main_p or (len(clean_guess) >= 4 and clean_guess == inside_p):
                return {"status": "exists", "name": orig_name, "index": i}

    # 3. Incorrect Guess (No strikes!)
    cur_team = game.current_turn
    game.turns_taken[cur_team] += 1

    if game.settings.match_mode != "boss_rush":
        game.advance_turn()

    return {
        "status": "incorrect",
        "guess": guess,
        "team": game.teams[cur_team]
    }

@app.post("/game/pass_turn")
def pass_turn():
    """Called on timer expiration or pass."""
    if game.is_round_over:
        return {"status": "round_over"}

    cur_team = game.current_turn
    game.turns_taken[cur_team] += 1

    if game.settings.match_mode != "boss_rush":
        game.advance_turn()

    return {
        "status": "passed",
        "team": game.teams[cur_team]
    }

@app.post("/game/skip_category")
def skip_category():
    if game.is_round_over:
        return {"status": "round_already_over"}
    game.surrendered = True
    game.end_game()
    return {"status": "category_skipped", "is_round_over": True, "is_match_over": game.is_match_over}

@app.post("/game/boss_rush_expire")
def boss_rush_expire():
    game.end_game()
    return {"status": "expired", "is_round_over": True, "is_match_over": True}

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
            target = game.settings.point_threshold
            active_score = game.match_scores[target_team_idx] if game.settings.match_mode == "multi" else game.scores[target_team_idx]
            if target > 0 and active_score >= target:
                game.end_game(winner=team_name)
            return {"status": "ok", "message": f"Revealed #{idx + 1} ({answers[idx]}) for {team_name}"}

    elif data.action == "score" and data.team_index is not None and 0 <= data.team_index < len(game.teams):
        delta = data.delta if data.delta is not None else 10
        game.scores[data.team_index] = max(0, game.scores[data.team_index] + delta)
        game.match_scores[data.team_index] = max(0, game.match_scores[data.team_index] + delta)
        target = game.settings.point_threshold
        active_score = game.match_scores[data.team_index] if game.settings.match_mode == "multi" else game.scores[data.team_index]
        if target > 0 and active_score >= target:
            game.end_game(winner=game.teams[data.team_index])
        return {"status": "ok", "score": game.scores[data.team_index], "match_score": game.match_scores[data.team_index], "winner": game.winner}

    elif data.action == "skip_turn":
        game.advance_turn()
        return {"status": "ok", "current_turn": game.current_turn}

    elif data.action == "finish_round":
        game.end_game()
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

# ==============================================================================
# ONLINE MULTIPLAYER (WEBSOCKETS, LOBBIES, PROFANITY FILTER & SURRENDER VOTING)
# ==============================================================================

ENGLISH_PROFANITIES = {
    "ass", "asshole", "bastard", "bitch", "blowjob", "bollocks", "bullshit",
    "cock", "crap", "cunt", "damn", "dick", "dildo", "fag", "faggot", "fuck",
    "fucking", "goddamn", "hell", "homo", "jerk", "motherfucker", "nigger",
    "nigga", "penis", "piss", "prick", "pussy", "shit", "slut", "tit", "tits",
    "twat", "vagina", "whore", "wank", "wanker"
}

def is_inappropriate_name(name: str) -> bool:
    clean = name.lower().strip()
    clean = clean.replace("@", "a").replace("$", "s").replace("0", "o").replace("1", "i").replace("3", "e").replace("5", "s").replace("!", "i")
    clean = re.sub(r'[^a-z\s]', '', clean)
    words = clean.split()
    for w in words:
        if w in ENGLISH_PROFANITIES:
            return True
    no_spaces = clean.replace(" ", "")
    for p in ENGLISH_PROFANITIES:
        if len(p) >= 4 and p in no_spaces:
            return True
    return False

class CreateRoomInput(BaseModel):
    host_name: str

class JoinRoomInput(BaseModel):
    room_code: str
    player_name: str

class OnlinePlayer:
    def __init__(self, player_id: str, name: str, is_host: bool = False):
        self.player_id = player_id
        self.name = name
        self.is_host = is_host
        self.websocket: Optional[WebSocket] = None
        self.consecutive_incorrect = 0
        self.eligible_for_surrender = False

class OnlineRoom:
    def __init__(self, code: str, host_id: str, host_name: str):
        self.code = code
        self.host_id = host_id
        self.players: Dict[str, OnlinePlayer] = {}
        self.player_order: List[str] = []
        self.game_state: GameState = GameState()
        self.game_state.playlist = []
        self.game_state.current_round_index = -1
        self.is_configured: bool = False
        self.status: str = "LOBBY"  # "LOBBY" | "PLAYING"
        self.surrender_vote: Optional[Dict[str, Any]] = None
        self.turn_expires_at: Optional[float] = None
        self.turn_timer_task: Optional[asyncio.Task] = None
        self.turn_generation: int = 0
        self.boss_rush_expires_at: Optional[float] = None
        self.boss_rush_timer_task: Optional[asyncio.Task] = None
        self.boss_rush_generation: int = 0
        self.add_player(host_id, host_name, is_host=True)

    def cancel_turn_timer(self):
        if self.turn_timer_task and not self.turn_timer_task.done():
            self.turn_timer_task.cancel()
            self.turn_timer_task = None
        self.turn_expires_at = None

    def cancel_boss_rush_timer(self):
        if self.boss_rush_timer_task and not self.boss_rush_timer_task.done():
            self.boss_rush_timer_task.cancel()
            self.boss_rush_timer_task = None
        self.boss_rush_expires_at = None

    def start_turn_timer(self):
        self.cancel_turn_timer()
        if self.status != "PLAYING" or self.game_state.is_round_over or self.game_state.settings.match_mode == "boss_rush":
            return
        timer_seconds = self.game_state.settings.turn_timer
        if timer_seconds and timer_seconds > 0:
            self.turn_expires_at = time.time() + timer_seconds
            self.turn_generation += 1
            gen = self.turn_generation
            try:
                loop = asyncio.get_running_loop()
                self.turn_timer_task = loop.create_task(self._run_turn_timer(gen, float(timer_seconds)))
            except RuntimeError:
                pass

    async def _run_turn_timer(self, gen: int, duration: float):
        try:
            await asyncio.sleep(duration)
            if self.turn_generation != gen or self.status != "PLAYING" or self.game_state.is_round_over:
                return
            active_pid = self.get_active_player_id()
            if active_pid:
                player_team_idx = self.player_order.index(active_pid) if active_pid in self.player_order else 0
                if active_pid in self.players:
                    self.players[active_pid].consecutive_incorrect += 1
                    if self.players[active_pid].consecutive_incorrect >= 3:
                        self.players[active_pid].eligible_for_surrender = True
                self.game_state.turns_taken[player_team_idx] += 1
                self.game_state.advance_turn()
                p_name = self.players[active_pid].name if active_pid in self.players else "Player"
                if not self.game_state.is_round_over:
                    self.start_turn_timer()
                await broadcast_room(self, "TURN_PASSED", {
                    "player_id": active_pid,
                    "name": p_name,
                    "timeout": True
                })
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in turn timer task: {e}")

    def start_boss_rush_timer(self):
        self.cancel_boss_rush_timer()
        if self.status != "PLAYING" or self.game_state.is_round_over or self.game_state.settings.match_mode != "boss_rush":
            return
        duration = self.game_state.settings.boss_rush_duration or 300
        if duration > 0:
            self.boss_rush_expires_at = time.time() + duration
            self.boss_rush_generation += 1
            gen = self.boss_rush_generation
            try:
                loop = asyncio.get_running_loop()
                self.boss_rush_timer_task = loop.create_task(self._run_boss_rush_timer(gen, float(duration)))
            except RuntimeError:
                pass

    async def _run_boss_rush_timer(self, gen: int, duration: float):
        try:
            await asyncio.sleep(duration)
            if self.boss_rush_generation != gen or self.status != "PLAYING" or self.game_state.is_round_over:
                return
            self.game_state.end_game(winner="Co-op Squad")
            await broadcast_room(self, "BOSS_RUSH_EXPIRED")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in boss rush timer: {e}")

    def add_player(self, player_id: str, name: str, is_host: bool = False) -> OnlinePlayer:
        if player_id not in self.players:
            player = OnlinePlayer(player_id, name, is_host)
            self.players[player_id] = player
            self.player_order.append(player_id)
        else:
            player = self.players[player_id]
            player.name = name
        self.sync_teams_to_game()
        return player

    def remove_player(self, player_id: str):
        if player_id in self.players:
            del self.players[player_id]
        if player_id in self.player_order:
            self.player_order.remove(player_id)
        if self.host_id == player_id and self.player_order:
            self.host_id = self.player_order[0]
            if self.host_id in self.players:
                self.players[self.host_id].is_host = True
        self.sync_teams_to_game()

    def sync_teams_to_game(self):
        if self.game_state.settings.match_mode == "boss_rush":
            self.game_state.teams = ["Co-op Squad"]
            self.game_state.scores = [0]
            self.game_state.match_scores = [0]
            self.game_state.turns_taken = [0]
            return
        team_names = [self.players[pid].name for pid in self.player_order if pid in self.players]
        if not team_names:
            team_names = ["Player 1"]
        self.game_state.teams = team_names
        n = len(team_names)
        self.game_state.scores = [0] * n
        self.game_state.match_scores = [0] * n
        self.game_state.turns_taken = [0] * n

    def get_active_player_id(self) -> Optional[str]:
        if self.status != "PLAYING" or not self.player_order:
            return None
        idx = self.game_state.current_turn % len(self.player_order)
        return self.player_order[idx]

    def to_dict(self) -> Dict[str, Any]:
        if not self.game_state.rounds_data or self.game_state.current_round_index < 0 or self.game_state.current_round_index >= len(self.game_state.rounds_data):
            current_round = {"title": "NO DATA", "answers": []}
        else:
            current_round = self.game_state.rounds_data[self.game_state.current_round_index]

        selected_category_names = [
            self.game_state.rounds_data[idx].get("title", f"Category {idx + 1}")
            for idx in self.game_state.playlist
            if 0 <= idx < len(self.game_state.rounds_data)
        ] if self.is_configured else []

        return {
            "room_code": self.code,
            "host_id": self.host_id,
            "host_ip": get_local_ip(),
            "status": self.status,
            "is_configured": self.is_configured,
            "category_indices": self.game_state.playlist if self.is_configured else [],
            "selected_categories": selected_category_names,
            "players": [
                {
                    "player_id": p.player_id,
                    "name": p.name,
                    "is_host": p.is_host,
                    "is_connected": p.websocket is not None,
                    "consecutive_incorrect": p.consecutive_incorrect,
                    "eligible_for_surrender": p.eligible_for_surrender
                }
                for pid in self.player_order
                if pid in self.players and (p := self.players[pid])
            ],
            "active_player_id": self.get_active_player_id(),
            "turn_expires_at": self.turn_expires_at,
            "boss_rush_expires_at": self.boss_rush_expires_at,
            "surrender_vote": self.surrender_vote,
            "game_state": {
                "is_configured": self.is_configured,
                "category_indices": self.game_state.playlist if self.is_configured else [],
                "selected_categories": selected_category_names,
                "teams": self.game_state.teams,
                "scores": self.game_state.scores,
                "match_scores": self.game_state.match_scores,
                "turns_taken": self.game_state.turns_taken,
                "current_turn": self.game_state.current_turn,
                "current_round": self.game_state.current_round_index,
                "current_match_round": self.game_state.current_match_round,
                "total_rounds": self.game_state.settings.total_rounds,
                "match_mode": self.game_state.settings.match_mode,
                "boss_rush_duration": self.game_state.settings.boss_rush_duration,
                "turn_timer": self.game_state.settings.turn_timer,
                "point_threshold": self.game_state.settings.point_threshold,
                "max_turns": self.game_state.settings.max_turns,
                "end_condition": self.game_state.settings.end_condition,
                "winner": self.game_state.winner,
                "revealed_indices": self.game_state.revealed_indices,
                "revealed_by": self.game_state.revealed_by,
                "current_round_title": current_round.get("title", "UNKNOWN ROUND"),
                "current_round_subtitle": current_round.get("subtitle", ""),
                "current_round_answers": current_round.get("answers", []),
                "is_round_over": self.game_state.is_round_over,
                "is_match_over": self.game_state.is_match_over,
                "surrendered": self.game_state.surrendered,
                "settings": self.game_state.settings.dict()
            }
        }

online_rooms: Dict[str, OnlineRoom] = {}

def generate_room_code() -> str:
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    for _ in range(100):
        code = "".join(random.choices(chars, k=4))
        if code not in online_rooms:
            return code
    return uuid.uuid4().hex[:4].upper()

async def broadcast_room(room: OnlineRoom, event_type: str = "STATE_UPDATE", extra: Optional[Dict] = None):
    payload = {
        "type": event_type,
        "room": room.to_dict(),
        "extra": extra or {}
    }
    dead = []
    for pid, p in room.players.items():
        if p.websocket:
            try:
                await p.websocket.send_json(payload)
            except Exception:
                dead.append(pid)
    for pid in dead:
        if pid in room.players:
            room.players[pid].websocket = None

async def expire_surrender_vote(target_room: OnlineRoom, expire_time: float, sleep_duration: float = 60.0):
    await asyncio.sleep(sleep_duration)
    if target_room.surrender_vote and target_room.surrender_vote.get("expires_at") == expire_time:
        target_room.surrender_vote = None
        await broadcast_room(target_room, "SURRENDER_VOTE_EXPIRED")

def process_online_guess(room: OnlineRoom, player: OnlinePlayer, guess_text: str) -> Dict[str, Any]:
    guess = guess_text.strip()
    if not guess or room.game_state.is_round_over:
        return {"status": "invalid"}

    if not room.game_state.rounds_data or room.game_state.current_round_index < 0 or room.game_state.current_round_index >= len(room.game_state.rounds_data):
        return {"status": "invalid"}

    current_round = room.game_state.rounds_data[room.game_state.current_round_index]
    answers = current_round.get("answers", [])
    is_boss_rush = room.game_state.settings.match_mode == "boss_rush"
    player_team_idx = room.player_order.index(player.player_id) if player.player_id in room.player_order else 0

    clean_guess = strip_leading_articles(normalize_text(guess))
    guess_sequel_nums = extract_sequel_numbers(guess)

    best_match_index = -1
    best_score = 0.0

    for i, ans in enumerate(answers):
        orig_name = ans
        clean_name = strip_leading_articles(normalize_text(orig_name))

        if clean_guess == clean_name:
            best_match_index = i
            best_score = 1.0
            break

        ans_sequel_nums = extract_sequel_numbers(orig_name)
        if ans_sequel_nums != guess_sequel_nums:
            continue

        if ":" in orig_name or " - " in orig_name:
            sep = ":" if ":" in orig_name else " - "
            parts = orig_name.split(sep, 1)
            main_part = strip_leading_articles(normalize_text(parts[0]))
            sub_part = strip_leading_articles(normalize_text(parts[1]))

            if clean_guess == sub_part and sub_part not in STOP_WORDS and len(sub_part) >= 4:
                best_match_index = i
                best_score = 0.98
                break

            if clean_guess == main_part and main_part not in STOP_WORDS and len(main_part) >= 4:
                same_prefix_count = sum(
                    1 for idx, a in enumerate(answers)
                    if idx not in room.game_state.revealed_indices and strip_leading_articles(normalize_text(a)).startswith(main_part)
                )
                if same_prefix_count == 1:
                    best_match_index = i
                    best_score = 0.95
                    break

        is_matched, match_score = evaluate_guess_match(clean_guess, clean_name)
        if is_matched and match_score > best_score:
            best_score = match_score
            best_match_index = i

    if best_match_index != -1 and best_score >= 0.82:
        rank = best_match_index + 1
        points = room.game_state.calculate_points(best_match_index)
        name = answers[best_match_index]

        if best_match_index in room.game_state.revealed_indices:
            if not is_boss_rush:
                player.consecutive_incorrect += 1
                if player.consecutive_incorrect >= 3:
                    player.eligible_for_surrender = True
                room.game_state.advance_turn()
            return {
                "status": "exists",
                "guess": guess,
                "name": name,
                "rank": rank,
                "player_id": player.player_id,
                "player_name": player.name
            }

        room.game_state.revealed_indices.append(best_match_index)

        if is_boss_rush:
            room.game_state.revealed_by[str(best_match_index)] = player.name
            room.game_state.scores[0] += points
            room.game_state.match_scores[0] += points
            room.game_state.turns_taken[0] += 1
            target = room.game_state.settings.point_threshold
            if (target > 0 and room.game_state.scores[0] >= target) or len(room.game_state.revealed_indices) >= len(answers):
                room.game_state.end_game(winner="Co-op Squad")
            return {
                "status": "correct",
                "guess": guess,
                "name": name,
                "rank": rank,
                "points": points,
                "index": best_match_index,
                "team": "Co-op Squad",
                "player_id": player.player_id,
                "player_name": player.name
            }

        team_name = player.name
        room.game_state.revealed_by[str(best_match_index)] = team_name

        room.game_state.scores[player_team_idx] += points
        room.game_state.match_scores[player_team_idx] += points
        room.game_state.turns_taken[player_team_idx] += 1
        player.consecutive_incorrect = 0

        target = room.game_state.settings.point_threshold
        active_score = room.game_state.match_scores[player_team_idx] if room.game_state.settings.match_mode == "multi" else room.game_state.scores[player_team_idx]
        if room.game_state.settings.end_condition in ("points", "both") and target > 0 and active_score >= target:
            room.game_state.end_game(winner=team_name)

        if not room.game_state.is_round_over:
            room.game_state.advance_turn()

        return {
            "status": "correct",
            "guess": guess,
            "name": name,
            "rank": rank,
            "points": points,
            "index": best_match_index,
            "team": team_name,
            "player_id": player.player_id,
            "player_name": player.name
        }

    if is_boss_rush:
        return {
            "status": "incorrect",
            "guess": guess,
            "team": "Co-op Squad",
            "player_id": player.player_id,
            "player_name": player.name
        }

    player.consecutive_incorrect += 1
    if player.consecutive_incorrect >= 3:
        player.eligible_for_surrender = True
    room.game_state.turns_taken[player_team_idx] += 1
    room.game_state.advance_turn()

    return {
        "status": "incorrect",
        "guess": guess,
        "team": player.name,
        "player_id": player.player_id,
        "player_name": player.name
    }

@app.post("/online/create_room")
def create_online_room(data: CreateRoomInput):
    name = data.host_name.strip()
    if not name or len(name) < 2 or len(name) > 20:
        raise HTTPException(status_code=400, detail="Name must be between 2 and 20 characters.")
    if is_inappropriate_name(name):
        raise HTTPException(status_code=400, detail="Please choose an appropriate name.")

    room_code = generate_room_code()
    host_id = uuid.uuid4().hex[:8]
    room = OnlineRoom(room_code, host_id, name)
    online_rooms[room_code] = room

    return {
        "room_code": room_code,
        "player_id": host_id,
        "is_host": True,
        "room": room.to_dict()
    }

@app.post("/online/join_room")
def join_online_room(data: JoinRoomInput):
    code = data.room_code.strip().upper()
    name = data.player_name.strip()

    if code not in online_rooms:
        raise HTTPException(status_code=404, detail="Room not found. Please check the code.")
    if not name or len(name) < 2 or len(name) > 20:
        raise HTTPException(status_code=400, detail="Name must be between 2 and 20 characters.")
    if is_inappropriate_name(name):
        raise HTTPException(status_code=400, detail="Please choose an appropriate name.")

    room = online_rooms[code]
    if room.status == "PLAYING":
        raise HTTPException(status_code=400, detail="Match is already in progress.")
    if len(room.players) >= 8:
        raise HTTPException(status_code=400, detail="Room is full (max 8 players).")

    player_id = uuid.uuid4().hex[:8]
    room.add_player(player_id, name, is_host=False)

    return {
        "room_code": code,
        "player_id": player_id,
        "is_host": False,
        "room": room.to_dict()
    }

@app.get("/online/room/{code}")
def get_room_details(code: str):
    code = code.strip().upper()
    if code not in online_rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    return online_rooms[code].to_dict()

@app.websocket("/ws/{room_code}/{player_id}")
async def online_game_websocket(websocket: WebSocket, room_code: str, player_id: str):
    code = room_code.strip().upper()
    if code not in online_rooms:
        await websocket.close(code=4004)
        return

    room = online_rooms[code]
    if player_id not in room.players:
        await websocket.close(code=4003)
        return

    await websocket.accept()
    player = room.players[player_id]
    player.websocket = websocket

    await broadcast_room(room, "PLAYER_JOINED", {"player_id": player_id, "name": player.name})

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "PING":
                await websocket.send_json({"type": "PONG"})

            elif action == "UPDATE_CONFIG":
                if player.is_host:
                    cfg = data.get("config", {})
                    room.game_state.settings.match_mode = cfg.get("match_mode", "single")
                    room.game_state.settings.total_rounds = cfg.get("total_rounds", 1)
                    room.game_state.settings.turn_timer = cfg.get("turn_timer", 30)
                    room.game_state.settings.point_threshold = cfg.get("point_threshold", 500)
                    room.game_state.settings.max_turns = cfg.get("max_turns", 0)
                    room.game_state.settings.end_condition = cfg.get("end_condition", "both")
                    room.game_state.settings.boss_rush_duration = cfg.get("boss_rush_duration", 300)

                    cats = cfg.get("category_indices", [])
                    if cats:
                        room.game_state.playlist = cats
                        room.game_state.current_round_index = cats[0]
                        room.is_configured = True
                    else:
                        room.is_configured = False

                    room.sync_teams_to_game()
                    await broadcast_room(room, "CONFIG_UPDATED")

            elif action == "START_GAME":
                if player.is_host:
                    cfg = data.get("config", {})
                    match_mode = cfg.get("match_mode", room.game_state.settings.match_mode or "single")
                    room.game_state.settings.match_mode = match_mode
                    room.game_state.settings.boss_rush_duration = cfg.get("boss_rush_duration", room.game_state.settings.boss_rush_duration or 300)

                    if match_mode == "boss_rush":
                        room.game_state.settings.total_rounds = 1
                        room.game_state.settings.turn_timer = 0
                        room.game_state.settings.max_turns = 0
                    else:
                        room.game_state.settings.total_rounds = cfg.get("total_rounds", 1)
                        room.game_state.settings.turn_timer = cfg.get("turn_timer", 30)
                        room.game_state.settings.point_threshold = cfg.get("point_threshold", 500)
                        room.game_state.settings.max_turns = cfg.get("max_turns", 0)
                        room.game_state.settings.end_condition = cfg.get("end_condition", "both")

                    cats = cfg.get("category_indices", room.game_state.playlist if room.game_state.playlist else [0])
                    room.game_state.playlist = cats if cats else [0]
                    room.game_state.current_round_index = room.game_state.playlist[0]

                    room.sync_teams_to_game()
                    room.game_state.reset_match()
                    room.status = "PLAYING"
                    room.surrender_vote = None

                    # Reset consecutive misses
                    for p in room.players.values():
                        p.consecutive_incorrect = 0
                        p.eligible_for_surrender = False

                    if match_mode == "boss_rush":
                        room.start_boss_rush_timer()
                    else:
                        room.start_turn_timer()

                    await broadcast_room(room, "GAME_STARTED")

            elif action == "SUBMIT_GUESS":
                if room.status == "PLAYING":
                    is_boss_rush = room.game_state.settings.match_mode == "boss_rush"
                    active_pid = room.get_active_player_id()
                    if is_boss_rush or active_pid == player_id:
                        guess_text = data.get("guess", "")
                        result = process_online_guess(room, player, guess_text)
                        if room.status == "PLAYING" and not room.game_state.is_round_over and not is_boss_rush:
                            room.start_turn_timer()
                        elif room.game_state.is_round_over:
                            room.cancel_turn_timer()
                            room.cancel_boss_rush_timer()
                        await broadcast_room(room, "GUESS_RESULT", result)

            elif action == "BOSS_RUSH_EXPIRE":
                if room.status == "PLAYING" and room.game_state.settings.match_mode == "boss_rush":
                    room.cancel_boss_rush_timer()
                    room.game_state.end_game(winner="Co-op Squad")
                    await broadcast_room(room, "BOSS_RUSH_EXPIRED")

            elif action == "PASS_TURN":
                if room.status == "PLAYING":
                    active_pid = room.get_active_player_id()
                    if active_pid == player_id or player.is_host:
                        target_pid = active_pid or player_id
                        player_team_idx = room.player_order.index(target_pid) if target_pid in room.player_order else 0
                        if target_pid in room.players:
                            room.players[target_pid].consecutive_incorrect += 1
                            if room.players[target_pid].consecutive_incorrect >= 3:
                                room.players[target_pid].eligible_for_surrender = True
                        room.game_state.turns_taken[player_team_idx] += 1
                        room.game_state.advance_turn()
                        if not room.game_state.is_round_over and room.game_state.settings.match_mode != "boss_rush":
                            room.start_turn_timer()
                        else:
                            room.cancel_turn_timer()
                        await broadcast_room(room, "TURN_PASSED", {
                            "player_id": target_pid,
                            "name": room.players[target_pid].name if target_pid in room.players else player.name
                        })

            elif action == "VOTE_SURRENDER":
                if room.status == "PLAYING" and not room.game_state.is_round_over:
                    # 1. Initiate vote if none active (allowed from start of match for any active player)
                    if room.surrender_vote is None:
                        room.surrender_vote = {
                            "initiator_id": player_id,
                            "initiator_name": player.name,
                            "expires_at": time.time() + 60.0,
                            "votes": {player_id: True}
                        }
                        await broadcast_room(room, "SURRENDER_VOTE_STARTED", room.surrender_vote)
                        asyncio.create_task(expire_surrender_vote(room, room.surrender_vote["expires_at"]))
                    else:
                        # 2. Record vote choice
                        vote_choice = bool(data.get("vote", True))
                        room.surrender_vote["votes"][player_id] = vote_choice

                    # 3. Evaluate unanimous agreement across all active connected players
                    if room.surrender_vote is not None:
                        if time.time() > room.surrender_vote["expires_at"]:
                            room.surrender_vote = None
                            await broadcast_room(room, "SURRENDER_VOTE_EXPIRED")
                        else:
                            active_pids = [pid for pid in room.player_order if pid in room.players and room.players[pid].websocket]
                            all_voted_yes = len(active_pids) > 0 and all(room.surrender_vote["votes"].get(pid) is True for pid in active_pids)
                            any_voted_no = any(room.surrender_vote["votes"].get(pid) is False for pid in active_pids)

                            if all_voted_yes:
                                # Unanimous agreement reached
                                room.cancel_turn_timer()
                                room.cancel_boss_rush_timer()
                                room.surrender_vote = None
                                room.game_state.surrendered = True
                                is_boss_rush = (room.game_state.settings.match_mode == "boss_rush")
                                room.game_state.end_game(winner="Co-op Squad" if is_boss_rush else None)
                                await broadcast_room(room, "SURRENDER_PASSED")
                            elif any_voted_no:
                                # Any NO vote fails immediately
                                room.surrender_vote = None
                                await broadcast_room(room, "SURRENDER_VOTE_FAILED")
                            elif len(room.surrender_vote["votes"]) > 1 or len(active_pids) > 1:
                                await broadcast_room(room, "SURRENDER_VOTE_UPDATE", room.surrender_vote)

            elif action == "RETURN_TO_LOBBY":
                if player.is_host:
                    room.cancel_turn_timer()
                    room.cancel_boss_rush_timer()
                    room.status = "LOBBY"
                    room.surrender_vote = None
                    room.game_state.reset_match()
                    room.sync_teams_to_game()
                    await broadcast_room(room, "RETURNED_TO_LOBBY")

            elif action == "NEXT_ROUND":
                if player.is_host and room.status == "PLAYING":
                    room.game_state.current_match_round += 1
                    target_idx = room.game_state.current_match_round - 1
                    if target_idx < len(room.game_state.playlist):
                        room.game_state.current_round_index = room.game_state.playlist[target_idx]
                    elif room.game_state.rounds_data:
                        room.game_state.current_round_index = (room.game_state.current_round_index + 1) % len(room.game_state.rounds_data)
                    room.game_state.reset_round_state()
                    room.game_state.is_round_over = False
                    room.surrender_vote = None
                    for p in room.players.values():
                        p.consecutive_incorrect = 0
                        p.eligible_for_surrender = False
                    if room.game_state.settings.match_mode == "boss_rush":
                        room.start_boss_rush_timer()
                    elif not room.game_state.is_round_over:
                        room.start_turn_timer()
                    await broadcast_room(room, "NEXT_ROUND_STARTED")

            elif action == "PLAY_AGAIN":
                if player.is_host:
                    room.game_state.reset_match()
                    if room.game_state.rounds_data:
                        if len(room.game_state.playlist) <= 1:
                            new_cat = (room.game_state.current_round_index + 1) % len(room.game_state.rounds_data)
                            room.game_state.playlist = [new_cat]
                            room.game_state.current_round_index = new_cat
                        else:
                            room.game_state.current_round_index = room.game_state.playlist[0]
                    room.game_state.current_match_round = 1
                    room.game_state.is_match_over = False
                    room.game_state.is_round_over = False
                    room.surrender_vote = None
                    room.status = "PLAYING"
                    for p in room.players.values():
                        p.consecutive_incorrect = 0
                        p.eligible_for_surrender = False
                    if room.game_state.settings.match_mode == "boss_rush":
                        room.start_boss_rush_timer()
                    elif not room.game_state.is_round_over:
                        room.start_turn_timer()
                    await broadcast_room(room, "GAME_STARTED", extra={"reset_recent_guesses": True})

    except WebSocketDisconnect:
        player.websocket = None
        await broadcast_room(room, "PLAYER_DISCONNECTED", {"player_id": player_id, "name": player.name})
    except Exception as e:
        player.websocket = None
        print(f"WebSocket error for {player_id}: {e}")

# -------------------------------------------------------------
# Static Frontend Serving & Single-Port SPA Mount
# -------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(__file__), "top-100-ui", "dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    print("\n=======================================================")
    print("TOP 100 CYBER ARCADE SERVER STARTED!")
    print("Play locally: http://localhost:8000")
    print("=======================================================\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)