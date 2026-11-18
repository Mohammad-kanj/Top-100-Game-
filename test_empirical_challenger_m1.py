"""
EMPIRICAL CHALLENGER TEST SUITE (Milestone M1)
Author: Challenger 1 (teamwork_challenger)
Purpose: Adversarial empirical verification of R1-R6 across backend and frontend contracts.
"""

import sys
import os
import re
import json
from typing import List, Dict, Any

# Ensure target project root is on sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from main import OnlineRoom, OnlinePlayer, GameState, GameSettings

def test_r5_online_room_serialization_unconfigured():
    """Verify R5: Unconfigured room serialization guarantees empty lists and no crashes."""
    room = OnlineRoom("TEST01", "host_123", "Host User")
    data = room.to_dict()
    
    assert data["is_configured"] is False, "Expected is_configured=False"
    assert data["category_indices"] == [], f"Expected empty category_indices, got {data['category_indices']}"
    assert data["selected_categories"] == [], f"Expected empty selected_categories, got {data['selected_categories']}"
    assert data["game_state"]["is_configured"] is False
    assert data["game_state"]["category_indices"] == []
    assert data["game_state"]["selected_categories"] == []
    print("PASS: test_r5_online_room_serialization_unconfigured")

def test_r5_online_room_serialization_single_round():
    """Verify R5: Single round configuration serializes single category index and exact category title."""
    room = OnlineRoom("TEST02", "host_123", "Host User")
    cat_idx = 2
    expected_title = room.game_state.rounds_data[cat_idx]["title"]
    
    room.is_configured = True
    room.game_state.playlist = [cat_idx]
    room.game_state.current_round_index = cat_idx
    room.game_state.settings.match_mode = "single"
    room.game_state.settings.total_rounds = 1
    
    data = room.to_dict()
    assert data["is_configured"] is True
    assert data["category_indices"] == [cat_idx]
    assert data["selected_categories"] == [expected_title]
    assert data["game_state"]["category_indices"] == [cat_idx]
    assert data["game_state"]["selected_categories"] == [expected_title]
    assert data["game_state"]["current_round_title"] == expected_title
    print(f"PASS: test_r5_online_room_serialization_single_round (Title: '{expected_title}')")

def test_r5_online_room_serialization_multi_round():
    """Verify R5: Multi-round tournament serializes ordered list of category indices and titles."""
    room = OnlineRoom("TEST03", "host_123", "Host User")
    indices = [0, 4, 1]
    expected_titles = [room.game_state.rounds_data[i]["title"] for i in indices]
    
    room.is_configured = True
    room.game_state.playlist = indices
    room.game_state.current_round_index = indices[0]
    room.game_state.settings.match_mode = "multi"
    room.game_state.settings.total_rounds = len(indices)
    
    data = room.to_dict()
    assert data["is_configured"] is True
    assert data["category_indices"] == indices
    assert data["selected_categories"] == expected_titles
    assert data["game_state"]["category_indices"] == indices
    assert data["game_state"]["selected_categories"] == expected_titles
    print(f"PASS: test_r5_online_room_serialization_multi_round ({len(indices)} rounds: {expected_titles})")

def test_r5_online_room_serialization_boss_rush():
    """Verify R5: Boss Rush mode serializes single round category and titles."""
    room = OnlineRoom("TEST04", "host_123", "Host User")
    cat_idx = 3
    expected_title = room.game_state.rounds_data[cat_idx]["title"]
    
    room.is_configured = True
    room.game_state.playlist = [cat_idx]
    room.game_state.current_round_index = cat_idx
    room.game_state.settings.match_mode = "boss_rush"
    room.game_state.settings.boss_rush_duration = 300
    
    data = room.to_dict()
    assert data["is_configured"] is True
    assert data["category_indices"] == [cat_idx]
    assert data["selected_categories"] == [expected_title]
    assert data["game_state"]["match_mode"] == "boss_rush"
    print(f"PASS: test_r5_online_room_serialization_boss_rush (Title: '{expected_title}')")

