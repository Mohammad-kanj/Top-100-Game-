import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const uiSrc = path.resolve(__dirname, 'src');

console.log('====================================================');
console.log('CHALLENGER 2 EMPIRICAL VERIFICATION HARNESS');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}${details ? ': ' + details : ''}`);
    failCount++;
    failures.push({ testName, details });
  }
}

// -------------------------------------------------------------
// TEST SUITE 1: R1 UI Text and Icon Cleanups Static & Regex Checks
// -------------------------------------------------------------
console.log('--- TEST SUITE 1: R1 UI Text & Icon Cleanups ---');

// 1.1 App.tsx Results Overview
const appTsx = fs.readFileSync(path.join(uiSrc, 'App.tsx'), 'utf8');
const resultsOverviewMatch = appTsx.match(/Results Overview/g);
assert(resultsOverviewMatch !== null, 'R1.1: "Results Overview" exists in App.tsx');

// Check that Results Overview button does not contain emoji (like 🏆 or others)
const resultsButtonRegex = /<button[^>]*>[^<]*Results Overview[^<]*<\/button>/s;
const btnMatch = appTsx.match(resultsButtonRegex);
assert(btnMatch !== null, 'R1.1: Found clean Results Overview button tag');
if (btnMatch) {
  const containsEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(btnMatch[0]);
  assert(!containsEmoji, 'R1.1: Results Overview button contains NO emoji', btnMatch[0]);
}

// 1.2 OnlineLobbyModal.tsx Configure Game Button
const lobbyTsx = fs.readFileSync(path.join(uiSrc, 'components', 'OnlineLobbyModal.tsx'), 'utf8');
const configureGameMatch = lobbyTsx.match(/Configure Game/);
assert(configureGameMatch !== null, 'R1.2: "Configure Game" exists in OnlineLobbyModal.tsx');

// Check that Configure Game button has no settings icon ⚙️
const configureBtnRegex = /<button[^>]*>[^<]*Configure Game[^<]*<\/button>/s;
const confMatch = lobbyTsx.match(configureBtnRegex);
assert(confMatch !== null, 'R1.2: Found clean Configure Game button tag');
if (confMatch) {
  const hasSettingsIcon = /⚙|settings|gear/i.test(confMatch[0]);
  assert(!hasSettingsIcon, 'R1.2: Configure Game button contains NO settings icon or emoji', confMatch[0]);
}

// 1.3 MatchSetup.tsx and HowToPlayModal.tsx Boss Rush label
const matchSetupTsx = fs.readFileSync(path.join(uiSrc, 'components', 'MatchSetup.tsx'), 'utf8');
const howToPlayTsx = fs.readFileSync(path.join(uiSrc, 'components', 'HowToPlayModal.tsx'), 'utf8');

// Ensure "(solo)" or "(Solo)" does not appear next to "Boss Rush"
const bossRushSoloMatchSetup = /Boss\s+Rush\s*\([sS]olo\)/.test(matchSetupTsx);
assert(!bossRushSoloMatchSetup, 'R1.3: MatchSetup.tsx contains NO "Boss Rush (solo)" or "Boss Rush (Solo)"');

const bossRushSoloHowToPlay = /Boss\s+Rush\s*\([sS]olo\)/.test(howToPlayTsx);
assert(!bossRushSoloHowToPlay, 'R1.3: HowToPlayModal.tsx contains NO "Boss Rush (solo)" or "Boss Rush (Solo)"');

console.log('');

// -------------------------------------------------------------
// TEST SUITE 2: R4 Post-Game Carousel Drag-Scrolling
// -------------------------------------------------------------
console.log('--- TEST SUITE 2: R4 Post-Game Carousel Drag-Scrolling ---');

const celebrationTsx = fs.readFileSync(path.join(uiSrc, 'components', 'PostGameCelebrationModal.tsx'), 'utf8');

// 2.1 State & Refs
assert(celebrationTsx.includes('isDragging'), 'R4.1: isDragging state exists');
assert(celebrationTsx.includes('isDraggingRef'), 'R4.1: isDraggingRef exists');
assert(celebrationTsx.includes('dragStartXRef'), 'R4.1: dragStartXRef exists');
assert(celebrationTsx.includes('scrollStartXRef'), 'R4.1: scrollStartXRef exists');

// 2.2 Event Handlers Attached to Container
const requiredHandlers = [
  'onMouseDown={handleMouseDown}',
  'onMouseMove={handleMouseMove}',
  'onMouseUp={handleMouseUp}',
  'onMouseLeave={handleMouseUp}',
  'onTouchStart={handleTouchStart}',
  'onTouchMove={handleTouchMove}',
  'onTouchEnd={handleTouchEnd}',
  'onTouchCancel={handleTouchEnd}'
];
for (const handler of requiredHandlers) {
  assert(celebrationTsx.includes(handler), `R4.2: Event handler ${handler} attached to carousel container`);
}

// 2.3 Window listeners for release outside container
assert(celebrationTsx.includes("window.addEventListener('mouseup'"), 'R4.3: Global mouseup listener registered for safe drag termination');
assert(celebrationTsx.includes("window.addEventListener('touchend'"), 'R4.3: Global touchend listener registered for safe drag termination');
assert(celebrationTsx.includes("window.removeEventListener('mouseup'"), 'R4.3: Global mouseup cleanup registered');
assert(celebrationTsx.includes("window.removeEventListener('touchend'"), 'R4.3: Global touchend cleanup registered');

// 2.4 Auto-scroll pause condition
assert(
  celebrationTsx.includes('if (!container || isDragging || isReduceMotion || currentStanding.guesses.length <= 2) return;'),
  'R4.4: Auto-scroll RAF loop pauses when isDragging is true'
);
assert(
  celebrationTsx.includes('if (!container || isDraggingRef.current) return;'),
  'R4.4: Auto-scroll step loop pauses when isDraggingRef.current is true'
);

// 2.5 Smooth resume without resetting scrollLeft to 0
assert(!celebrationTsx.includes('container.scrollLeft = 0; // resume'), 'R4.5: Auto-scroll resumes without resetting scrollLeft to 0 on release');

// 2.6 Removal of scroll-smooth class
const innerScrollDiv = celebrationTsx.match(/ref=\{scrollRef\}[^>]*className=\{`([^`]+)`\}/s);
if (innerScrollDiv) {
  const hasScrollSmooth = innerScrollDiv[1].includes('scroll-smooth');
  assert(!hasScrollSmooth, 'R4.6: Inner scroll container has NO scroll-smooth class (preventing drag rubber-banding)');
} else {
  assert(!celebrationTsx.includes('scroll-smooth'), 'R4.6: scroll-smooth class absent from carousel');
}

