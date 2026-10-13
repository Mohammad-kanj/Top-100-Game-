import sys
import os
import json
from difflib import SequenceMatcher
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QGridLayout, 
                             QPushButton, QVBoxLayout, QHBoxLayout, QLabel, 
                             QScrollArea, QLineEdit, QMessageBox, QDialog, QFormLayout)
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QFont

class TeamSettingsDialog(QDialog):
    """Popup Dialog to add, remove, and change team names."""
    def __init__(self, teams, scores, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Edit Teams")
        self.setFixedSize(450, 400)
        self.setStyleSheet("background-color: #001224; color: white; font-size: 16px;")
        
        # Keep track of internal state
        self.teams = list(teams)
        self.scores = list(scores)
        
        self.layout = QVBoxLayout(self)
        
        # Scroll area for when there are many teams
        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)
        self.scroll.setStyleSheet("border: none;")
        self.scroll_content = QWidget()
        self.list_layout = QVBoxLayout(self.scroll_content)
        self.list_layout.setAlignment(Qt.AlignTop)
        self.scroll.setWidget(self.scroll_content)
        self.layout.addWidget(self.scroll)
        
        self.inputs = []
        
        # Control Buttons
        self.controls_layout = QHBoxLayout()
        self.add_btn = QPushButton("+ Add Team")
        self.add_btn.setStyleSheet("""
            QPushButton { background-color: #0074D9; color: white; font-weight: bold; padding: 10px; border-radius: 5px; }
            QPushButton:hover { background-color: #005aab; }
        """)
        self.add_btn.clicked.connect(self.add_team)
        self.controls_layout.addWidget(self.add_btn)
        
        self.save_btn = QPushButton("Save Changes")
        self.save_btn.setStyleSheet("""
            QPushButton { background-color: #2ECC40; color: white; font-weight: bold; padding: 10px; border-radius: 5px; }
            QPushButton:hover { background-color: #28B438; }
        """)
        self.save_btn.clicked.connect(self.accept)
        self.controls_layout.addWidget(self.save_btn)
        
        self.layout.addLayout(self.controls_layout)
        
        self.refresh_list()

    def refresh_list(self):
        # Clear existing layout widgets
        while self.list_layout.count():
            item = self.list_layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()
                
        self.inputs.clear()
        
        for i in range(len(self.teams)):
            row_widget = QWidget()
            row_layout = QHBoxLayout(row_widget)
            row_layout.setContentsMargins(0, 5, 0, 5)
            
            label = QLabel(f"Team {i+1}:")
            label.setFixedWidth(70)
            row_layout.addWidget(label)
            
            line_edit = QLineEdit(self.teams[i])
            line_edit.setStyleSheet("background: white; color: black; padding: 5px; border-radius: 5px;")
            self.inputs.append(line_edit)
            row_layout.addWidget(line_edit)
            
            del_btn = QPushButton("❌")
            del_btn.setFixedSize(35, 35)
            del_btn.setStyleSheet("""
                QPushButton { background-color: #FF4136; border-radius: 5px; }
                QPushButton:hover { background-color: #c9302c; }
            """)
            # Capture the current index using default arg in lambda
            del_btn.clicked.connect(lambda checked, idx=i: self.remove_team(idx))
            row_layout.addWidget(del_btn)
            
            self.list_layout.addWidget(row_widget)

    def sync_data(self):
        """Update internal arrays with text from the QLineEdits before modifying the list."""
        current_teams = []
        for i, line_edit in enumerate(self.inputs):
            current_teams.append(line_edit.text().strip() or f"Team {i+1}")
        self.teams = current_teams

    def add_team(self):
        self.sync_data()
        self.teams.append(f"Team {len(self.teams) + 1}")
        self.scores.append(0)  # Start new teams with 0 score
        self.refresh_list()

    def remove_team(self, index):
        self.sync_data()
        if len(self.teams) <= 1:
            QMessageBox.warning(self, "Warning", "You must have at least one team!")
            return
            
        self.teams.pop(index)
        self.scores.pop(index)
        self.refresh_list()

    def get_data(self):
        self.sync_data()
        return self.teams, self.scores

