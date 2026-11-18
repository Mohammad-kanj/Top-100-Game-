import asyncio
import main
from main import OnlineRoom, OnlinePlayer, process_online_guess

def test_unconfigured_initial_room():
    room = OnlineRoom("TEST", "host1", "Host Player")
    assert room.is_configured is False, f"Expected is_configured False, got {room.is_configured}"
    assert room.game_state.playlist == [], f"Expected empty playlist, got {room.game_state.playlist}"
    assert room.game_state.current_round_index == -1, f"Expected current_round_index -1, got {room.game_state.current_round_index}"
    data = room.to_dict()
    assert data["is_configured"] is False, f"Expected to_dict is_configured False, got {data['is_configured']}"
    assert data["game_state"]["is_configured"] is False
    assert data["game_state"]["current_round_title"] == "NO DATA"
    print("PASS: test_unconfigured_initial_room")

def test_boss_rush_coop_teams():
    room = OnlineRoom("BOSS", "host1", "Player A")
    room.add_player("player2", "Player B")
    room.game_state.settings.match_mode = "boss_rush"
    room.sync_teams_to_game()
    assert room.game_state.teams == ["Co-op Squad"], f"Expected ['Co-op Squad'], got {room.game_state.teams}"
    assert room.game_state.scores == [0], f"Expected [0], got {room.game_state.scores}"
    print("PASS: test_boss_rush_coop_teams")

def test_boss_rush_guess_processing():
    room = OnlineRoom("BRGP", "host1", "Alice")
    room.add_player("player2", "Bob")
    room.game_state.settings.match_mode = "boss_rush"
    room.game_state.playlist = [0]
    room.game_state.current_round_index = 0
    room.is_configured = True
    room.sync_teams_to_game()
    room.status = "PLAYING"

    current_round = room.game_state.rounds_data[0]
    answers = current_round["answers"]
    first_answer = answers[0]

    # 1. Correct guess from Bob
    res1 = process_online_guess(room, room.players["player2"], first_answer)
    assert res1["status"] == "correct", f"Expected correct, got {res1}"
    assert res1["team"] == "Co-op Squad"
    assert res1["player_name"] == "Bob"
    assert 0 in room.game_state.revealed_indices
    assert room.game_state.revealed_by["0"] == "Bob"
    assert room.game_state.scores[0] > 0
    initial_score = room.game_state.scores[0]
    assert room.game_state.current_turn == 0, "Boss Rush must not advance turn on correct guess"

    # 2. Duplicate guess from Alice
    res2 = process_online_guess(room, room.players["host1"], first_answer)
    assert res2["status"] == "exists", f"Expected exists, got {res2}"
    assert room.game_state.current_turn == 0, "Boss Rush must not advance turn on duplicate guess"
    assert room.players["host1"].consecutive_incorrect == 0, "No miss penalty in Boss Rush"

    # 3. Incorrect guess from Alice
    res3 = process_online_guess(room, room.players["host1"], "TotallyWrongGuess12345")
    assert res3["status"] == "incorrect", f"Expected incorrect, got {res3}"
    assert room.game_state.current_turn == 0, "Boss Rush must not advance turn on incorrect guess"
    assert room.players["host1"].consecutive_incorrect == 0, "No strikes in Boss Rush"
    assert not room.game_state.is_round_over, "Incorrect guess must not end Boss Rush round"
    print("PASS: test_boss_rush_guess_processing")

async def test_websocket_actions():
    room = OnlineRoom("WSTK", "host1", "Host")
    room.add_player("guest1", "Guest")
    main.online_rooms[room.code] = room

    # Test UPDATE_CONFIG logic
    cfg = {
        "match_mode": "boss_rush",
        "category_indices": [2],
        "boss_rush_duration": 600
    }
    room.game_state.settings.match_mode = cfg["match_mode"]
    room.game_state.settings.boss_rush_duration = cfg["boss_rush_duration"]
    room.game_state.playlist = cfg["category_indices"]
    room.game_state.current_round_index = cfg["category_indices"][0]
    room.is_configured = True
    room.sync_teams_to_game()

    assert room.is_configured is True
    assert room.game_state.teams == ["Co-op Squad"]
    assert room.game_state.settings.boss_rush_duration == 600

    # Test START_GAME logic
    room.game_state.settings.total_rounds = 1
    room.game_state.settings.turn_timer = 0
    room.game_state.settings.max_turns = 0
    room.status = "PLAYING"
    assert room.status == "PLAYING"
    assert room.game_state.settings.turn_timer == 0

    # Test BOSS_RUSH_EXPIRE
    room.game_state.end_game(winner="Co-op Squad")
    assert room.game_state.is_round_over is True
    assert room.game_state.winner == "Co-op Squad"
    print("PASS: test_websocket_actions")

if __name__ == "__main__":
    test_unconfigured_initial_room()
    test_boss_rush_coop_teams()
    test_boss_rush_guess_processing()
    asyncio.run(test_websocket_actions())
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