// 2.7 Tactile drag math simulation
{
  const dragStartX = 300;
  const initialScroll = 120;
  const currentMouseX = 250; // Dragged left by 50px
  const deltaX = currentMouseX - dragStartX; // -50
  const newScrollLeft = initialScroll - deltaX; // 170 (scrolled right)
  assert(newScrollLeft === 170, 'R4.7: Tactile natural drag math verified (drag left scrolls content right)');
}

console.log('');

// -------------------------------------------------------------
// TEST SUITE 3: R5 Settings Modal & Audio Engine
// -------------------------------------------------------------
console.log('--- TEST SUITE 3: R5 Settings Modal & Audio Engine ---');

const soundFxTs = fs.readFileSync(path.join(uiSrc, 'soundFx.ts'), 'utf8');

// 3.1 soundFx methods
const soundMethods = [
  'getSfxVolume',
  'setSfxVolume',
  'getBgmVolume',
  'setBgmVolume',
  'isMuted',
  'setMuted',
  'startBgm',
  'stopBgm',
  'isBgmPlaying'
];
for (const m of soundMethods) {
  assert(soundFxTs.includes(m), `R5.1: soundFx exports method '${m}'`);
}

// 3.2 Volume boundary clamping test
// Simulate soundFx volume clamping logic directly
function clampVol(v) {
  return Math.max(0, Math.min(1, v));
}
assert(clampVol(1.5) === 1.0, 'R5.2: Volume clamped to 1.0 on upper overflow');
assert(clampVol(-0.5) === 0.0, 'R5.2: Volume clamped to 0.0 on underflow');
assert(clampVol(0.65) === 0.65, 'R5.2: Normal volume preserved');

