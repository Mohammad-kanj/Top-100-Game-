import asyncio
import json
import os
import sys
import threading
import time
import uuid
import requests
import websockets
import uvicorn

import main
from main import app, OnlineRoom, OnlinePlayer, process_online_guess

SERVER_PORT = 8199
BASE_HTTP = f"http://127.0.0.1:{SERVER_PORT}"
BASE_WS = f"ws://127.0.0.1:{SERVER_PORT}"

def start_test_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=SERVER_PORT, log_level="error")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    # Wait for server ready
    for _ in range(30):
        try:
            r = requests.get(f"{BASE_HTTP}/game/state", timeout=1)
            if r.status_code == 200:
                return server, thread
        except Exception:
            pass
        time.sleep(0.1)
    raise RuntimeError("Failed to start uvicorn test server")

def stop_test_server(server, thread):
    server.should_exit = True
    thread.join(timeout=3)

# ------------------------------------------------------------------------------
# Test 1: Unconfigured Lobby Initial State (R3)
# ------------------------------------------------------------------------------
def test_fresh_room_unconfigured_state():
    print("\n--- [TEST 1] Fresh Room Unconfigured State (R3) ---")
    resp = requests.post(f"{BASE_HTTP}/online/create_room", json={"host_name": "HostAlpha"})
    assert resp.status_code == 200, f"create_room failed: {resp.text}"
    data = resp.json()
    code = data["room_code"]
    host_id = data["player_id"]
    room_data = data["room"]

    # Assertions on HTTP response
    assert room_data["is_configured"] is False, "room.is_configured must be False initially"
    assert room_data["game_state"]["is_configured"] is False, "game_state.is_configured must be False initially"
    assert room_data["game_state"]["current_round"] == -1, f"current_round must be -1, got {room_data['game_state']['current_round']}"
    assert room_data["game_state"]["current_round_title"] == "NO DATA"
    assert room_data["game_state"]["current_round_answers"] == []
    assert room_data["status"] == "LOBBY"

    # Also check /online/room/{code} endpoint
    details = requests.get(f"{BASE_HTTP}/online/room/{code}").json()
    assert details["is_configured"] is False
    assert details["game_state"]["is_configured"] is False
    assert details["game_state"]["current_round"] == -1
    print("PASS: Fresh room initialized with is_configured=False, round=-1, and empty playlist")
    return code, host_id