def test_r5_online_room_serialization_out_of_bounds_resilience():
    """Adversarial stress: invalid / out of bounds category index in playlist."""
    room = OnlineRoom("TEST05", "host_123", "Host User")
    room.is_configured = True
    room.game_state.playlist = [99999, -5, 0]
    
    # Must not raise IndexError
    data = room.to_dict()
    assert data["is_configured"] is True
    assert data["category_indices"] == [99999, -5, 0]
    # Out of bounds indices are filtered safely by `0 <= idx < len(rounds_data)`
    assert data["selected_categories"] == [room.game_state.rounds_data[0]["title"]]
    print("PASS: test_r5_online_room_serialization_out_of_bounds_resilience")

def test_r3_no_bgm_code_in_codebase():
    """Verify R3: No BGM occurrences in frontend or backend."""
    target_files = [
        os.path.join(PROJECT_ROOT, "main.py"),
        os.path.join(PROJECT_ROOT, "top-100-ui", "src", "soundFx.ts"),
        os.path.join(PROJECT_ROOT, "top-100-ui", "src", "types.ts"),
        os.path.join(PROJECT_ROOT, "top-100-ui", "src", "App.tsx"),
        os.path.join(PROJECT_ROOT, "top-100-ui", "src", "components", "SettingsModal.tsx"),
        os.path.join(PROJECT_ROOT, "top-100-ui", "src", "components", "PostGameCelebrationModal.tsx"),
        os.path.join(PROJECT_ROOT, "top-100-ui", "src", "components", "MatchSetup.tsx"),
        os.path.join(PROJECT_ROOT, "top-100-ui", "src", "components", "OnlineLobbyModal.tsx"),
    ]
    
    for fpath in target_files:
        assert os.path.exists(fpath), f"File missing: {fpath}"
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        matches = re.findall(r"\bbgm\b|bgm_volume|bgmVolume|startBgm|stopBgm|isBgmPlaying", content, re.IGNORECASE)
        assert len(matches) == 0, f"Found BGM remnants in {fpath}: {matches}"
    
    print("PASS: test_r3_no_bgm_code_in_codebase (0 BGM occurrences in all 8 core files)")

