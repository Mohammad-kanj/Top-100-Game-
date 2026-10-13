from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from difflib import SequenceMatcher

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GameState:
    def __init__(self):
        self.teams = ["Team 1", "Team 2", "Team 3"]
        self.scores = [0, 0, 0]
        self.current_turn = 0
        self.current_round_index = 0
        self.revealed_indices = []
        self.revealed_by = {} # Tracks which team guessed which index
        self.rounds_data = []
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

game = GameState()

class TeamUpdate(BaseModel):
    teams: list[str]

class GuessInput(BaseModel):
    guess: str

@app.get("/game/state")
def get_game_state():
    current_round = game.rounds_data[game.current_round_index]
    return {
        "teams": game.teams,
        "scores": game.scores,
        "current_turn": game.current_turn,
        "current_round": game.current_round_index,
        "revealed_indices": game.revealed_indices,
        "revealed_by": game.revealed_by,
        "current_round_title": current_round.get("title", "UNKNOWN ROUND"),
        "current_round_answers": current_round.get("answers", [])
    }

@app.post("/game/teams")
def update_teams(data: TeamUpdate):
    game.teams = data.teams
    game.scores = [0] * len(game.teams)
    game.current_turn = min(game.current_turn, len(game.teams) - 1)
    if game.current_turn < 0:
        game.current_turn = 0
    return {"message": "Teams updated successfully"}

@app.post("/game/guess")
def submit_guess(data: GuessInput):
    guess = data.guess.lower().strip()
    if not guess:
        return {"status": "invalid"}

    current_round = game.rounds_data[game.current_round_index]
    answers = current_round.get("answers", [])

    best_match_index = -1
    highest_score = 0
    found_by_partial = False

    for i, name in enumerate(answers):
        if i in game.revealed_indices:
            continue

        name_lower = name.lower()
        fuzz_score = SequenceMatcher(None, guess, name_lower).ratio()
        
        name_parts = name_lower.split()
        is_partial = any(guess == part for part in name_parts)

        if is_partial and highest_score < 1.0:
            best_match_index = i
            found_by_partial = True
            highest_score = 1.0 
        elif fuzz_score > highest_score:
            highest_score = fuzz_score
            best_match_index = i

    if (highest_score >= 0.8 or found_by_partial) and best_match_index != -1:
        rank = best_match_index + 1
        name = answers[best_match_index]
        game.revealed_indices.append(best_match_index)
        
        # Record WHICH team guessed it (converting index to string for JSON keys)
        game.revealed_by[str(best_match_index)] = game.teams[game.current_turn]
        
        game.scores[game.current_turn] += rank
        game.current_turn = (game.current_turn + 1) % len(game.teams)
        
        return {"status": "correct", "index": best_match_index, "name": name}
    
    else:
        for i in game.revealed_indices:
            revealed_name = answers[i].lower()
            fuzz_score = SequenceMatcher(None, guess, revealed_name).ratio()
            revealed_parts = revealed_name.split()
            is_word_match = any(guess == part for part in revealed_parts)
            is_substring = len(guess) >= 4 and guess in revealed_name
            
            if fuzz_score >= 0.8 or is_word_match or is_substring:
                return {"status": "exists"}

        game.current_turn = (game.current_turn + 1) % len(game.teams)
        return {"status": "incorrect"}

@app.post("/game/next_round")
def next_round():
    if game.current_round_index < len(game.rounds_data) - 1:
        game.current_round_index += 1
        game.revealed_indices = []
        game.revealed_by = {}
    return {"message": "Advanced to next round"}

@app.post("/game/prev_round")
def prev_round():
    if game.current_round_index > 0:
        game.current_round_index -= 1
        game.revealed_indices = []
        game.revealed_by = {}
    return {"message": "Returned to previous round"}

@app.post("/game/give_up")
def give_up():
    current_round = game.rounds_data[game.current_round_index]
    answers = current_round.get("answers", [])
    for i in range(len(answers)):
        if i not in game.revealed_indices:
            game.revealed_indices.append(i)
            game.revealed_by[str(i)] = "REVEALED"
    return {"message": "All answers revealed"}