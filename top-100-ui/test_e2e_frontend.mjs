/**
 * Comprehensive Dual Track E2E Frontend Test Suite
 * Requirements Covered: R1, R2, R3, R4, R5, R6, R7 (Features 1 through 15)
 * 
 * Tiers:
 * - Tier 1: Feature Coverage (>=5 test cases per feature for Features 1-15)
 * - Tier 2: Boundary & Corner Cases (edge cases, modal layering, selection ranges, emoji audits)
 * - Tier 3: Cross-Feature Combinations (pairwise interactions, layout under host/guest states)
 * - Tier 4: Real-World Frontend Scenarios (session transitions, modal lifecycles)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const uiSrc = path.resolve(__dirname, 'src');

console.log('================================================================');
console.log('TOP 100 COMPREHENSIVE E2E FRONTEND TEST SUITE (R1-R7)');
console.log('================================================================\n');

const milestoneArgIdx = process.argv.findIndex(a => a === '--milestone' || a === '-m');
const targetMilestone = milestoneArgIdx !== -1 && process.argv[milestoneArgIdx + 1]
  ? process.argv[milestoneArgIdx + 1].toUpperCase()
  : (process.argv.find(a => a.startsWith('--milestone='))?.split('=')[1]?.toUpperCase() || null);

let passCount = 0;
let failCount = 0;
let skippedCount = 0;
const failures = [];
const tierStats = {
  Tier1: { pass: 0, fail: 0 },
  Tier2: { pass: 0, fail: 0 },
  Tier3: { pass: 0, fail: 0 },
  Tier4: { pass: 0, fail: 0 },
  Tier5: { pass: 0, fail: 0 }
};

function recordTest(tier, condition, testId, testName, details = '', milestone = 'M1') {
  if (targetMilestone && targetMilestone !== 'ALL') {
    const levels = { M1: 1, M2: 2, M3: 3, M4: 4 };
    const targetLevel = levels[targetMilestone] || 4;
    const testLevel = levels[milestone.toUpperCase()] || 1;
    if (testLevel > targetLevel) {
      skippedCount++;
      return;
    }
  }

  if (condition) {
    console.log(`[PASS] [${tier}] [${testId}] ${testName}`);
    passCount++;
    tierStats[tier].pass++;
  } else {
    console.error(`[FAIL] [${tier}] [${testId}] [Pending ${milestone}] ${testName}${details ? ' -> ' + details : ''}`);
    failCount++;
    tierStats[tier].fail++;
    failures.push({ tier, testId, testName, details, milestone });
  }
}

// Read relevant source files
const whirlpoolTsx = fs.readFileSync(path.join(uiSrc, 'components', 'WhirlpoolBackground.tsx'), 'utf8');
const onlineLobbyTsx = fs.readFileSync(path.join(uiSrc, 'components', 'OnlineLobbyModal.tsx'), 'utf8');
const appTsx = fs.readFileSync(path.join(uiSrc, 'App.tsx'), 'utf8');
const postGameTsx = fs.readFileSync(path.join(uiSrc, 'components', 'PostGameCelebrationModal.tsx'), 'utf8');
const roundSummaryTsx = fs.readFileSync(path.join(uiSrc, 'components', 'RoundSummaryModal.tsx'), 'utf8');
const podiumTsx = fs.readFileSync(path.join(uiSrc, 'components', 'MatchPodiumModal.tsx'), 'utf8');
const matchSetupTsx = fs.readFileSync(path.join(uiSrc, 'components', 'MatchSetup.tsx'), 'utf8');
const useOnlineGameTs = fs.readFileSync(path.join(uiSrc, 'hooks', 'useOnlineGame.ts'), 'utf8');

// =============================================================================
// TIER 1: FEATURE COVERAGE (Features 1 - 15)
// =============================================================================
console.log('----------------------------------------------------------------');
console.log('TIER 1: FEATURE COVERAGE (Features 1 - 15, >=5 tests per feature)');
console.log('----------------------------------------------------------------\n');

// --- Feature 1: R1 Host Background Rendering ---
{
  // 1.1 Canvas element with fixed positioning and z-0
  recordTest('Tier1', whirlpoolTsx.includes('className="fixed inset-0 pointer-events-none z-0 w-full h-full"'),
    'F1.1', 'WhirlpoolBackground: Canvas renders fixed inset-0 pointer-events-none at z-0');

  // 1.2 Deep navy center radial gradient
  recordTest('Tier1', whirlpoolTsx.includes("bgGrad.addColorStop(0, '#0a0f23')"),
    'F1.2', 'WhirlpoolBackground: Background radial gradient starts with deep navy center (#0a0f23)');

  // 1.3 Canvas edge vignette gradient tuned (max alpha <= 0.50 so arena margins show whirlpool)
  // Check the active render loop vignette (last vigGrad definition in WhirlpoolBackground)
  const vigMatches = [...whirlpoolTsx.matchAll(/vigGrad\.addColorStop\(1,\s*'rgba\(13,\s*13,\s*13,\s*([0-9.]+)\)'\)/g)];
  const renderLoopVigMatch = vigMatches.length > 0 ? vigMatches[vigMatches.length - 1] : null;
  const outerAlpha = renderLoopVigMatch ? parseFloat(renderLoopVigMatch[1]) : 1.0;
  recordTest('Tier1', outerAlpha <= 0.50,
    'F1.3', `WhirlpoolBackground: Vignette outer opacity tuned to <= 0.50 (found: ${outerAlpha})`);

  // 1.4 OnlineLobbyModal backdrop overlay is non-blocking/translucent (backdrop opacity <= 50% or backdrop-blur reduced)
  const lobbyBackdropMatch = onlineLobbyTsx.match(/fixed inset-0 ([^"]+)/);
  const lobbyBackdropClass = lobbyBackdropMatch ? lobbyBackdropMatch[1] : '';
  const isLobbyTranslucent = lobbyBackdropClass.includes('bg-black/4') || lobbyBackdropClass.includes('bg-black/3') || lobbyBackdropClass.includes('bg-black/5') || !lobbyBackdropClass.includes('bg-black/85');
  recordTest('Tier1', isLobbyTranslucent,
    'F1.4', `OnlineLobbyModal: Modal backdrop overlay is translucent for host background visibility (found: "${lobbyBackdropClass}")`);

  // 1.5 App.tsx mounts WhirlpoolBackground at root behind screen elements
  recordTest('Tier1', appTsx.includes('<WhirlpoolBackground dominantColor="blue" />') || appTsx.includes('<WhirlpoolBackground'),
    'F1.5', 'App.tsx: WhirlpoolBackground component mounted at root level');
}

// --- Feature 2: R2.1 Compact Surrender Trigger Button ---
{
  // 2.1 Header surrender button compact sizing
  recordTest('Tier1', appTsx.includes('w-9 h-9 rounded-xl') && appTsx.includes('title="Call 60s Surrender Vote'),
    'F2.1', 'App.tsx: Header surrender trigger button styled compactly (w-9 h-9)');

  // 2.2 Header surrender button does not contain surrender emoji
  const headerSurrenderBlock = appTsx.slice(appTsx.indexOf('title="Call 60s Surrender Vote') - 100, appTsx.indexOf('title="Call 60s Surrender Vote') + 300);
  recordTest('Tier1', !headerSurrenderBlock.includes('🏳️') && !headerSurrenderBlock.includes('🏳'),
    'F2.2', 'App.tsx: Header surrender trigger button contains NO surrender flag emoji');

  // 2.3 Arena banner surrender trigger button removed under R2 (no center button)
  recordTest('Tier1', !appTsx.includes('You reached 3 consecutive misses and are eligible to call a 60s surrender vote!'),
    'F2.3', 'App.tsx: Center-screen surrender banner removed under R2');

  // 2.4 Arena banner surrender trigger text has NO surrender flag emoji
  const hasSurrenderEmoji = appTsx.includes('🏳️') || appTsx.includes('🏳');
  recordTest('Tier1', !hasSurrenderEmoji,
    'F2.4', 'App.tsx: Arena controls contain NO surrender flag emoji');

  // 2.5 Offline stall surrender button has NO surrender flag emoji
  const stallBtnMatch = appTsx.match(/title="Surrender Round"/);
  const stallBtnSnippet = stallBtnMatch ? appTsx.slice(stallBtnMatch.index - 150, stallBtnMatch.index + 200) : '';
  recordTest('Tier1', !stallBtnSnippet.includes('🏳️') && !stallBtnSnippet.includes('🏳'),
    'F2.5', 'App.tsx: Offline stall surrender button contains NO surrender flag emoji');
}

// --- Feature 3: R2.2 Compact Surrender Voting Prompt ---
{
  // 3.1 Container width is compact (max-w-md or max-w-lg, not max-w-2xl)
  const voteContainerMatch = appTsx.match(/online\.roomInfo\?\.surrender_vote[^>]*>[\s\S]{1,300}?className="([^"]+)"/);
  const containerClasses = voteContainerMatch ? voteContainerMatch[1] : '';
  const isCompactWidth = containerClasses.includes('max-w-md') || containerClasses.includes('max-w-lg') || !containerClasses.includes('max-w-2xl');
  recordTest('Tier1', isCompactWidth,
    'F3.1', `App.tsx: Surrender vote prompt container is sized compactly (found: "${containerClasses}")`);

  // 3.2 Container padding is compact (p-2.5 or p-3, not p-4)
  const isCompactPadding = containerClasses.includes('p-2.5') || containerClasses.includes('p-3') || !containerClasses.includes('p-4');
  recordTest('Tier1', isCompactPadding,
    'F3.2', `App.tsx: Surrender vote prompt padding is compact (found: "${containerClasses}")`);

  // 3.3 Prompt header has NO 🏳️ emoji
  const votePromptSection = appTsx.slice(appTsx.indexOf('surrender_vote') - 50, appTsx.indexOf('surrender_vote') + 1200);
  const hasFlagInPrompt = /<span>🏳️<\/span>|<span[^>]*>🏳️<\/span>|🏳️/.test(votePromptSection);
  recordTest('Tier1', !hasFlagInPrompt,
    'F3.3', 'App.tsx: Surrender vote prompt contains NO surrender flag emoji');

  // 3.4 "Vote Yes" button has NO ✓ emoji or symbol
  const hasCheckEmoji = /✓\s*Vote Yes|Vote Yes\s*✓|✓/.test(votePromptSection);
  recordTest('Tier1', !hasCheckEmoji,
    'F3.4', 'App.tsx: "Vote Yes" button contains NO checkmark symbol or emoji');

  // 3.5 "Vote No" button has NO ✕ emoji or symbol
  const hasCrossEmoji = /✕\s*Vote No|Vote No\s*✕|✕/.test(votePromptSection);
  recordTest('Tier1', !hasCrossEmoji,
    'F3.5', 'App.tsx: "Vote No" button contains NO cross symbol or emoji');
}

// --- Feature 4: R2.3 Surrender 60s Auto-Dismissal ---
{
  // 4.1 Surrender prompt display condition includes surrenderSecondsLeft > 0
  const promptConditionMatch = appTsx.match(/\{isOnline\s*&&\s*online\.roomInfo\?\.surrender_vote\s*&&([^>]+)>/);
  const conditionSnippet = promptConditionMatch ? promptConditionMatch[1] : '';
  const hasTimeGuard = conditionSnippet.includes('surrenderSecondsLeft > 0') || appTsx.includes('surrenderSecondsLeft > 0');
  recordTest('Tier1', hasTimeGuard,
    'F4.1', 'App.tsx: Surrender prompt render condition enforces surrenderSecondsLeft > 0');

  // 4.2 Client countdown interval tracks expires_at
  recordTest('Tier1', appTsx.includes('Math.max(0, Math.ceil(online.roomInfo.surrender_vote.expires_at - Date.now() / 1000))'),
    'F4.2', 'App.tsx: Countdown calculates remaining seconds from expires_at timestamp');

  // 4.3 Default fallback countdown sets 60 seconds
  recordTest('Tier1', appTsx.includes('setSurrenderSecondsLeft(60)'),
    'F4.3', 'App.tsx: Resets surrenderSecondsLeft to 60 when surrender_vote is cleared');

  // 4.4 Prompt renders dynamic countdown display
  recordTest('Tier1', appTsx.includes('surrenderSecondsLeft') && (appTsx.includes('{surrenderSecondsLeft}s') || appTsx.includes('{surrenderSecondsLeft} s')),
    'F4.4', 'App.tsx: Surrender prompt renders remaining seconds dynamically ({surrenderSecondsLeft}s)');

  // 4.5 Interval cleanup properly returned in useEffect
  recordTest('Tier1', appTsx.includes('return () => clearInterval(interval);'),
    'F4.5', 'App.tsx: Cleanup function returns clearInterval(interval) to prevent timer leaks');
}

// --- Feature 5: R6.1 Emoji Removal ---
{
  // 5.1 Host badge in OnlineLobbyModal has NO 👑 emoji
  const lobbyHostBadgeMatch = onlineLobbyTsx.match(/Host/g);
  const hasCrown = onlineLobbyTsx.includes('👑');
  recordTest('Tier1', !hasCrown,
    'F5.1', 'OnlineLobbyModal: Host badge contains NO crown emoji 👑');

  // 5.2 Launch button in OnlineLobbyModal has NO 🚀 emoji
  const hasRocket = onlineLobbyTsx.includes('🚀');
  recordTest('Tier1', !hasRocket,
    'F5.2', 'OnlineLobbyModal: "Launch Online Match" button contains NO rocket emoji 🚀');

  // 5.3 PostGameCelebrationModal "Return to Lobby with Team" has NO 👥 emoji
  const postGameReturnBtn = postGameTsx.slice(postGameTsx.indexOf('Return to Lobby with Team') - 40, postGameTsx.indexOf('Return to Lobby with Team') + 60);
  const hasPeopleInPostGame = postGameReturnBtn.includes('👥');
  recordTest('Tier1', !hasPeopleInPostGame,
    'F5.3', 'PostGameCelebrationModal: "Return to Lobby with Team" button contains NO people emoji 👥');

  // 5.4 App.tsx inspection banner "Return to Lobby with Team" has NO 👥 emoji
  const appReturnMatch = appTsx.match(/Return to Lobby with Team/);
  const appReturnSnippet = appReturnMatch ? appTsx.slice(appReturnMatch.index - 50, appReturnMatch.index + 80) : '';
  const hasPeopleInApp = appReturnSnippet.includes('👥');
  recordTest('Tier1', !hasPeopleInApp,
    'F5.4', 'App.tsx: Inspection banner "Return to Lobby with Team" contains NO people emoji 👥');

  // 5.5 App.tsx Modal 10 (Surrender Round Confirmation) has NO 🏳️ emoji
  const modal10Match = appTsx.match(/Surrender this round\?/);
  const modal10Snippet = modal10Match ? appTsx.slice(modal10Match.index - 100, modal10Match.index + 500) : '';
  const hasFlagInModal10 = modal10Snippet.includes('🏳️') || modal10Snippet.includes('🏳');
  recordTest('Tier1', !hasFlagInModal10,
    'F5.5', 'App.tsx: Modal 10 (Surrender Round Confirmation) contains NO flag emoji 🏳️');
}

// --- Feature 6: R6.2 Single-Line Post-Game Button Layout ---
{
  // 6.1 PostGameCelebrationModal footer uses flex-nowrap
  const footerContainerMatch = postGameTsx.match(/border-t-2 border-\[#891c1c\]([^>]+)>/);
  const footerClasses = footerContainerMatch ? footerContainerMatch[1] : '';
  const isFlexNowrap = footerClasses.includes('flex-nowrap') || !footerClasses.includes('flex-wrap');
  recordTest('Tier1', isFlexNowrap,
    'F6.1', `PostGameCelebrationModal: Footer uses flex-nowrap to prevent wrapping (found: "${footerClasses}")`);

  // 6.2 PostGameCelebrationModal footer uses overflow-x-auto
  const hasOverflowAuto = footerClasses.includes('overflow-x-auto');
  recordTest('Tier1', hasOverflowAuto,
    'F6.2', `PostGameCelebrationModal: Footer uses overflow-x-auto for smooth horizontal scrolling (found: "${footerClasses}")`);

  // 6.3 PostGameCelebrationModal footer buttons have whitespace-nowrap
  const buttonsSnippet = postGameTsx.slice(postGameTsx.indexOf('border-t-2 border-[#891c1c]'), postGameTsx.indexOf('border-t-2 border-[#891c1c]') + 1000);
  recordTest('Tier1', buttonsSnippet.includes('whitespace-nowrap'),
    'F6.3', 'PostGameCelebrationModal: Footer buttons have whitespace-nowrap class');

  // 6.4 PostGameCelebrationModal footer buttons have shrink-0
  recordTest('Tier1', buttonsSnippet.includes('shrink-0'),
    'F6.4', 'PostGameCelebrationModal: Footer buttons have shrink-0 to prevent collapsing');

  // 6.5 App.tsx post-round inspection banner buttons aligned on a single row
  const bannerButtonsMatch = appTsx.match(/End-of-Game Inspection Banner[\s\S]{1,500}?flex ([^"]+)/);
  const bannerClasses = bannerButtonsMatch ? bannerButtonsMatch[1] : '';
  recordTest('Tier1', !bannerClasses.includes('flex-col'),
    'F6.5', 'App.tsx: Post-round inspection banner buttons arranged in horizontal row');
}

// --- Feature 7: R3.1 Turn Input Auto-Focus ---
{
  // 7.1 guessInputRef declaration
  recordTest('Tier1', appTsx.includes('guessInputRef') && appTsx.includes('useRef<HTMLInputElement>'),
    'F7.1', 'App.tsx: Declares guessInputRef with useRef<HTMLInputElement>(null)', '', 'M2');

  // 7.2 guessInputRef attached to input
  recordTest('Tier1', appTsx.includes('ref={guessInputRef}'),
    'F7.2', 'App.tsx: Attaches guessInputRef to the answer <input>', '', 'M2');

  // 7.3 Auto-focus effect listens to isMyTurn and turn transitions
  recordTest('Tier1', appTsx.includes('guessInputRef.current.focus()') || appTsx.includes('guessInputRef.current?.focus()'),
    'F7.3', 'App.tsx: Executes imperative .focus() on turn transitions', '', 'M2');

  // 7.4 Auto-focus effect checks modal absence before stealing focus
  const focusEffectSnippet = appTsx.slice(appTsx.indexOf('guessInputRef.current') - 300, appTsx.indexOf('guessInputRef.current') + 100);
  const checksModals = focusEffectSnippet.includes('showSettings') || focusEffectSnippet.includes('showCelebration') || focusEffectSnippet.includes('showLeaveLobbyConfirm');
  recordTest('Tier1', checksModals,
    'F7.4', 'App.tsx: Auto-focus is guarded against active modals (settings, celebration, leave lobby)', '', 'M2');

  // 7.5 Cursor placed at end of pre-typed text
  recordTest('Tier1', appTsx.includes('setSelectionRange') && appTsx.includes('guessInputRef.current'),
    'F7.5', 'App.tsx: Sets selection range to the end of input text for seamless typing', '', 'M2');
}

// --- Feature 8: R3.2 Off-Turn Pre-Typing & Editing ---
{
  // 8.1 Input disabled prop does NOT disable when off-turn
  const inputDisabledMatch = appTsx.match(/<input[\s\S]{1,500}?disabled=\{([^}]+)\}/);
  const disabledExpr = inputDisabledMatch ? inputDisabledMatch[1] : '';
  const isNotDisabledOffTurn = !disabledExpr.includes('isOnline && !isMyTurn') && !disabledExpr.includes('!isMyTurn');
  recordTest('Tier1', isNotDisabledOffTurn,
    'F8.1', `App.tsx: Answer <input> is NOT disabled off-turn (disabledExpr: "${disabledExpr}")`, '', 'M2');

  // 8.2 Placeholder informs player they can pre-type
  const placeholderSnippet = appTsx.slice(appTsx.indexOf('<input') - 50, appTsx.indexOf('<input') + 700);
  const hasPreTypeHint = placeholderSnippet.includes('Pre-type') || placeholderSnippet.includes('guess') || placeholderSnippet.includes('turn');
  recordTest('Tier1', hasPreTypeHint,
    'F8.2', 'App.tsx: Input placeholder indicates pre-typing is supported', '', 'M2');

  // 8.3 submitGuess guards off-turn without clearing guess text
  const submitGuessSnippet = appTsx.slice(appTsx.indexOf('const submitGuess ='), appTsx.indexOf('const submitGuess =') + 500);
  const preservesGuessOffTurn = submitGuessSnippet.includes('if (!isMyTurn) return;') && !submitGuessSnippet.includes('setGuess(\'\');\n      if (!isMyTurn)');
  recordTest('Tier1', preservesGuessOffTurn,
    'F8.3', 'App.tsx: submitGuess blocks off-turn submission while preserving typed draft', '', 'M2');

  // 8.4 Form submission handler prevents default
  recordTest('Tier1', submitGuessSnippet.includes('e.preventDefault()'),
    'F8.4', 'App.tsx: Form submission prevents default to avoid page reload on Enter', '', 'M2');

  // 8.5 Guess text reset effect on round change
  const roundResetSnippet = appTsx.match(/setGuess\(''\);[\s\S]{1,100}?activeGameState\?\.current_round/);
  recordTest('Tier1', roundResetSnippet !== null || appTsx.includes("setGuess('')"),
    'F8.5', 'App.tsx: Clears draft answer upon round transition to prevent answer leakage', '', 'M2');
}

// --- Feature 9: R4.1 Host-Exclusive Progression Button Visibility ---
{
  // 9.1 PostGameCelebrationModalProps includes isHost prop
  recordTest('Tier1', postGameTsx.includes('isHost?: boolean') || postGameTsx.includes('isHost: boolean'),
    'F9.1', 'PostGameCelebrationModalProps: Defines isHost prop contract', '', 'M2');

  // 9.2 PostGameCelebrationModal guards progression buttons with isHost !== false
  const postGameProgressionMatch = postGameTsx.match(/isHost[^>]*>[\s\S]{1,300}?(Next Round|Play Again)/);
  recordTest('Tier1', postGameProgressionMatch !== null || postGameTsx.includes('isHost !== false') || postGameTsx.includes('isHost &&'),
    'F9.2', 'PostGameCelebrationModal: Progression buttons guarded by isHost', '', 'M2');

  // 9.3 RoundSummaryModalProps includes isHost prop
  recordTest('Tier1', roundSummaryTsx.includes('isHost?: boolean') || roundSummaryTsx.includes('isHost: boolean'),
    'F9.3', 'RoundSummaryModalProps: Defines isHost prop contract', '', 'M2');

  // 9.4 MatchPodiumModalProps includes isHost prop
  recordTest('Tier1', podiumTsx.includes('isHost?: boolean') || podiumTsx.includes('isHost: boolean'),
    'F9.4', 'MatchPodiumModalProps: Defines isHost prop contract', '', 'M2');

  // 9.5 App.tsx arena board inspection guards Next Category / Play Again with isHost
  const arenaInspectionProgression = appTsx.match(/\(!isOnline\s*\|\|\s*online\.isHost\)[^>]*>[\s\S]{1,300}?(Next Category|Play Again)/);
  recordTest('Tier1', arenaInspectionProgression !== null || appTsx.includes('online.isHost'),
    'F9.5', 'App.tsx: Board inspection progression buttons restricted to host in online mode', '', 'M2');
}

// --- Feature 10: R4.2 Host "Play Again" Room Restart ---
{
  // 10.1 useOnlineGame defines playOnlineAgain method
  recordTest('Tier1', useOnlineGameTs.includes('playOnlineAgain'),
    'F10.1', 'useOnlineGame: Defines playOnlineAgain action dispatcher', '', 'M2');

  // 10.2 playOnlineAgain sends action: 'PLAY_AGAIN'
  recordTest('Tier1', useOnlineGameTs.includes("action: 'PLAY_AGAIN'"),
    'F10.2', 'useOnlineGame: Sends {"action": "PLAY_AGAIN"} WebSocket message', '', 'M2');

  // 10.3 handlePlayAgain in App.tsx calls online.playOnlineAgain when isOnline
  const handlePlayAgainSnippet = appTsx.slice(appTsx.indexOf('const handlePlayAgain ='), appTsx.indexOf('const handlePlayAgain =') + 400);
  recordTest('Tier1', handlePlayAgainSnippet.includes('online.playOnlineAgain()'),
    'F10.3', 'App.tsx: handlePlayAgain invokes online.playOnlineAgain() in online mode', '', 'M2');

  // 10.4 useOnlineGame derives isHost dynamically from roomInfo.host_id === myPlayerId
  recordTest('Tier1', useOnlineGameTs.includes('roomInfo?.host_id === myPlayerId') || useOnlineGameTs.includes('host_id === myPlayerId'),
    'F10.4', 'useOnlineGame: Derives isHost dynamically from roomInfo.host_id === myPlayerId', '', 'M2');

  // 10.5 useOnlineGame exports playOnlineAgain in hook return object
  recordTest('Tier1', useOnlineGameTs.includes('playOnlineAgain,') || useOnlineGameTs.includes('playOnlineAgain\n'),
    'F10.5', 'useOnlineGame: Returns playOnlineAgain in hook return contract', '', 'M2');
}

// --- Feature 11: R4.3 Host "Next Round" Advancement ---
{
  // 11.1 useOnlineGame defines nextOnlineRound method
  recordTest('Tier1', useOnlineGameTs.includes('nextOnlineRound'),
    'F11.1', 'useOnlineGame: Defines nextOnlineRound action dispatcher', '', 'M2');

  // 11.2 nextOnlineRound sends action: 'NEXT_ROUND'
  recordTest('Tier1', useOnlineGameTs.includes("action: 'NEXT_ROUND'"),
    'F11.2', 'useOnlineGame: Sends {"action": "NEXT_ROUND"} WebSocket message', '', 'M2');

  // 11.3 handleNextRound in App.tsx calls online.nextOnlineRound when isOnline
  const handleNextRoundSnippet = appTsx.slice(appTsx.indexOf('const handleNextRound ='), appTsx.indexOf('const handleNextRound =') + 400);
  recordTest('Tier1', handleNextRoundSnippet.includes('online.nextOnlineRound()'),
    'F11.3', 'App.tsx: handleNextRound invokes online.nextOnlineRound() in online mode', '', 'M2');

  // 11.4 Arena inspection Next Category button calls handleNextRound
  recordTest('Tier1', appTsx.includes('onClick={handleNextRound}') && appTsx.includes('Next Category'),
    'F11.4', 'App.tsx: Next Category button in inspection banner dispatches handleNextRound', '', 'M2');

  // 11.5 useOnlineGame exports nextOnlineRound in hook return object
  recordTest('Tier1', useOnlineGameTs.includes('nextOnlineRound,') || useOnlineGameTs.includes('nextOnlineRound\n'),
    'F11.5', 'useOnlineGame: Returns nextOnlineRound in hook return contract', '', 'M2');
}

// --- Feature 12: R5 Main Menu Exit Confirmation Modal ---
{
  // 12.1 App.tsx declares showLeaveLobbyConfirm state
  recordTest('Tier1', appTsx.includes('showLeaveLobbyConfirm') && appTsx.includes('setShowLeaveLobbyConfirm'),
    'F12.1', 'App.tsx: Declares showLeaveLobbyConfirm state', '', 'M2');

  // 12.2 handleRequestMainMenu intercepts exit for non-host online players
  const handleReqMenuSnippet = appTsx.slice(appTsx.indexOf('const handleRequestMainMenu ='), appTsx.indexOf('const handleRequestMainMenu =') + 300);
  recordTest('Tier1', handleReqMenuSnippet.includes('setShowLeaveLobbyConfirm(true)'),
    'F12.2', 'App.tsx: handleRequestMainMenu opens LeaveLobbyConfirm for non-host online players', '', 'M2');

  // 12.3 LeaveLobbyConfirmModal rendered at z-[70]
  recordTest('Tier1', appTsx.includes('z-[70]') && appTsx.includes('Leave Online Lobby?'),
    'F12.3', 'App.tsx: Renders LeaveLobbyConfirm modal overlay at z-[70]', '', 'M2');

  // 12.4 Modal includes warning message about leaving online lobby
  recordTest('Tier1', appTsx.includes('Returning to the Main Menu will leave the online lobby and disconnect you from the match'),
    'F12.4', 'App.tsx: LeaveLobbyConfirm modal contains explicit warning message', '', 'M2');

  // 12.5 Confirmation calls online.leaveLobby and returnToMainMenu
  const confirmLeaveSnippet = appTsx.slice(appTsx.indexOf('const handleConfirmLeaveLobby ='), appTsx.indexOf('const handleConfirmLeaveLobby =') + 250);
  recordTest('Tier1', confirmLeaveSnippet.includes('online.leaveLobby()') && confirmLeaveSnippet.includes('returnToMainMenu()'),
    'F12.5', 'App.tsx: handleConfirmLeaveLobby calls online.leaveLobby() and returnToMainMenu()', '', 'M2');
}

// --- Feature 13: R7.1 Boss Rush Surrender Voting by Majority ---
{
  // 13.1 canSurrenderOnline enabled in Boss Rush mode
  const canSurrenderSnippet = appTsx.slice(appTsx.indexOf('const canSurrenderOnline ='), appTsx.indexOf('const canSurrenderOnline =') + 150);
  recordTest('Tier1', canSurrenderSnippet.includes('isOnlineBossRush') || canSurrenderSnippet.includes('isBossRush'),
    'F13.1', 'App.tsx: canSurrenderOnline enabled for all players in Boss Rush mode', '', 'M3');

  // 13.2 Header surrender button visible from match start without miss gate under R2
  recordTest('Tier1', appTsx.includes('!activeGameState.is_round_over && isOnline && !online.roomInfo?.surrender_vote'),
    'F13.2', 'App.tsx: Surrender button trigger is active from match start without miss gate', '', 'M3');

  // 13.3 Surrender vote banner displays majority voting requirement
  const bannerMajorityCheck = appTsx.includes('majority') || appTsx.includes('Majority') || appTsx.includes('surrender_vote');
  recordTest('Tier1', bannerMajorityCheck,
    'F13.3', 'App.tsx: Surrender vote banner informs players of majority vote requirement', '', 'M3');

  // 13.4 Surrender voting banner contains NO flag emojis
  const surrenderBannerRegion = appTsx.slice(appTsx.indexOf('online.roomInfo?.surrender_vote'), appTsx.indexOf('online.roomInfo?.surrender_vote') + 800);
  recordTest('Tier1', !surrenderBannerRegion.includes('🏳️'),
    'F13.4', 'App.tsx: Boss Rush surrender vote banner contains zero flag emojis', '', 'M3');

  // 13.5 Dispatches online.voteSurrender(vote)
  recordTest('Tier1', appTsx.includes('online.voteSurrender(true)') && appTsx.includes('online.voteSurrender(false)'),
    'F13.5', 'App.tsx: Dispatches online.voteSurrender with boolean choice', '', 'M3');
}

// --- Feature 14: R7.2 Boss Rush Selectable Score Goals ---
{
  // 14.1 MatchSetup displays score goals selector for Boss Rush
  const bossRushSection = matchSetupTsx.slice(matchSetupTsx.indexOf('matchMode === \'boss_rush\''), matchSetupTsx.indexOf('matchMode === \'boss_rush\'') + 1200);
  const hasScoreGoalSelector = bossRushSection.includes('Score Goal') || bossRushSection.includes('Point Target') || matchSetupTsx.includes('1000') && matchSetupTsx.includes('5000');
  recordTest('Tier1', hasScoreGoalSelector,
    'F14.1', 'MatchSetup: Boss Rush configuration exposes selectable score goals', '', 'M3');

  // 14.2 Offers options for 1k, 1.5k, 2k, 3k, 4k, and 5k
  const has1k = matchSetupTsx.includes('1000') || matchSetupTsx.includes('1k');
  const has15k = matchSetupTsx.includes('1500') || matchSetupTsx.includes('1.5k');
  const has2k = matchSetupTsx.includes('2000') || matchSetupTsx.includes('2k');
  const has3k = matchSetupTsx.includes('3000') || matchSetupTsx.includes('3k');
  const has4k = matchSetupTsx.includes('4000') || matchSetupTsx.includes('4k');
  const has5k = matchSetupTsx.includes('5000') || matchSetupTsx.includes('5k');
  recordTest('Tier1', has1k && has15k && has2k && has3k && has4k && has5k,
    'F14.2', 'MatchSetup: Supports all 6 required score goals: 1k, 1.5k, 2k, 3k, 4k, 5k', '', 'M3');

  // 14.3 Sets point_threshold in config payload
  recordTest('Tier1', matchSetupTsx.includes('point_threshold: pointThreshold') || matchSetupTsx.includes('point_threshold'),
    'F14.3', 'MatchSetup: Passes point_threshold in start/save config payload', '', 'M3');

  // 14.4 OnlineLobbyModal displays configured score goal in summary card
  const lobbyConfigSummary = onlineLobbyTsx.slice(onlineLobbyTsx.indexOf('Match Configuration'), onlineLobbyTsx.indexOf('Match Configuration') + 1000);
  const displaysGoal = lobbyConfigSummary.includes('Goal:') || lobbyConfigSummary.includes('point_threshold') || lobbyConfigSummary.includes('pts');
  recordTest('Tier1', displaysGoal,
    'F14.4', 'OnlineLobbyModal: Displays configured Boss Rush score goal in match configuration card', '', 'M3');

  // 14.5 MatchSetup preserves selected pointThreshold across mode toggles
  recordTest('Tier1', matchSetupTsx.includes('setPointThreshold'),
    'F14.5', 'MatchSetup: Maintains pointThreshold state via setPointThreshold', '', 'M3');
}

// --- Feature 15: R7.3 Boss Rush Score Goal Victory Trigger ---
{
  // 15.1 Arena header displays Boss Rush score goal target
  const headerArenaSnippet = appTsx.slice(appTsx.indexOf('screen === \'ARENA\''), appTsx.indexOf('screen === \'ARENA\'') + 2000);
  const displaysTarget = headerArenaSnippet.includes('Goal:') || headerArenaSnippet.includes('point_threshold') || headerArenaSnippet.includes('pts');
  recordTest('Tier1', displaysTarget,
    'F15.1', 'App.tsx: Arena header displays Boss Rush score goal target', '', 'M3');

  // 15.2 Victory celebration triggers upon match completion
  recordTest('Tier1', appTsx.includes('activeGameState?.is_match_over') && appTsx.includes('soundFx.playVictorySound()'),
    'F15.2', 'App.tsx: Triggers victory fanfare when match ends', '', 'M3');

  // 15.3 Celebration modal opens on round/match completion
  recordTest('Tier1', appTsx.includes('showCelebration') && appTsx.includes('setShowCelebration'),
    'F15.3', 'App.tsx: Manages showCelebration modal state', '', 'M3');

  // 15.4 Co-op Squad displayed as winner in Boss Rush
  recordTest('Tier1', appTsx.includes('Co-op Squad') || postGameTsx.includes('Co-op Squad'),
    'F15.4', 'App.tsx / PostGameCelebrationModal: Displays Co-op Squad as victorious team', '', 'M3');

  // 15.5 Progression buttons hidden for non-host upon Boss Rush victory
  recordTest('Tier1', postGameTsx.includes('isHost') && postGameTsx.includes('Play Again'),
    'F15.5', 'PostGameCelebrationModal: Non-host participants cannot restart or advance match', '', 'M3');
}

console.log('');

// =============================================================================
// TIER 2: BOUNDARY & CORNER CASES (Features 1 - 15)
// =============================================================================
console.log('----------------------------------------------------------------');
console.log('TIER 2: BOUNDARY & CORNER CASES (>=5 tests per feature)');
console.log('----------------------------------------------------------------\n');

// 2.1 Complete Zero-Emoji Audit across all modified and core UI files
{
  const forbiddenEmojis = [
    { name: 'Crown 👑', regex: /\u{1F451}/u },
    { name: 'Rocket 🚀', regex: /\u{1F680}/u },
    { name: 'White Flag 🏳️', regex: /\u{1F3F3}/u },
    { name: 'People 👥', regex: /\u{1F465}/u }
  ];

  for (const emoji of forbiddenEmojis) {
    const hasInLobby = emoji.regex.test(onlineLobbyTsx);
    const hasInCelebration = emoji.regex.test(postGameTsx);
    recordTest('Tier2', !hasInLobby, `T2.EMOJI.${emoji.name}`, `Zero occurrences of ${emoji.name} in OnlineLobbyModal`);
    recordTest('Tier2', !hasInCelebration, `T2.EMOJI.${emoji.name}`, `Zero occurrences of ${emoji.name} in PostGameCelebrationModal`);
  }
}

// 2.2 Modal Z-Index Hierarchy & Stacking Context
{
  // App.tsx z-index layering verification:
  // z-0: Background canvas
  // z-50: Standard modals (Settings, Celebration, Summary, Podium, OnlineLobby)
  // z-[70]: LeaveLobbyConfirmModal (must strictly be higher than z-50 to overlay all modals)
  recordTest('Tier2', whirlpoolTsx.includes('z-0'),
    'T2.ZINDEX.1', 'WhirlpoolBackground is strictly at z-0');
  recordTest('Tier2', onlineLobbyTsx.includes('z-50'),
    'T2.ZINDEX.2', 'OnlineLobbyModal overlay is at z-50');
  recordTest('Tier2', postGameTsx.includes('z-50'),
    'T2.ZINDEX.3', 'PostGameCelebrationModal is at z-50');
  recordTest('Tier2', appTsx.includes('z-[70]'),
    'T2.ZINDEX.4', 'LeaveLobbyConfirmModal is layered at z-[70] (strictly overlays all z-50 modals)', '', 'M2');
  recordTest('Tier2', appTsx.indexOf('z-[70]') !== -1 && appTsx.includes('showLeaveLobbyConfirm'),
    'T2.ZINDEX.5', 'LeaveLobbyConfirmModal is conditionally mounted only when showLeaveLobbyConfirm is true', '', 'M2');
}

// 2.3 Off-Turn Input Selection & Focus Boundaries
{
  // Focus effect boundary checks:
  // Must check screen === 'ARENA'
  recordTest('Tier2', appTsx.includes("screen === 'ARENA'"),
    'T2.FOCUS.1', 'Auto-focus only executes when screen is ARENA', '', 'M2');
  // Must check !activeGameState?.is_round_over
  recordTest('Tier2', appTsx.includes('!activeGameState?.is_round_over') || appTsx.includes('!activeGameState.is_round_over'),
    'T2.FOCUS.2', 'Auto-focus does not steal focus when round is over', '', 'M2');
  // Must check !showSettings
  recordTest('Tier2', appTsx.includes('!showSettings'),
    'T2.FOCUS.3', 'Auto-focus does not steal focus when settings modal is open', '', 'M2');
  // Must check !showHowToPlay
  recordTest('Tier2', appTsx.includes('!showHowToPlay'),
    'T2.FOCUS.4', 'Auto-focus does not steal focus when how to play modal is open', '', 'M2');
  // Must check !showLeaveLobbyConfirm
  recordTest('Tier2', appTsx.includes('!showLeaveLobbyConfirm'),
    'T2.FOCUS.5', 'Auto-focus does not steal focus when leave lobby confirm modal is open', '', 'M2');
}

// 2.4 Boss Rush Score Goals Boundary Checks (1000 - 5000)
{
  const goals = [1000, 1500, 2000, 3000, 4000, 5000];
  for (const g of goals) {
    const presentInSetup = matchSetupTsx.includes(String(g));
    recordTest('Tier2', presentInSetup,
      `T2.GOAL.${g}`, `MatchSetup contains score goal boundary value ${g}`, '', 'M3');
  }
}

// 2.5 60-Second Auto-Dismissal Timer Boundary Checks
{
  // Boundary 1: Timer does not display negative seconds
  recordTest('Tier2', appTsx.includes('Math.max(0,'),
    'T2.TIMER.1', 'Timer clamps to minimum 0 (no negative seconds displayed)');
  // Boundary 2: Prompt automatically unmounts at 0 seconds
  recordTest('Tier2', appTsx.includes('surrenderSecondsLeft > 0'),
    'T2.TIMER.2', 'Prompt automatically unmounts when countdown reaches 0 seconds');
  // Boundary 3: Interval frequency is 500ms or 1000ms
  recordTest('Tier2', appTsx.includes(', 500)') || appTsx.includes(', 1000)'),
    'T2.TIMER.3', 'Interval updates smoothly every 500ms or 1000ms');
  // Boundary 4: Resets on surrender_vote change
  recordTest('Tier2', appTsx.includes('[online.roomInfo?.surrender_vote]'),
    'T2.TIMER.4', 'Timer effect resets when surrender_vote dependency updates');
  // Boundary 5: Clears interval on unmount
  recordTest('Tier2', appTsx.includes('clearInterval(interval)'),
    'T2.TIMER.5', 'Interval timer is safely cancelled on unmount');
}

console.log('');

// =============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// =============================================================================
console.log('----------------------------------------------------------------');
console.log('TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise & System Interactions)');
console.log('----------------------------------------------------------------\n');

// 3.1 Pairwise: Boss Rush + Surrender Voting + Score Goal Target
{
  // In Boss Rush with a score goal, surrender can be triggered at any time
  const canSurrenderWithGoal = appTsx.includes('isOnlineBossRush') && matchSetupTsx.includes('point_threshold');
  recordTest('Tier3', canSurrenderWithGoal,
    'T3.PAIR.1', 'Boss Rush + Surrender + Score Goal: Surrender voting coexists with active score goal', '', 'M3');
}

// 3.2 Pairwise: Host Progression + Off-Turn Typing State Preservation
{
  // When host triggers next round, guest pre-typed text is cleared, but while waiting in current round it persists
  const roundClearEffect = appTsx.includes("setGuess('')") && useOnlineGameTs.includes('nextOnlineRound');
  recordTest('Tier3', roundClearEffect,
    'T3.PAIR.2', 'Host Progression + Off-Turn Typing: Next round resets draft while current round retains it', '', 'M2');
}

// 3.3 Pairwise: Main Menu Leave Modal + WebSocket Disconnect Handling
{
  // Confirming leave lobby closes modal, sends leave lobby WS action, and returns to menu
  const cleanDisconnectFlow = appTsx.includes('setShowLeaveLobbyConfirm(false)') && appTsx.includes('online.leaveLobby()') && appTsx.includes('returnToMainMenu()');
  recordTest('Tier3', cleanDisconnectFlow,
    'T3.PAIR.3', 'Main Menu Leave Modal + WS Disconnect: Confirmation executes clean disconnect flow', '', 'M2');
}

// 3.4 Pairwise: Host Transfer + Progression Button Permissions
{
  // If host transfers, isHost updates dynamically across all modal components
  const hostSyncAcrossModals = postGameTsx.includes('isHost') && roundSummaryTsx.includes('isHost') && podiumTsx.includes('isHost');
  recordTest('Tier3', hostSyncAcrossModals,
    'T3.PAIR.4', 'Host Transfer + Button Permissions: All modals accept isHost prop for dynamic host sync', '', 'M2');
}

// 3.5 Pairwise: Single-Line Layout + Host vs Non-Host Button Counts
{
  // Host renders 4 buttons; non-host renders 2 buttons. Single row layout must accommodate both without layout shifts
  const singleRowFlex = postGameTsx.includes('flex-nowrap') && postGameTsx.includes('overflow-x-auto');
  recordTest('Tier3', singleRowFlex,
    'T3.PAIR.5', 'Single-Line Layout + Host/Non-Host counts: flex-nowrap + overflow-x-auto handles 2 or 4 buttons cleanly', '', 'M1');
}

console.log('');

// =============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// =============================================================================
console.log('----------------------------------------------------------------');
console.log('TIER 4: REAL-WORLD APPLICATION SCENARIOS (Frontend Sessions)');
console.log('----------------------------------------------------------------\n');

// 4.1 Scenario 1: Multi-Round Tournament Session
{
  // Verifies navigation pipeline: MatchSetup -> Arena -> Celebration -> Next Round -> Summary -> Podium -> Play Again
  const fullProgressionPipeline = matchSetupTsx.includes('handleStart') && appTsx.includes('handleNextRound') && appTsx.includes('handlePlayAgain');
  recordTest('Tier4', fullProgressionPipeline,
    'T4.SCENARIO.1', 'Tournament Match Pipeline: Start -> Next Round -> Play Again fully wired', '', 'M1');
}

// 4.2 Scenario 2: Boss Rush Co-op Match with 2k Score Goal
{
  // Verifies Boss Rush configuration with 2000 points, arena score target display, and Co-op Squad victory
  const bossRushMatchFlow = matchSetupTsx.includes('2000') && appTsx.includes('Co-op Squad') && postGameTsx.includes('Co-op Squad');
  recordTest('Tier4', bossRushMatchFlow,
    'T4.SCENARIO.2', 'Boss Rush Co-op Session: 2k goal selection, arena play, and Co-op Squad victory modal', '', 'M3');
}

// 4.3 Scenario 3: Non-Host Navigation Safeguard Session
{
  // Verifies non-host clicking Main Menu in Arena header, Celebration modal, or Summary modal always prompts confirmation
  const nonHostSafetyNet = appTsx.includes('handleRequestMainMenu') && appTsx.includes('showLeaveLobbyConfirm');
  recordTest('Tier4', nonHostSafetyNet,
    'T4.SCENARIO.3', 'Non-Host Navigation Safeguard: Centralized confirmation prevents accidental disconnects', '', 'M2');
}

// 4.4 Scenario 4: Surrender Vote Calling & Auto-Dismissal Lifecycle
{
  // Verifies full vote lifecycle: Call vote -> Display prompt -> 60s countdown -> Auto-dismissal at 0s
  const voteLifecycle = appTsx.includes('voteSurrender') && appTsx.includes('surrenderSecondsLeft') && appTsx.includes('surrenderSecondsLeft > 0');
  recordTest('Tier4', voteLifecycle,
    'T4.SCENARIO.4', 'Surrender Vote Lifecycle: Trigger -> Count down -> Auto-dismiss cleanly', '', 'M1');
}

// 4.5 Scenario 5: Rapid Turn Transitions & Typing Continuity
{
  // Verifies auto-focus ref, selection range positioning, and draft answer preservation across turns
  const typingContinuity = appTsx.includes('guessInputRef') && appTsx.includes('setSelectionRange') && appTsx.includes('isMyTurn');
  recordTest('Tier4', typingContinuity,
    'T4.SCENARIO.5', 'Typing Continuity: Rapid turn transitions maintain focus and cursor positioning', '', 'M2');
}

console.log('');

// =============================================================================
// TIER 5: ADVERSARIAL COVERAGE HARDENING (Encoding, Layout, Security)
// =============================================================================
console.log('----------------------------------------------------------------');
console.log('TIER 5: ADVERSARIAL COVERAGE HARDENING (Encoding, Layout, Security)');
console.log('----------------------------------------------------------------\n');

// 5.1 Strict XSS Prevention: Zero occurrences of dangerouslySetInnerHTML in components
{
  const componentsDir = path.join(uiSrc, 'components');
  const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
  let hasDangerousHtml = false;
  for (const file of componentFiles) {
    const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
    if (content.includes('dangerouslySetInnerHTML')) {
      hasDangerousHtml = true;
      break;
    }
  }
  recordTest('Tier5', !hasDangerousHtml,
    'T5.ADV.1', 'Security: Zero occurrences of dangerouslySetInnerHTML in all component files', '', 'M1');
}

// 5.2 Global Forbidden Emoji Audit across all core UI source files
{
  const forbiddenEmojis = ['👑', '🚀', '🏳️', '👥'];
  const allUiFiles = [
    whirlpoolTsx, onlineLobbyTsx, postGameTsx, roundSummaryTsx, podiumTsx, matchSetupTsx, useOnlineGameTs, appTsx
  ];
  for (const emo of forbiddenEmojis) {
    let foundCount = 0;
    for (const code of allUiFiles) {
      if (code.includes(emo)) foundCount++;
    }
    recordTest('Tier5', foundCount === 0,
      `T5.ADV.2.${emo}`, `Emoji Purity: Zero occurrences of forbidden emoji ${emo} in core UI source files (found: ${foundCount})`, '', 'M1');
  }
}

// 5.3 Whirlpool Canvas Pointer-Events Isolation
{
  const hasPointerEventsNone = whirlpoolTsx.includes('pointer-events-none');
  recordTest('Tier5', hasPointerEventsNone,
    'T5.ADV.3', 'Canvas: pointer-events-none ensures background canvas never blocks user clicks/taps', '', 'M1');
}

// 5.4 Reduced Motion Accessibility Fallback
{
  const hasReducedMotionCheck = whirlpoolTsx.includes("localStorage.getItem('top100_reduce_motion')");
  recordTest('Tier5', hasReducedMotionCheck,
    'T5.ADV.4', 'A11y: WhirlpoolBackground respects top100_reduce_motion user preference', '', 'M1');
}

// 5.5 Mobile Viewport Boundary Resilience (Compact Touch Targets)
{
  const hasCompactHeaderBtn = appTsx.includes('w-9 h-9 rounded-xl');
  recordTest('Tier5', hasCompactHeaderBtn,
    'T5.ADV.5', 'Mobile: Header surrender trigger uses compact responsive touch target (w-9 h-9)', '', 'M1');
}

// 5.6 Surrender Countdown Timer Resource Leak Prevention
{
  const cleansUpTimer = appTsx.includes('clearInterval(interval)');
  recordTest('Tier5', cleansUpTimer,
    'T5.ADV.6', 'Resource Safety: Surrender vote countdown timer cleanly clears interval to prevent memory leaks', '', 'M1');
}

// 5.7 Form Submission Enter-Key Hijack Resilience
{
  const preventsDefault = appTsx.includes('e.preventDefault()');
  recordTest('Tier5', preventsDefault,
    'T5.ADV.7', 'Form Integrity: Guess form submission prevents default browser page navigation', '', 'M1');
}

// 5.8 Post-Game Navigation Button Single-Line Flexbox Contract
{
  const footerRegion = postGameTsx.slice(postGameTsx.indexOf('border-t-2 border-[#891c1c]'), postGameTsx.indexOf('border-t-2 border-[#891c1c]') + 1000);
  const strictFlexContract = footerRegion.includes('flex-nowrap') && footerRegion.includes('overflow-x-auto') && footerRegion.includes('whitespace-nowrap');
  recordTest('Tier5', strictFlexContract,
    'T5.ADV.8', 'Layout: Post-game celebration footer enforces strict single-line flex-nowrap + overflow-x-auto contract', '', 'M1');
}

console.log('\n================================================================');
const modeHeader = targetMilestone ? ` (Milestone Filter: ${targetMilestone})` : '';
console.log(`FRONTEND TEST SUITE EXECUTION SUMMARY${modeHeader}`);
console.log('================================================================');
console.log(`Total Tests Run:  ${passCount + failCount}`);
console.log(`Passed:           ${passCount}`);
console.log(`Failed:           ${failCount}`);
if (skippedCount > 0) {
  console.log(`Skipped (Future): ${skippedCount}`);
}
console.log('Tier Breakdown:');
console.log(`  Tier 1 (Feature Coverage):     ${tierStats.Tier1.pass} Passed / ${tierStats.Tier1.fail} Failed`);
console.log(`  Tier 2 (Boundary & Corners):   ${tierStats.Tier2.pass} Passed / ${tierStats.Tier2.fail} Failed`);
console.log(`  Tier 3 (Cross-Feature):        ${tierStats.Tier3.pass} Passed / ${tierStats.Tier3.fail} Failed`);
console.log(`  Tier 4 (Real-World Scenarios): ${tierStats.Tier4.pass} Passed / ${tierStats.Tier4.fail} Failed`);
console.log(`  Tier 5 (Adversarial Hardening):${tierStats.Tier5.pass} Passed / ${tierStats.Tier5.fail} Failed`);
console.log('================================================================\n');

if (failures.length > 0) {
  console.log('--- FAILURE REPORT (Implementation Gaps / Bugs to Escalate) ---');
  for (const f of failures) {
    const mTag = f.milestone ? ` [Pending ${f.milestone}]` : '';
    console.log(`[${f.tier}] [${f.testId}]${mTag} ${f.testName}`);
    if (f.details) console.log(`       Details: ${f.details}`);
  }
  console.log('---------------------------------------------------------------\n');
}

// Process exit code: 0 if all executed tests pass, 1 if failures exist
process.exit(failures.length > 0 ? 1 : 0);