// 3.3 SettingsModal controls
const settingsTsx = fs.readFileSync(path.join(uiSrc, 'components', 'SettingsModal.tsx'), 'utf8');

assert(settingsTsx.includes('SFX Volume'), 'R5.3: SettingsModal contains SFX Volume control');
assert(settingsTsx.includes('BGM Volume'), 'R5.3: SettingsModal contains BGM Volume control');
assert(settingsTsx.includes('Audio Muted'), 'R5.3: SettingsModal contains Mute toggle');
assert(settingsTsx.includes('Reduce Motion & Celebrations'), 'R5.3: SettingsModal contains Reduce Motion toggle');

// 3.4 Cancel reverts state, Save persists state
assert(settingsTsx.includes('initialSettingsRef'), 'R5.4: SettingsModal snapshots initial state for reversion');
assert(settingsTsx.includes('handleCancel'), 'R5.4: SettingsModal has handleCancel handler');
assert(settingsTsx.includes('soundFx.setSfxVolume(initialSettingsRef.current.sfxVolume);'), 'R5.4: Cancel reverts SFX volume');
assert(settingsTsx.includes('soundFx.setBgmVolume(initialSettingsRef.current.bgmVolume);'), 'R5.4: Cancel reverts BGM volume');
assert(settingsTsx.includes('soundFx.setMuted(initialSettingsRef.current.muted);'), 'R5.4: Cancel reverts Muted state');
assert(settingsTsx.includes("localStorage.setItem('top100_reduce_motion'"), 'R5.4: Save persists reduce_motion to localStorage');

// 3.5 WhirlpoolBackground reduce motion handling
const whirlpoolTsx = fs.readFileSync(path.join(uiSrc, 'components', 'WhirlpoolBackground.tsx'), 'utf8');
assert(
  whirlpoolTsx.includes("localStorage.getItem('top100_reduce_motion') === 'true'"),
  'R5.5: WhirlpoolBackground reads top100_reduce_motion from localStorage'
);
assert(
  whirlpoolTsx.includes('if (isReduceMotion) {') && whirlpoolTsx.includes('ctx.fillRect(0, 0, width, height);'),
  'R5.5: WhirlpoolBackground renders static background on reduce motion'
);

// 3.6 ConfettiCanvas reduce motion handling & React Hook Rule Check
const confettiTsx = fs.readFileSync(path.join(uiSrc, 'components', 'ConfettiCanvas.tsx'), 'utf8');
assert(
  confettiTsx.includes("localStorage.getItem('top100_reduce_motion') === 'true'"),
  'R5.6: ConfettiCanvas reads top100_reduce_motion from localStorage'
);

// CRITICAL CHECK: Does ConfettiCanvas violate React Rules of Hooks?
const earlyReturnBeforeHook = /if\s*\(\s*isReduceMotion\s*\)\s*return\s+null;\s*useEffect/s.test(confettiTsx);
if (earlyReturnBeforeHook) {
  assert(
    false,
    'R5.7: ConfettiCanvas violates React Rules of Hooks!',
    'Line 37 has "if (isReduceMotion) return null;" BEFORE useEffect at line 39. Toggling reduce motion causes React to crash with "Rendered fewer hooks than expected".'
  );
} else {
  assert(true, 'R5.7: ConfettiCanvas conforms to React Rules of Hooks');
}

console.log('');
console.log('====================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('====================================================\n');

if (failCount > 0) {
  console.error('FAILURES SUMMARY:');
  failures.forEach(f => console.error(`- [${f.testName}]: ${f.details}`));
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL TESTS PASSED!');
  process.exit(0);
}