# ------------------------------------------------------------------------------
# Async WebSocket Test Suite (R2 & R3)
# ------------------------------------------------------------------------------
async def run_websocket_stress_suite(room_code: str, host_id: str):
    print("\n--- [TEST 2-10] WebSocket Lifecycle & Concurrency Suite (R2 & R3) ---")

    # Add Player 2 and Player 3 via HTTP
    resp2 = requests.post(f"{BASE_HTTP}/online/join_room", json={"room_code": room_code, "player_name": "PlayerBeta"})
    assert resp2.status_code == 200, f"join_room failed: {resp2.text}"
    player2_id = resp2.json()["player_id"]

    resp3 = requests.post(f"{BASE_HTTP}/online/join_room", json={"room_code": room_code, "player_name": "PlayerGamma"})
    assert resp3.status_code == 200, f"join_room failed: {resp3.text}"
    player3_id = resp3.json()["player_id"]

    uri_host = f"{BASE_WS}/ws/{room_code}/{host_id}"
    uri_p2 = f"{BASE_WS}/ws/{room_code}/{player2_id}"
    uri_p3 = f"{BASE_WS}/ws/{room_code}/{player3_id}"

    async with websockets.connect(uri_host) as ws_host, \
               websockets.connect(uri_p2) as ws_p2, \
               websockets.connect(uri_p3) as ws_p3:

        # Drain initial join broadcasts
        async def drain(ws, count=1):
            msgs = []
            for _ in range(count):
                m = await asyncio.wait_for(ws.recv(), timeout=2.0)
                msgs.append(json.loads(m))
            return msgs

        # Wait for connections to stabilize
        await asyncio.sleep(0.2)

        # ----------------------------------------------------------------------
        # Sub-Test 2: Non-host UPDATE_CONFIG rejection
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 2] Non-host sending UPDATE_CONFIG should be ignored")
        await ws_p2.send(json.dumps({
            "action": "UPDATE_CONFIG",
            "config": {
                "match_mode": "boss_rush",
                "category_indices": [0],
                "boss_rush_duration": 600
            }
        }))
        await asyncio.sleep(0.3)
        # Verify room remains unconfigured
        details = requests.get(f"{BASE_HTTP}/online/room/{room_code}").json()
        assert details["is_configured"] is False, "Non-host should NOT be able to configure room!"
        print("PASS: Non-host UPDATE_CONFIG safely ignored")

        # ----------------------------------------------------------------------
        # Sub-Test 3: Host UPDATE_CONFIG success and broadcast
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 3] Host sending UPDATE_CONFIG broadcasts CONFIG_UPDATED")
        # Drain pending messages
        while True:
            try:
                await asyncio.wait_for(ws_host.recv(), timeout=0.1)
            except asyncio.TimeoutError:
                break
        while True:
            try:
                await asyncio.wait_for(ws_p2.recv(), timeout=0.1)
            except asyncio.TimeoutError:
                break
        while True:
            try:
                await asyncio.wait_for(ws_p3.recv(), timeout=0.1)
            except asyncio.TimeoutError:
                break

        await ws_host.send(json.dumps({
            "action": "UPDATE_CONFIG",
            "config": {
                "match_mode": "boss_rush",
                "category_indices": [0],
                "boss_rush_duration": 600
            }
        }))

        # Both host and guests must receive CONFIG_UPDATED
        msg_h = json.loads(await asyncio.wait_for(ws_host.recv(), timeout=3.0))
        msg_p2 = json.loads(await asyncio.wait_for(ws_p2.recv(), timeout=3.0))
        msg_p3 = json.loads(await asyncio.wait_for(ws_p3.recv(), timeout=3.0))

        assert msg_h["type"] == "CONFIG_UPDATED"
        assert msg_p2["type"] == "CONFIG_UPDATED"
        assert msg_p3["type"] == "CONFIG_UPDATED"

        room_state = msg_h["room"]
        assert room_state["is_configured"] is True
        assert room_state["game_state"]["teams"] == ["Co-op Squad"]
        assert room_state["game_state"]["scores"] == [0]
        assert room_state["game_state"]["settings"]["match_mode"] == "boss_rush"
        assert room_state["game_state"]["settings"]["boss_rush_duration"] == 600
        assert room_state["game_state"]["current_round"] == 0
        print("PASS: Host UPDATE_CONFIG set is_configured=True, teams=['Co-op Squad'], scores=[0], broadcasted to all")

        # ----------------------------------------------------------------------
        # Sub-Test 4: Empty category_indices de-configures room
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 4] UPDATE_CONFIG with empty category_indices reverts is_configured to False")
        await ws_host.send(json.dumps({
            "action": "UPDATE_CONFIG",
            "config": {
                "match_mode": "boss_rush",
                "category_indices": []
            }
        }))
        # All 3 sockets receive CONFIG_UPDATED for de-configuration
        msg_deconf = json.loads(await asyncio.wait_for(ws_host.recv(), timeout=3.0))
        await asyncio.wait_for(ws_p2.recv(), timeout=3.0)
        await asyncio.wait_for(ws_p3.recv(), timeout=3.0)
        assert msg_deconf["type"] == "CONFIG_UPDATED"
        assert msg_deconf["room"]["is_configured"] is False

        # Re-configure for the rest of tests
        await ws_host.send(json.dumps({
            "action": "UPDATE_CONFIG",
            "config": {
                "match_mode": "boss_rush",
                "category_indices": [0],
                "boss_rush_duration": 600
            }
        }))
        await asyncio.wait_for(ws_host.recv(), timeout=3.0)
        await asyncio.wait_for(ws_p2.recv(), timeout=3.0)
        await asyncio.wait_for(ws_p3.recv(), timeout=3.0)
        print("PASS: Empty categories reverts is_configured=False successfully")

        # ----------------------------------------------------------------------
        # Sub-Test 5: START_GAME in Boss Rush Mode
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 5] Host START_GAME in Boss Rush mode")
        await ws_host.send(json.dumps({
            "action": "START_GAME",
            "config": {
                "match_mode": "boss_rush",
                "category_indices": [0],
                "boss_rush_duration": 600
            }
        }))
        msg_start_h = json.loads(await asyncio.wait_for(ws_host.recv(), timeout=3.0))
        msg_start_p2 = json.loads(await asyncio.wait_for(ws_p2.recv(), timeout=3.0))
        msg_start_p3 = json.loads(await asyncio.wait_for(ws_p3.recv(), timeout=3.0))
        assert msg_start_h["type"] == "GAME_STARTED"
        assert msg_start_p2["type"] == "GAME_STARTED"
        assert msg_start_p3["type"] == "GAME_STARTED"

        room_playing = msg_start_h["room"]
        assert room_playing["status"] == "PLAYING"
        assert room_playing["game_state"]["teams"] == ["Co-op Squad"]
        assert room_playing["game_state"]["scores"] == [0]
        assert room_playing["game_state"]["settings"]["turn_timer"] == 0
        assert room_playing["game_state"]["settings"]["max_turns"] == 0
        print("PASS: Game started in Boss Rush mode, status=PLAYING, turn_timer=0, max_turns=0")

        # Retrieve valid answers from rounds_data for testing
        answers = room_playing["game_state"]["current_round_answers"]
        assert len(answers) >= 10, f"Need at least 10 answers in round 0, found {len(answers)}"
        ans0, ans1, ans2, ans3 = answers[0], answers[1], answers[2], answers[3]

        # ----------------------------------------------------------------------
        # Sub-Test 6: Concurrent Multi-Player Submissions (No turn restrictions)
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 6] Concurrent guess submissions from Host, Player2, and Player3")
        # In single/multi mode, Player2 and Player3 would be blocked if not active turn.
        # In Boss Rush, all 3 can submit simultaneously!
        async def submit_and_receive(ws, guess):
            await ws.send(json.dumps({"action": "SUBMIT_GUESS", "guess": guess}))

        # Send all 3 guesses concurrently
        await asyncio.gather(
            submit_and_receive(ws_host, ans0),
            submit_and_receive(ws_p2, ans1),
            submit_and_receive(ws_p3, ans2)
        )

        # Collect 3 GUESS_RESULT broadcasts on ws_host
        results_h = []
        for _ in range(3):
            msg = json.loads(await asyncio.wait_for(ws_host.recv(), timeout=3.0))
            if msg["type"] == "GUESS_RESULT":
                results_h.append(msg["extra"])

        # Also drain ws_p2 and ws_p3
        for _ in range(3):
            await asyncio.wait_for(ws_p2.recv(), timeout=3.0)
            await asyncio.wait_for(ws_p3.recv(), timeout=3.0)

        assert len(results_h) == 3, f"Expected 3 GUESS_RESULT events, got {len(results_h)}"
        for res in results_h:
            assert res["status"] == "correct", f"Expected correct status, got {res}"
            assert res["team"] == "Co-op Squad"
            assert res["player_name"] in ["HostAlpha", "PlayerBeta", "PlayerGamma"]

        # Check room state
        room_now = requests.get(f"{BASE_HTTP}/online/room/{room_code}").json()["game_state"]
        assert 0 in room_now["revealed_indices"]
        assert 1 in room_now["revealed_indices"]
        assert 2 in room_now["revealed_indices"]
        assert room_now["revealed_by"]["0"] == "HostAlpha"
        assert room_now["revealed_by"]["1"] == "PlayerBeta"
        assert room_now["revealed_by"]["2"] == "PlayerGamma"
        # Total score should equal points for 0 (1 pt) + 1 (2 pts) + 2 (3 pts) = 6 pts
        assert room_now["scores"] == [6]
        assert room_now["current_turn"] == 0, "Boss Rush must never advance current_turn"
        print(f"PASS: Simultaneous guesses processed without turn restrictions, score={room_now['scores'][0]}, cards revealed")

        # ----------------------------------------------------------------------
        # Sub-Test 7: Wrong guesses - Unlimited attempts & No strikes
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 7] Incorrect guesses: status='incorrect', no strikes, turn unchanged")
        for _ in range(5):
            await ws_p2.send(json.dumps({"action": "SUBMIT_GUESS", "guess": "DefinitelyWrongAnswerXYZ999"}))
            msg = json.loads(await asyncio.wait_for(ws_p2.recv(), timeout=3.0))
            # Drain host and p3
            await ws_host.recv()
            await ws_p3.recv()
            assert msg["type"] == "GUESS_RESULT"
            assert msg["extra"]["status"] == "incorrect"
            assert msg["extra"]["team"] == "Co-op Squad"
            assert msg["extra"]["player_name"] == "PlayerBeta"

        room_after_wrong = requests.get(f"{BASE_HTTP}/online/room/{room_code}").json()
        p2_state = next(p for p in room_after_wrong["players"] if p["player_id"] == player2_id)
        assert p2_state["consecutive_incorrect"] == 0, f"Boss rush must not accumulate consecutive misses, got {p2_state['consecutive_incorrect']}"
        assert p2_state["eligible_for_surrender"] is False
        assert room_after_wrong["game_state"]["current_turn"] == 0
        assert room_after_wrong["game_state"]["is_round_over"] is False
        print("PASS: 5 wrong guesses had zero strikes, consecutive misses remained 0, round did not end")

        # ----------------------------------------------------------------------
        # Sub-Test 8: Duplicate guess behavior
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 8] Duplicate guess: status='exists', no score change, no turn advance")
        await ws_p3.send(json.dumps({"action": "SUBMIT_GUESS", "guess": ans0}))
        msg_dup = json.loads(await asyncio.wait_for(ws_p3.recv(), timeout=3.0))
        await ws_host.recv()
        await ws_p2.recv()
        assert msg_dup["type"] == "GUESS_RESULT"
        assert msg_dup["extra"]["status"] == "exists"
        assert msg_dup["room"]["game_state"]["scores"] == [6], "Score must not increase on duplicate guess"
        assert msg_dup["room"]["game_state"]["current_turn"] == 0
        print("PASS: Duplicate guess correctly returned exists without score or turn changes")

        # ----------------------------------------------------------------------
        # Sub-Test 9: Race Condition: Concurrent Guesses on Same Card
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 9] Concurrently submitting the same unrevealed card (Race collision)")
        # ans3 is not yet revealed
        await asyncio.gather(
            ws_host.send(json.dumps({"action": "SUBMIT_GUESS", "guess": ans3})),
            ws_p2.send(json.dumps({"action": "SUBMIT_GUESS", "guess": ans3}))
        )
        msg_res1 = json.loads(await asyncio.wait_for(ws_host.recv(), timeout=3.0))
        msg_res2 = json.loads(await asyncio.wait_for(ws_host.recv(), timeout=3.0))
        await ws_p2.recv()
        await ws_p2.recv()
        await ws_p3.recv()
        await ws_p3.recv()

        statuses = [msg_res1["extra"]["status"], msg_res2["extra"]["status"]]
        assert "correct" in statuses, f"Expected one correct, got {statuses}"
        assert "exists" in statuses, f"Expected one exists, got {statuses}"
        # Points for rank 4 (index 3) = 4 pts. Previous score was 6 -> new score must be 10.
        final_score = msg_res2["room"]["game_state"]["scores"][0]
        assert final_score == 10, f"Expected final score 10, got {final_score}"
        print(f"PASS: Race condition resolved cleanly: 1 'correct' and 1 'exists', score exactly {final_score}")

        # ----------------------------------------------------------------------
        # Sub-Test 10: BOSS_RUSH_EXPIRE action and game termination
        # ----------------------------------------------------------------------
        print("\n[Sub-Test 10] BOSS_RUSH_EXPIRE ends match and reveals missed tiles")
        await ws_p3.send(json.dumps({"action": "BOSS_RUSH_EXPIRE"}))
        msg_exp_h = json.loads(await asyncio.wait_for(ws_host.recv(), timeout=3.0))
        msg_exp_p2 = json.loads(await asyncio.wait_for(ws_p2.recv(), timeout=3.0))
        msg_exp_p3 = json.loads(await asyncio.wait_for(ws_p3.recv(), timeout=3.0))

        assert msg_exp_h["type"] == "BOSS_RUSH_EXPIRED"
        assert msg_exp_p2["type"] == "BOSS_RUSH_EXPIRED"
        assert msg_exp_p3["type"] == "BOSS_RUSH_EXPIRED"

        final_state = msg_exp_h["room"]["game_state"]
        assert final_state["is_round_over"] is True
        assert final_state["is_match_over"] is True
        assert final_state["winner"] == "Co-op Squad"
        assert len(final_state["revealed_indices"]) == len(answers), "All 100 tiles must be revealed on match end"
        assert final_state["revealed_by"]["0"] == "HostAlpha"
        # Check unrevealed was marked MISSED
        assert final_state["revealed_by"]["99"] == "MISSED"

        # Subsequent guess after expiration must be invalid
        await ws_host.send(json.dumps({"action": "SUBMIT_GUESS", "guess": answers[4]}))
        msg_post = json.loads(await asyncio.wait_for(ws_host.recv(), timeout=3.0))
        assert msg_post["type"] == "GUESS_RESULT"
        assert msg_post["extra"]["status"] == "invalid"
        print("PASS: BOSS_RUSH_EXPIRE terminated match with winner 'Co-op Squad', all tiles uncovered, post-game guesses invalid")