class SidemenGame(QMainWindow):
    def __init__(self):
        super().__init__()
        # Updated window title for the custom game!
        self.setWindowTitle("Top 100 - The Custom 10 Rounds Edition")
        self.resize(1300, 950)
        
        # Enhanced Color Palette
        self.bg_color = "#001F3F"
        self.gold_color = "#FFDC00"
        self.blue_accent = "#0074D9"
        self.dark_blue = "#001224"
        self.red_accent = "#FF4136"

        # Game State
        self.teams = ["Team 1", "Team 2", "Team 3"]
        self.team_scores = [0, 0, 0]
        self.current_turn = 0 
        
        self.rounds_data = []
        self.names = [] # Current round answers
        self.current_round_index = 0
        self.button_map = {}
        self.revealed_indices = set()

        self.load_json_data()
        self.init_ui()
        self.load_round()

    def load_json_data(self):
        if getattr(sys, 'frozen', False):
            # If the application is run as a bundle (the .exe)
            base_path = os.path.dirname(sys.executable)
        else:
            # If the application is run as a normal python script
            base_path = os.path.dirname(os.path.abspath(__file__))
            
        path = os.path.join(base_path, "rounds_data.json")
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.rounds_data = data.get("rounds", [])
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Could not load rounds_data.json!\n{e}")
            # Fallback dummy data if file is missing
            self.rounds_data = [{"title": "MISSING JSON FILE", "answers": ["Error"] * 100}]

    def init_ui(self):
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QVBoxLayout(self.central_widget)
        self.central_widget.setStyleSheet(f"background-color: {self.bg_color};")
        self.main_layout.setContentsMargins(40, 30, 40, 30)
        self.main_layout.setSpacing(20)

        # --- TOP BAR ---
        self.top_bar_layout = QHBoxLayout()
        
        # Left Side (Settings Button)
        self.settings_btn = QPushButton("⚙️ Edit Teams")
        self.settings_btn.setFixedSize(180, 60)
        self.settings_btn.setFont(QFont("Arial Black", 12))
        self.settings_btn.setStyleSheet(f"""
            QPushButton {{ background-color: {self.dark_blue}; color: white; border: 2px solid #444; border-radius: 10px; }}
            QPushButton:hover {{ background-color: #555; border: 2px solid {self.gold_color}; }}
        """)
        self.settings_btn.clicked.connect(self.open_settings)
        self.top_bar_layout.addWidget(self.settings_btn, alignment=Qt.AlignTop | Qt.AlignLeft)

        # Center (Header)
        self.header_layout = QVBoxLayout()
        self.round_label = QLabel("ROUND 1")
        self.round_label.setFont(QFont("Arial Black", 16))
        self.round_label.setStyleSheet("color: #00E5FF; letter-spacing: 3px;")
        self.round_label.setAlignment(Qt.AlignCenter)
        self.header_layout.addWidget(self.round_label)

        self.title_label = QLabel("GAME LOADING...")
        self.title_label.setFont(QFont("Impact", 28))
        self.title_label.setWordWrap(True)
        self.title_label.setMinimumHeight(80)
        self.title_label.setStyleSheet(f"""
            color: {self.gold_color};
            text-shadow: 2px 2px 4px #000000;
        """)
        self.title_label.setAlignment(Qt.AlignCenter)
        self.header_layout.addWidget(self.title_label)
        self.top_bar_layout.addLayout(self.header_layout)

        # Right Side (Guess Box)
        self.guess_box = QLabel("LAST GUESS:\n---")
        self.guess_box.setAlignment(Qt.AlignCenter)
        self.guess_box.setWordWrap(True) # Added word wrap so long text flows to the next line
        self.guess_box.setFixedSize(350, 180) # Considerably increased height and width
        self.guess_box.setFont(QFont("Arial Black", 12))
        self.guess_box.setStyleSheet(f"background-color: {self.dark_blue}; color: white; border: 2px solid #444; border-radius: 10px;")
        self.top_bar_layout.addWidget(self.guess_box, alignment=Qt.AlignTop | Qt.AlignRight)
        
        self.main_layout.addLayout(self.top_bar_layout)
        
        # --- SCORES ROW (Dynamic Container) ---
        self.scores_container = QWidget()
        self.scores_layout = QHBoxLayout(self.scores_container)
        self.scores_layout.setContentsMargins(0, 0, 0, 0)
        self.scores_layout.setSpacing(15)
        self.main_layout.addWidget(self.scores_container)
        
        self.build_scores_ui() # Build it based on current teams

        # --- INPUT CONTROLS ---
        self.controls_layout = QHBoxLayout()
        self.controls_layout.setSpacing(15)
        
        self.prev_btn = QPushButton("◀ PREV ROUND")
        self.prev_btn.setFixedSize(140, 45)
        self.prev_btn.setFont(QFont("Arial Black", 10))
        self.prev_btn.setStyleSheet("background-color: #85144b; color: white; border-radius: 10px; border: 2px solid #500b2c;")
        self.prev_btn.clicked.connect(self.prev_round)

        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Type your guess and press Enter...")
        self.input_field.setFixedHeight(60)
        self.input_field.setFont(QFont("Arial", 16))
        self.input_field.setStyleSheet(f"""
            QLineEdit {{ background: white; border-radius: 10px; padding-left: 20px; color: black; border: 3px solid #ccc; }}
            QLineEdit:focus {{ border: 4px solid {self.gold_color}; }}
        """)
        self.input_field.returnPressed.connect(self.check_name)
        
        self.next_btn = QPushButton("NEXT ROUND ▶")
        self.next_btn.setFixedSize(140, 45)
        self.next_btn.setFont(QFont("Arial Black", 10))
        self.next_btn.setStyleSheet("background-color: #FF851B; color: white; border-radius: 10px; border: 2px solid #b35c00;")
        self.next_btn.clicked.connect(self.next_round)

        self.controls_layout.addWidget(self.prev_btn)
        self.controls_layout.addWidget(self.input_field)
        self.controls_layout.addWidget(self.next_btn)
        self.main_layout.addLayout(self.controls_layout)

        # --- GAME BOARD ---
        self.scroll = QScrollArea()
        self.scroll_content = QWidget()
        self.grid_layout = QGridLayout(self.scroll_content)
        self.grid_layout.setSpacing(8)
        self.scroll.setWidgetResizable(True)
        self.scroll.setStyleSheet("""
            QScrollArea { border: 2px solid #004488; border-radius: 10px; background: #001224; padding: 5px; }
            QScrollBar:vertical { background: #001F3F; width: 12px; }
            QScrollBar::handle:vertical { background: #0074D9; border-radius: 6px; }
        """)
        self.scroll_content.setStyleSheet("background: transparent;")
        self.scroll.setWidget(self.scroll_content)
        self.main_layout.addWidget(self.scroll)

        self.create_empty_board()

        # --- BOTTOM CONTROLS (GIVE UP BUTTON) ---
        self.bottom_layout = QHBoxLayout()
        self.give_up_btn = QPushButton("🏳️ GIVE UP / REVEAL ALL")
        self.give_up_btn.setFixedSize(220, 45)
        self.give_up_btn.setFont(QFont("Arial Black", 10))
        self.give_up_btn.setStyleSheet(f"""
            QPushButton {{ background-color: #FF4136; color: white; border-radius: 10px; border: 2px solid #85144b; }}
            QPushButton:hover {{ background-color: #c9302c; }}
        """)
        self.give_up_btn.clicked.connect(self.reveal_all)
        self.bottom_layout.addWidget(self.give_up_btn, alignment=Qt.AlignLeft)
        
        self.main_layout.addLayout(self.bottom_layout)

    def build_scores_ui(self):
        """Clears and redraws the score UI dynamically based on the number of teams."""
        while self.scores_layout.count():
            item = self.scores_layout.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()
                
        self.prev_team_btn = QPushButton("◀")
        self.style_nav_btn(self.prev_team_btn)
        self.prev_team_btn.clicked.connect(self.prev_turn)
        self.scores_layout.addWidget(self.prev_team_btn)

        self.score_labels = []
        for i in range(len(self.teams)):
            label = QLabel(f"{self.teams[i]}\n{self.team_scores[i]}")
            label.setAlignment(Qt.AlignCenter)
            label.setFixedSize(180, 70)
            label.setFont(QFont("Arial Black", 14))
            self.scores_layout.addWidget(label)
            self.score_labels.append(label)
            
        self.next_team_btn = QPushButton("▶")
        self.style_nav_btn(self.next_team_btn)
        self.next_team_btn.clicked.connect(self.next_turn)
        self.scores_layout.addWidget(self.next_team_btn)
        
        self.update_turn_display()

    def style_nav_btn(self, btn):
        btn.setFixedSize(45, 70)
        btn.setFont(QFont("Arial Black", 14))
        btn.setStyleSheet(f"""
            QPushButton {{ background-color: {self.dark_blue}; color: white; border: 2px solid #444; border-radius: 10px; }}
            QPushButton:hover {{ background-color: {self.blue_accent}; border: 2px solid white; }}
        """)

    def open_settings(self):
        dialog = TeamSettingsDialog(self.teams, self.team_scores, self)
        if dialog.exec_():
            self.teams, self.team_scores = dialog.get_data()
            
            # Make sure current_turn stays within bounds if a team was deleted
            self.current_turn = min(self.current_turn, len(self.teams) - 1)
            
            # Rebuild UI
            self.build_scores_ui()
            self.input_field.setFocus()

    def create_empty_board(self):
        for i in range(100):
            rank = i + 1
            btn = QPushButton(f"{rank}")
            btn.setFixedSize(180, 75)
            btn.setFont(QFont("Arial Black", 14))
            self.grid_layout.addWidget(btn, i // 6, i % 6)
            self.button_map[rank] = btn

    def load_round(self):
        if not self.rounds_data or self.current_round_index < 0 or self.current_round_index >= len(self.rounds_data): 
            return
            
        current = self.rounds_data[self.current_round_index]
        self.title_label.setText(current.get("title", "UNKNOWN ROUND").upper())
        self.round_label.setText(f"ROUND {self.current_round_index + 1} OF {len(self.rounds_data)}")
        
        # Resetting round state
        self.revealed_indices.clear()
        self.names = current.get("answers", [])
        
        # Reset Guess Box
        self.guess_box.setText("LAST GUESS:\n---")
        self.guess_box.setFont(QFont("Arial Black", 12))
        self.guess_box.setStyleSheet(f"background-color: {self.dark_blue}; color: white; border: 2px solid #444; border-radius: 10px;")
        
        # Update Nav Buttons & Re-enable Give Up Button
        self.prev_btn.setEnabled(self.current_round_index > 0)
        self.next_btn.setText("FINISH GAME" if self.current_round_index == len(self.rounds_data) - 1 else "NEXT ROUND ▶")
        self.give_up_btn.setEnabled(True)
        
        self.reset_board_ui()
        self.input_field.setFocus()

    def reset_board_ui(self):
        for rank, btn in self.button_map.items():
            btn.setText(f"{rank}")
            btn.setStyleSheet(f"""
                background-color: {self.blue_accent}; 
                color: rgba(255, 255, 255, 0.6); 
                border: 2px solid #005aab; 
                border-radius: 6px;
            """)

    def update_turn_display(self):
        for i, label in enumerate(self.score_labels):
            label.setText(f"{self.teams[i]}\n{self.team_scores[i]}")
            if i == self.current_turn:
                label.setStyleSheet(f"background-color: {self.gold_color}; color: black; border: 4px solid white; border-radius: 10px;")
            else:
                label.setStyleSheet(f"background-color: {self.dark_blue}; color: #888888; border: 2px solid #333333; border-radius: 10px;")

    def check_name(self):
        display_guess = self.input_field.text().strip()
        guess = display_guess.lower()
        self.input_field.clear()
        if not guess: return

        best_match_index = -1
        highest_score = 0
        found_by_partial = False

        for i, name in enumerate(self.names):
            name_lower = name.lower()
            fuzz_score = SequenceMatcher(None, guess, name_lower).ratio()
            
            name_parts = name_lower.split()
            is_partial = any(guess == part for part in name_parts)

            if is_partial:
                best_match_index = i
                found_by_partial = True
                break
            
            if fuzz_score > highest_score:
                highest_score = fuzz_score
                best_match_index = i

        if (highest_score >= 0.8 or found_by_partial) and best_match_index not in self.revealed_indices:
            rank = best_match_index + 1
            name = self.names[best_match_index]
            self.reveal_rank(rank, name)
            self.revealed_indices.add(best_match_index)
            
            self.guess_box.setFont(QFont("Arial Black", 10 if len(name) > 15 else 12))
            self.guess_box.setText(f"CORRECT:\n{name} (#{rank})")
            self.guess_box.setStyleSheet(f"background-color: {self.gold_color}; color: black; border: 3px solid white; border-radius: 10px;")
            
            self.team_scores[self.current_turn] += rank
            self.update_turn_display()
            self.next_turn()
            
        elif best_match_index in self.revealed_indices and (highest_score >= 0.8 or found_by_partial):
            rank = best_match_index + 1
            name = self.names[best_match_index]
            self.guess_box.setText(f"ALREADY FOUND:\n{name} (#{rank})")
            self.guess_box.setStyleSheet("background-color: #FF851B; color: white; border: 3px solid white; border-radius: 10px;")
            QMessageBox.information(self, "Found", f"'{name}' is already on the board!")
        else:
            self.guess_box.setFont(QFont("Arial Black", 10 if len(display_guess) > 15 else 12))
            self.guess_box.setText(f"INCORRECT:\n{display_guess}")
            self.guess_box.setStyleSheet(f"background-color: {self.red_accent}; color: white; border: 3px solid white; border-radius: 10px;")
            self.show_strike()

    def show_strike(self):
        active_label = self.score_labels[self.current_turn]
        active_label.setStyleSheet(f"background-color: {self.red_accent}; color: white; border: 4px solid white; border-radius: 10px;")
        active_label.setText("X STRIKE X")
        QTimer.singleShot(1000, self.reset_strike_and_move)

    def reset_strike_and_move(self):
        self.next_turn()

    def prev_turn(self):
        self.current_turn = (self.current_turn - 1) % len(self.teams)
        self.update_turn_display()
        self.input_field.setFocus()

    def next_turn(self):
        self.current_turn = (self.current_turn + 1) % len(self.teams)
        self.update_turn_display()
        self.input_field.setFocus()

    def reveal_rank(self, rank, name, is_give_up=False):
        button = self.button_map[rank]
        font_size = 12 if len(name) < 18 else 9
        button.setFont(QFont("Arial Black", font_size))
        button.setText(f"{name}\n(#{rank})")
        
        # Change color based on if they got it right, or if they gave up
        bg_color = "#AAAAAA" if is_give_up else self.gold_color
        text_color = "black" 
        
        button.setStyleSheet(f"""
            background-color: {bg_color}; 
            color: {text_color}; 
            border: 2px solid white; 
            border-radius: 6px;
        """)

    def reveal_all(self):
        """Reveals all missing items on the board after confirming."""
        reply = QMessageBox.question(self, 'Give Up?', 
                                     'Are you sure you want to reveal all remaining answers?',
                                     QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if reply == QMessageBox.Yes:
            for i, name in enumerate(self.names):
                if i not in self.revealed_indices:
                    rank = i + 1
                    self.reveal_rank(rank, name, is_give_up=True)
                    self.revealed_indices.add(i)
            self.give_up_btn.setEnabled(False) # Disable button until next round

    def prev_round(self):
        if self.current_round_index > 0:
            self.current_round_index -= 1
            self.load_round()

    def next_round(self):
        if self.current_round_index < len(self.rounds_data) - 1:
            self.current_round_index += 1
            self.load_round()
        else:
            winner_idx = self.team_scores.index(max(self.team_scores))
            QMessageBox.information(self, "Game Over", f"Game Complete!\n\nThe Winner is: {self.teams[winner_idx]} with {max(self.team_scores)} points!")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = SidemenGame()
    window.show()
    sys.exit(app.exec_())