def test_r1_post_game_arrows_hitbox_and_svg():
    """Verify R1: Arrow buttons have valid Tailwind dimensions, SVG chevrons, pointer-events, select-none, and no unicode dead spots."""
    modal_file = os.path.join(PROJECT_ROOT, "top-100-ui", "src", "components", "PostGameCelebrationModal.tsx")
    with open(modal_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check button sizing
    assert "w-12 h-12 md:w-14 md:h-14" in content, "Missing valid standard Tailwind arrow dimensions (w-12 h-12 md:w-14 md:h-14)"
    assert "w-13" not in content and "h-13" not in content, "Invalid non-standard Tailwind class w-13/h-13 found"
    
    # Check hit-testing & clickability classes
    assert "select-none touch-manipulation pointer-events-auto" in content, "Arrow buttons missing select-none, touch-manipulation, or pointer-events-auto"
    
    # Check SVG chevrons with pointer-events-none
    assert "<svg" in content, "Missing SVG chevrons in PostGameCelebrationModal"
    assert "pointer-events-none" in content, "SVG child must have pointer-events-none to prevent dead spots"
    assert "M15 19l-7-7 7-7" in content, "Missing left chevron SVG path"
    assert "M9 5l7 7-7 7" in content, "Missing right chevron SVG path"
    
    # Check absence of raw unicode arrows within navigation buttons
    # Specifically ensure no ◀ or ▶ or &larr; etc. inside button elements
    arrow_button_block = content[content.find("totalTeams > 1 &&"):content.find("currentStanding.rank === 1")]
    assert "◀" not in arrow_button_block, "Raw unicode ◀ found in arrow buttons"
    assert "▶" not in arrow_button_block, "Raw unicode ▶ found in arrow buttons"
    
    print("PASS: test_r1_post_game_arrows_hitbox_and_svg")

def test_r2_play_again_sound_effect():
    """Verify R2: Play Again does not invoke playVictorySound()."""
    modal_file = os.path.join(PROJECT_ROOT, "top-100-ui", "src", "components", "PostGameCelebrationModal.tsx")
    with open(modal_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Find the Play Again button block
    play_again_idx = content.find("Play Again")
    assert play_again_idx != -1, "Play Again button not found in PostGameCelebrationModal"
    
    # Slice 400 characters preceding/containing Play Again
    surrounding = content[play_again_idx - 400:play_again_idx + 100]
    assert "playVictorySound" not in surrounding, f"Play Again button must not call playVictorySound. Found in: {surrounding}"
    assert "playClick" in surrounding, f"Play Again button expected to call playClick. Surrounding: {surrounding}"
    
    print("PASS: test_r2_play_again_sound_effect")

def test_r4_quit_game_in_game_only():
    """Verify R4: SettingsModal conditionally renders Quit Game only when onQuitGame is provided, and App.tsx only passes onQuitGame in ARENA screen."""
    settings_file = os.path.join(PROJECT_ROOT, "top-100-ui", "src", "components", "SettingsModal.tsx")
    app_file = os.path.join(PROJECT_ROOT, "top-100-ui", "src", "App.tsx")
    
    with open(settings_file, "r", encoding="utf-8") as f:
        settings_content = f.read()
    with open(app_file, "r", encoding="utf-8") as f:
        app_content = f.read()
        
    # Check SettingsModal contract
    assert "onQuitGame?: () => void;" in settings_content, "SettingsModalProps must define onQuitGame?: () => void;"
    assert "{onQuitGame && (" in settings_content, "Quit Game button must be guarded by {onQuitGame && ...}"
    assert "showQuitConfirm" in settings_content, "Quit Game must have confirmation dialog"
    
    # Check App.tsx contract
    assert "onQuitGame={screen === 'ARENA' ? handleQuitGame : undefined}" in app_content, "App.tsx must pass onQuitGame only when screen === 'ARENA'"
    assert "handleQuitGame" in app_content, "App.tsx must define handleQuitGame"
    
    print("PASS: test_r4_quit_game_in_game_only")

def test_r6_match_setup_category_layout():
    """Verify R6: MatchSetup has no line-clamp-2, no ellipsis truncation, absolute badge, reserved pr-7, and min-h-[110px]."""
    setup_file = os.path.join(PROJECT_ROOT, "top-100-ui", "src", "components", "MatchSetup.tsx")
    with open(setup_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "line-clamp-2" not in content, "line-clamp-2 must not be present in MatchSetup"
    assert "line-clamp" not in content, "line-clamp must not be present in MatchSetup"
    assert "truncate" not in content[content.find("cat.title") - 100:content.find("cat.title") + 100], "cat.title must not have truncate class"
    
    # Check absolute badge positioning
    assert "absolute top-3 right-3" in content, "Badge must be absolute top-3 right-3"
    assert "pointer-events-none" in content[content.find("absolute top-3 right-3") - 50:content.find("absolute top-3 right-3") + 250], "Badge must have pointer-events-none"
    
    # Check title container reserved padding
    title_idx = content.find("{cat.title}")
    assert title_idx != -1, "Could not find {cat.title} in MatchSetup.tsx"
    title_surrounding = content[title_idx - 250:title_idx]
    assert "pr-7" in title_surrounding, f"Title container must have reserved pr-7. Found: {title_surrounding}"
    assert "break-words" in title_surrounding, f"Title must have break-words. Found: {title_surrounding}"
    assert "min-h-[124px]" in content or "min-h-[110px]" in content, "Category card must have min-h-[124px] for geometry stability and ample clearance"
    
    print("PASS: test_r6_match_setup_category_layout")

if __name__ == "__main__":
    print("=======================================================")
    print("STARTING EMPIRICAL CHALLENGER TEST SUITE (M1)")
    print("=======================================================")
    test_r5_online_room_serialization_unconfigured()
    test_r5_online_room_serialization_single_round()
    test_r5_online_room_serialization_multi_round()
    test_r5_online_room_serialization_boss_rush()
    test_r5_online_room_serialization_out_of_bounds_resilience()
    test_r3_no_bgm_code_in_codebase()
    test_r1_post_game_arrows_hitbox_and_svg()
    test_r2_play_again_sound_effect()
    test_r4_quit_game_in_game_only()
    test_r6_match_setup_category_layout()
    print("=======================================================")
    print("ALL EMPIRICAL CHALLENGER PYTHON TESTS PASSED (10/10)")
    print("=======================================================")