# ------------------------------------------------------------------------------
# Test 11: Stress Harness (Rapid Concurrent Burst of 40 Guesses)
# ------------------------------------------------------------------------------
async def run_stress_burst_harness(room_code: str, host_id: str):
    print("\n--- [TEST 11] High-Concurrency Stress Harness (40 simultaneous requests) ---")
    # Create fresh room for stress test
    resp = requests.post(f"{BASE_HTTP}/online/create_room", json={"host_name": "StressHost"})
    code = resp.json()["room_code"]
    hid = resp.json()["player_id"]

    r_p2 = requests.post(f"{BASE_HTTP}/online/join_room", json={"room_code": code, "player_name": "StressP2"})
    p2_id = r_p2.json()["player_id"]

    async with websockets.connect(f"{BASE_WS}/ws/{code}/{hid}") as ws_h, \
               websockets.connect(f"{BASE_WS}/ws/{code}/{p2_id}") as ws_p2:

        # Drain join broadcasts
        await asyncio.sleep(0.1)
        while True:
            try:
                await asyncio.wait_for(ws_h.recv(), timeout=0.1)
            except asyncio.TimeoutError:
                break
        while True:
            try:
                await asyncio.wait_for(ws_p2.recv(), timeout=0.1)
            except asyncio.TimeoutError:
                break

        # Configure room
        await ws_h.send(json.dumps({
            "action": "UPDATE_CONFIG",
            "config": {"match_mode": "boss_rush", "category_indices": [0], "boss_rush_duration": 300}
        }))
        cfg_h = json.loads(await asyncio.wait_for(ws_h.recv(), timeout=3.0))
        assert cfg_h["type"] == "CONFIG_UPDATED"
        await asyncio.wait_for(ws_p2.recv(), timeout=3.0)

        # Start game
        await ws_h.send(json.dumps({
            "action": "START_GAME",
            "config": {"match_mode": "boss_rush", "category_indices": [0]}
        }))
        start_msg = json.loads(await asyncio.wait_for(ws_h.recv(), timeout=3.0))
        assert start_msg["type"] == "GAME_STARTED"
        await asyncio.wait_for(ws_p2.recv(), timeout=3.0)
        answers = start_msg["room"]["game_state"]["current_round_answers"]

        # Mix of 20 correct distinct answers, 10 wrong answers, and 10 duplicates
        guesses_h = [answers[i] for i in range(10, 20)] + [f"WrongGuess_H_{i}" for i in range(5)] + [answers[10] for _ in range(5)]
        guesses_p2 = [answers[i] for i in range(20, 30)] + [f"WrongGuess_P2_{i}" for i in range(5)] + [answers[20] for _ in range(5)]

        tasks = []
        for g in guesses_h:
            tasks.append(ws_h.send(json.dumps({"action": "SUBMIT_GUESS", "guess": g})))
        for g in guesses_p2:
            tasks.append(ws_p2.send(json.dumps({"action": "SUBMIT_GUESS", "guess": g})))

        t0 = time.time()
        await asyncio.gather(*tasks)

        # Drain 40 messages on both sockets
        recv_h = []
        for _ in range(40):
            m = await asyncio.wait_for(ws_h.recv(), timeout=5.0)
            recv_h.append(json.loads(m))
        for _ in range(40):
            await asyncio.wait_for(ws_p2.recv(), timeout=5.0)
        elapsed = time.time() - t0

        # Assert no exceptions, state consistent
        room_final = requests.get(f"{BASE_HTTP}/online/room/{code}").json()["game_state"]
        # Exactly 20 distinct cards should have been revealed (indices 10 to 29)
        revealed = set(room_final["revealed_indices"])
        for idx in range(10, 30):
            assert idx in revealed, f"Index {idx} should have been revealed in stress test"

        # Check total points: sum of (idx + 1) for idx in 10..29
        expected_points = sum(idx + 1 for idx in range(10, 30))
        assert room_final["scores"][0] == expected_points, f"Expected points {expected_points}, got {room_final['scores'][0]}"
        print(f"PASS: 40 concurrent messages processed in {elapsed:.3f}s with 0 errors. Total score={expected_points}")

# ------------------------------------------------------------------------------
# Test 12-16: Adversarial Deep-Dive Suite
# ------------------------------------------------------------------------------
async def run_adversarial_deep_dive_suite():
    print("\n--- [TEST 12-16] Adversarial Edge Cases & Resilience Suite ---")
    
    # 1. Malformed & Injection Payloads
    print("[Sub-Test 12] Adversarial & Injection Payloads")
    resp = requests.post(f"{BASE_HTTP}/online/create_room", json={"host_name": "AdvHost"})
    code = resp.json()["room_code"]
    hid = resp.json()["player_id"]
    
    async with websockets.connect(f"{BASE_WS}/ws/{code}/{hid}") as ws:
        # Drain initial join
        await ws.recv()
        
        # Configure and start
        await ws.send(json.dumps({
            "action": "UPDATE_CONFIG",
            "config": {"match_mode": "boss_rush", "category_indices": [0], "boss_rush_duration": 300}
        }))
        await ws.recv()
        await ws.send(json.dumps({"action": "START_GAME"}))
        st = json.loads(await ws.recv())
        answers = st["room"]["game_state"]["current_round_answers"]
        
        # Test empty string & whitespace
        for bad in ["", "   ", "\t\n"]:
            await ws.send(json.dumps({"action": "SUBMIT_GUESS", "guess": bad}))
            msg = json.loads(await ws.recv())
            assert msg["extra"]["status"] == "invalid", f"Expected invalid for '{bad}', got {msg['extra']}"
            
        # Test SQL Injection, XSS, Overflow, and Emojis
        attacks = [
            "'; DROP TABLE users; --",
            "<script>alert('xss')</script>",
            "A" * 5000,
            "🔥🔥🔥🎮🏆🚀",
            "\x00\x01\x02\x03"
        ]
        for atk in attacks:
            await ws.send(json.dumps({"action": "SUBMIT_GUESS", "guess": atk}))
            msg = json.loads(await ws.recv())
            assert msg["extra"]["status"] == "incorrect", f"Attack payload should return incorrect, got {msg['extra']}"
            assert msg["room"]["game_state"]["current_turn"] == 0
            assert msg["room"]["game_state"]["scores"] == [0]
            assert msg["room"]["game_state"]["is_round_over"] is False
        print("PASS: Empty, SQLi, XSS, 5k buffer overflow, and emojis handled safely without error")
        
        # 2. Text Normalization: Leading articles & Accents
        print("\n[Sub-Test 13] Text Normalization & Accent Resilience")
        first_ans = answers[0]
        # Test with 'The ' prepended, uppercase, extra spaces
        test_guess = f"  ThE  {first_ans.upper()}   "
        await ws.send(json.dumps({"action": "SUBMIT_GUESS", "guess": test_guess}))
        msg_norm = json.loads(await ws.recv())
        assert msg_norm["extra"]["status"] == "correct", f"Expected normalized match, got {msg_norm['extra']}"
        assert msg_norm["extra"]["index"] == 0
        print("PASS: Case, whitespace, and article normalization functions seamlessly in Boss Rush")

    # 3. Mid-Game Disconnect Resilience
    print("\n[Sub-Test 14] Mid-game Player Disconnect Resilience")
    resp_dc = requests.post(f"{BASE_HTTP}/online/create_room", json={"host_name": "DCHost"})
    c_dc = resp_dc.json()["room_code"]
    h_dc = resp_dc.json()["player_id"]
    r_p2 = requests.post(f"{BASE_HTTP}/online/join_room", json={"room_code": c_dc, "player_name": "DCP2"})
    p2_dc = r_p2.json()["player_id"]

    ws_h_dc = await websockets.connect(f"{BASE_WS}/ws/{c_dc}/{h_dc}")
    ws_p2_dc = await websockets.connect(f"{BASE_WS}/ws/{c_dc}/{p2_dc}")
    # Drain join messages
    await asyncio.sleep(0.1)
    while True:
        try:
            await asyncio.wait_for(ws_h_dc.recv(), timeout=0.1)
        except asyncio.TimeoutError:
            break
    while True:
        try:
            await asyncio.wait_for(ws_p2_dc.recv(), timeout=0.1)
        except asyncio.TimeoutError:
            break

    # Start Boss Rush
    await ws_h_dc.send(json.dumps({
        "action": "UPDATE_CONFIG",
        "config": {"match_mode": "boss_rush", "category_indices": [0]}
    }))
    await ws_h_dc.recv()
    await ws_p2_dc.recv()
    await ws_h_dc.send(json.dumps({"action": "START_GAME"}))
    await ws_h_dc.recv()
    await ws_p2_dc.recv()

    # Player 2 abruptly disconnects
    await ws_p2_dc.close()
    await asyncio.sleep(0.2)

    # Host should receive PLAYER_DISCONNECTED broadcast
    msg_dc = json.loads(await asyncio.wait_for(ws_h_dc.recv(), timeout=3.0))
    assert msg_dc["type"] == "PLAYER_DISCONNECTED"
    assert msg_dc["extra"]["player_id"] == p2_dc

    # Host continues playing uninterrupted
    await ws_h_dc.send(json.dumps({"action": "SUBMIT_GUESS", "guess": answers[1]}))
    msg_after_dc = json.loads(await asyncio.wait_for(ws_h_dc.recv(), timeout=3.0))
    assert msg_after_dc["type"] == "GUESS_RESULT"
    assert msg_after_dc["extra"]["status"] == "correct"
    assert msg_after_dc["room"]["status"] == "PLAYING"
    await ws_h_dc.close()
    print("PASS: Abrupt player disconnect does not interrupt or crash active Boss Rush session")

    # 4. Complete Board Reveal (All 100 Cards Uncovered)
    print("\n[Sub-Test 15] 100% Board Reveal triggers Victory for Co-op Squad")
    test_room = OnlineRoom("FULL", "host_full", "FullHost")
    test_room.game_state.settings.match_mode = "boss_rush"
    test_room.game_state.playlist = [0]
    test_room.game_state.current_round_index = 0
    test_room.is_configured = True
    test_room.sync_teams_to_game()
    test_room.status = "PLAYING"
    
    rnd_answers = test_room.game_state.rounds_data[0]["answers"]
    player_full = test_room.players["host_full"]
    # Pre-reveal 99 tiles
    test_room.game_state.revealed_indices = list(range(99))
    for i in range(99):
        test_room.game_state.revealed_by[str(i)] = "FullHost"
    test_room.game_state.scores[0] = sum(i + 1 for i in range(99))

    # Submit final 100th card
    res_last = process_online_guess(test_room, player_full, rnd_answers[99])
    assert res_last["status"] == "correct"
    assert len(test_room.game_state.revealed_indices) == 100
    assert test_room.game_state.is_round_over is True
    assert test_room.game_state.is_match_over is True
    assert test_room.game_state.winner == "Co-op Squad"
    print(f"PASS: 100th card uncovered -> is_round_over=True, winner='Co-op Squad', final score={test_room.game_state.scores[0]}")

    # 5. Direct START_GAME on Unconfigured Room Fallback
    print("\n[Sub-Test 16] Fallback handling if START_GAME sent on unconfigured room")
    r_unconf = requests.post(f"{BASE_HTTP}/online/create_room", json={"host_name": "UnconfHost"}).json()
    c_u = r_unconf["room_code"]
    p_u = r_unconf["player_id"]
    async with websockets.connect(f"{BASE_WS}/ws/{c_u}/{p_u}") as ws_u:
        await ws_u.recv() # drain join
        # Directly send START_GAME without UPDATE_CONFIG
        await ws_u.send(json.dumps({"action": "START_GAME"}))
        msg_u = json.loads(await ws_u.recv())
        assert msg_u["type"] == "GAME_STARTED"
        assert msg_u["room"]["status"] == "PLAYING"
        assert msg_u["room"]["game_state"]["current_round"] == 0
    print("PASS: START_GAME without prior configuration safely defaults to category [0]")

def main_test_runner():
    server, thread = start_test_server()
    try:
        room_code, host_id = test_fresh_room_unconfigured_state()
        asyncio.run(run_websocket_stress_suite(room_code, host_id))
        asyncio.run(run_stress_burst_harness(room_code, host_id))
        asyncio.run(run_adversarial_deep_dive_suite())
        print("\n=======================================================")
        print("ALL EMPIRICAL R2 & R3 CHALLENGER TESTS PASSED (16/16)")
        print("=======================================================\n")
    finally:
        stop_test_server(server, thread)

if __name__ == "__main__":
    main_test_runner()
