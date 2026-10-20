/**
 * Periodic Table Arena — Interactive Drag & Drop Chemistry Lab Engine
 * Supports:
 *   1. Live Check Mode (Instant Sahi / Galat feedback, combo streaks, smart hints)
 *   2. Exam Sheet Mode (Free fill, cell-to-cell drag/swap, batch Sahi/Galat check)
 *   3. Study Reference Mode (Full 118 table, live Kelvin/Celsius phase simulator, Bohr atom modal)
 *   + Desktop HTML5 Drag & Drop, Touch Drag Ghost, Click-to-Place, & Quick Slot Keyboard Entry
 */
(function () {
  'use strict';

  const { ELEMENTS, CATEGORIES } = window.PERIODIC_DATA;
  const Sound = window.SoundFX;

  // Lookup maps
  const BY_Z = new Map();
  const BY_SYMBOL = new Map();
  const BY_NAME = new Map();

  ELEMENTS.forEach((el) => {
    BY_Z.set(el.z, el);
    BY_SYMBOL.set(el.symbol.toLowerCase(), el);
    BY_NAME.set(el.name.toLowerCase(), el);
  });

  // Group Roman/CAS labels for hover tooltips
  const GROUP_SUBLABELS = {
    1: 'IA', 2: 'IIA', 3: 'IIIB', 4: 'IVB', 5: 'VB', 6: 'VIB', 7: 'VIIB',
    8: 'VIIIB', 9: 'VIIIB', 10: 'VIIIB', 11: 'IB', 12: 'IIB',
    13: 'IIIA', 14: 'IVA', 15: 'VA', 16: 'VIA', 17: 'VIIA', 18: 'VIIIA'
  };

  // Application State
  const state = {
    mode: 'live',          // 'live' | 'exam' | 'study'
    scope: 'all',          // 'all' | 'first20' | 'first36' | 'sp' | 'd' | 'f'
    boardClue: 'blank',    // 'blank' | 'numbers' | 'categories'
    tileClue: 'both',      // 'both' | 'symbol' | 'name' | 'config'
    deckMode: 'all',       // 'all' | 'wave'
    searchQuery: '',
    activeCategory: null,  // category filter id or null
    studyBlock: 'all',     // 'all' | 's' | 'p' | 'd' | 'f'
    studyTempK: 298,

    trayOrder: [],
    solvedSet: new Set(),
    examPlacements: new Map(), // slotZ -> placedElementZ
    examWrongSlots: new Set(), // slotZ values checked and found wrong

    selectedTileZ: null,       // selected from tray for click-to-place
    selectedSlotZ: null,       // clicked blank cell for quick input
    hintTargetZ: null,
    lastInspectedZ: 1,

    wrongAttemptsPerZ: new Map(),
    mistakes: [],
    score: 0,
    wrongCount: 0,
    streak: 0,
    elapsedSec: 0,
    timerRunning: false,
    timerId: null
  };

  // DOM References
  const dom = {
    grid: document.getElementById('periodicGrid'),
    trayDock: document.getElementById('trayDock'),
    trayTiles: document.getElementById('trayTiles'),
    traySearch: document.getElementById('traySearch'),
    remainingCount: document.getElementById('remainingCount'),
    selectedTileBanner: document.getElementById('selectedTileBanner'),

    statCorrect: document.getElementById('statCorrect'),
    statWrong: document.getElementById('statWrong'),
    statStreak: document.getElementById('statStreak'),
    statScore: document.getElementById('statScore'),
    statTimer: document.getElementById('statTimer'),

    playControls: document.getElementById('playControls'),
    studyControls: document.getElementById('studyControls'),
    scopeSelect: document.getElementById('scopeSelect'),
    boardClueSelect: document.getElementById('boardClueSelect'),
    tileClueSelect: document.getElementById('tileClueSelect'),

    tempSlider: document.getElementById('tempSlider'),
    tempReadout: document.getElementById('tempReadout'),
    btnResetTemp: document.getElementById('btnResetTemp'),

    feedbackBanner: document.getElementById('feedbackBanner'),
    feedbackBadge: document.getElementById('feedbackBadge'),
    feedbackText: document.getElementById('feedbackText'),
    btnFeedbackInspect: document.getElementById('btnFeedbackInspect'),

    btnCheckExam: document.getElementById('btnCheckExam'),
    unverifiedCount: document.getElementById('unverifiedCount'),
    btnHint: document.getElementById('btnHint'),
    btnReset: document.getElementById('btnReset'),
    btnSound: document.getElementById('btnSound'),
    btnTheme: document.getElementById('btnTheme'),
    btnMistakes: document.getElementById('btnMistakes'),
    btnDeckAll: document.getElementById('btnDeckAll'),
    btnDeckWave: document.getElementById('btnDeckWave'),
    btnShuffle: document.getElementById('btnShuffle'),

    slotQuickModal: document.getElementById('slotQuickModal'),
    slotQuickForm: document.getElementById('slotQuickForm'),
    slotQuickTitle: document.getElementById('slotQuickTitle'),
    slotQuickField: document.getElementById('slotQuickField'),
    btnCloseQuick: document.getElementById('btnCloseQuick'),

    inspectorBackdrop: document.getElementById('inspectorBackdrop'),
    btnCloseInspector: document.getElementById('btnCloseInspector'),
    mistakesBackdrop: document.getElementById('mistakesBackdrop'),
    mistakesList: document.getElementById('mistakesList'),
    btnCloseMistakes: document.getElementById('btnCloseMistakes'),
    winBackdrop: document.getElementById('winBackdrop'),
    btnCloseWin: document.getElementById('btnCloseWin'),
    btnPlayAgain: document.getElementById('btnPlayAgain'),
    btnExploreAfterWin: document.getElementById('btnExploreAfterWin')
  };

  // Cell & Axis lookup maps
  const cellElements = new Map(); // z -> HTMLElement
  const groupHeaders = new Map(); // group (1..18) -> HTMLElement
  const periodHeaders = new Map(); // gridRow -> HTMLElement
  let progressLabelEl = null;
  let progressFillEl = null;
  let hoverCoordEl = null;

  // Current drag payload tracking
  let dragPayload = null; // { z: number, fromSlotZ: number | null }

  /* ========================================================================
     Scope, Position Helpers & Smart Chemistry Hints
     ======================================================================== */

  function isElementInScope(el, scope = state.scope) {
    switch (scope) {
      case 'first20':
        return el.z <= 20;
      case 'first36':
        return el.z <= 36;
      case 'sp':
        return el.block === 's' || el.block === 'p';
      case 'd':
        return el.block === 'd' && el.gridRow <= 7;
      case 'f':
        return el.category === 'lanthanide' || el.category === 'actinide';
      case 'all':
      default:
        return true;
    }
  }

  function getTargetElements() {
    return ELEMENTS.filter((el) => isElementInScope(el));
  }

  function positionLabel(el) {
    if (el.category === 'lanthanide') {
      return `6* Lanthanide Row (Slot #${el.z - 56} of 15, Z=${el.z})`;
    }
    if (el.category === 'actinide') {
      return `7* Actinide Row (Slot #${el.z - 88} of 15, Z=${el.z})`;
    }
    return `Period ${el.period}, Group ${el.group}`;
  }

  function slotCoordinateShort(el) {
    if (el.category === 'lanthanide') return `6* · L${el.z - 56}`;
    if (el.category === 'actinide') return `7* · A${el.z - 88}`;
    return `P${el.period} · G${el.group}`;
  }

  function buildSmartHint(el, wrongCountForEl) {
    if (wrongCountForEl >= 3) {
      return `Exact spot: ${positionLabel(el)} (${el.categoryLabel}, Z=${el.z}).`;
    }
    if (wrongCountForEl === 2) {
      if (el.category === 'lanthanide') {
        return `Closer clue: ${el.symbol} is #${el.z - 56} in the 6* Lanthanide row (Z=${el.z})!`;
      }
      if (el.category === 'actinide') {
        return `Closer clue: ${el.symbol} is #${el.z - 88} in the 7* Actinide row (Z=${el.z})!`;
      }
      return `Closer clue: ${el.symbol} (Z=${el.z}) sits in Period ${el.period} inside the ${el.block}-block!`;
    }
    if (el.category === 'lanthanide') {
      return `${el.symbol} (Z=${el.z}) is a Lanthanide — look in the 6* f-block row below!`;
    }
    if (el.category === 'actinide') {
      return `${el.symbol} (Z=${el.z}) is an Actinide — look in the 7* f-block row below!`;
    }
    return `${el.symbol} has Atomic Number Z=${el.z} (${el.categoryLabel}, ${el.block}-block).`;
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /* ========================================================================
     Timer & Top Scoreboard Updates
     ======================================================================== */

  function ensureTimerStarted() {
    if (state.timerRunning || state.mode === 'study') return;
    state.timerRunning = true;
    state.timerId = setInterval(() => {
      state.elapsedSec += 1;
      renderTimer();
    }, 1000);
  }

  function stopTimer() {
    state.timerRunning = false;
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function formatDuration(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderTimer() {
    dom.statTimer.textContent = formatDuration(state.elapsedSec);
  }

  function updateStatsUI() {
    const targets = getTargetElements();
    const total = targets.length;
    let solvedInScope = 0;
    targets.forEach((el) => {
      if (state.solvedSet.has(el.z)) solvedInScope += 1;
    });

    dom.statCorrect.textContent = `${solvedInScope}/${total}`;
    dom.statWrong.textContent = String(state.wrongCount);
    dom.statStreak.textContent = String(state.streak);
    dom.statScore.textContent = String(state.score);
    renderTimer();

    const pct = total > 0 ? Math.round((solvedInScope / total) * 100) : 0;
    if (progressLabelEl) {
      progressLabelEl.textContent =
        state.mode === 'study'
          ? 'Interactive Reference · Click any element to inspect Bohr shells'
          : `Mastery Progress: ${solvedInScope} / ${total} Sahi (${pct}%)`;
    }
    if (progressFillEl) {
      progressFillEl.style.width = `${state.mode === 'study' ? 100 : pct}%`;
    }

    if (state.mode === 'exam') {
      dom.btnCheckExam.classList.remove('hidden');
      dom.unverifiedCount.textContent = `(${state.examPlacements.size})`;
    } else {
      dom.btnCheckExam.classList.add('hidden');
    }
  }

  function setFeedback(kind, badge, message, inspectZ = null) {
    dom.feedbackBanner.className = `feedback-banner ${kind}`;
    dom.feedbackBadge.textContent = badge;
    dom.feedbackText.textContent = message;
    if (inspectZ) {
      state.lastInspectedZ = inspectZ;
      dom.btnFeedbackInspect.classList.remove('hidden');
    } else {
      dom.btnFeedbackInspect.classList.add('hidden');
    }
  }

  /* ========================================================================
     Build Static Periodic Table Structure Once, Fast-Update Cell States
     ======================================================================== */

  function buildPeriodicGridSkeleton() {
    dom.grid.innerHTML = '';
    cellElements.clear();
    groupHeaders.clear();
    periodHeaders.clear();

    // Top-left corner badge (row 1, col 1)
    const corner = document.createElement('div');
    corner.className = 'axis-period';
    corner.style.gridRow = '1';
    corner.style.gridColumn = '1';
    corner.textContent = 'P\\G';
    corner.title = 'Periods (rows 1–7) and Groups (columns 1–18)';
    dom.grid.appendChild(corner);

    // Group column headers 1..18 (row 1, cols 2..19)
    for (let g = 1; g <= 18; g++) {
      const gh = document.createElement('div');
      gh.className = 'axis-group';
      gh.style.gridRow = '1';
      gh.style.gridColumn = String(g + 1);
      gh.textContent = String(g);
      gh.title = `Group ${g} (${GROUP_SUBLABELS[g]})`;
      dom.grid.appendChild(gh);
      groupHeaders.set(g, gh);
    }

    // Period row headers 1..7 (rows 2..8, col 1)
    for (let p = 1; p <= 7; p++) {
      const ph = document.createElement('div');
      ph.className = 'axis-period';
      ph.style.gridRow = String(p + 1);
      ph.style.gridColumn = '1';
      ph.textContent = String(p);
      ph.title = `Period ${p}`;
      dom.grid.appendChild(ph);
      periodHeaders.set(p, ph);
    }

    // F-block row labels (rows 10 & 11, cols 1..4)
    const lanthLabel = document.createElement('div');
    lanthLabel.className = 'fblock-label';
    lanthLabel.style.gridRow = '10';
    lanthLabel.style.gridColumn = '1 / 5';
    lanthLabel.innerHTML = '<span style="color:var(--cat-lanthanide)">●</span> 6* Lanthanides';
    dom.grid.appendChild(lanthLabel);
    periodHeaders.set(9, lanthLabel);

    const actLabel = document.createElement('div');
    actLabel.className = 'fblock-label';
    actLabel.style.gridRow = '11';
    actLabel.style.gridColumn = '1 / 5';
    actLabel.innerHTML = '<span style="color:var(--cat-actinide)">●</span> 7* Actinides';
    dom.grid.appendChild(actLabel);
    periodHeaders.set(10, actLabel);

    // Bridge indicators at (Period 6, Group 3 -> row 7, col 4) and (Period 7, Group 3 -> row 8, col 4)
    createBridgeCell(7, 4, '57–71', 'La–Lu', 'lanthanide');
    createBridgeCell(8, 4, '89–103', 'Ac–Lr', 'actinide');

    // Interactive Valley HUD inside natural Periodic Table gap (cols 4..14, rows 2..5)
    const valley = document.createElement('div');
    valley.className = 'valley-hud';
    valley.innerHTML = `
      <div class="valley-top">
        <div class="progress-wrap">
          <div class="progress-meta">
            <span id="valleyProgressLabel">Mastery Progress: 0 / 118 Sahi (0%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="valleyProgressFill"></div>
          </div>
        </div>
        <div class="hover-coord-box" id="hoverCoordBox">Hover or Drag to Inspect Slot</div>
      </div>
      <div class="legend-grid" id="categoryLegend"></div>
    `;
    dom.grid.appendChild(valley);
    progressLabelEl = valley.querySelector('#valleyProgressLabel');
    progressFillEl = valley.querySelector('#valleyProgressFill');
    hoverCoordEl = valley.querySelector('#hoverCoordBox');

    const legendGrid = valley.querySelector('#categoryLegend');
    Object.values(CATEGORIES).forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'legend-item';
      btn.dataset.category = cat.id;
      btn.title = `Filter / Highlight ${cat.label}`;
      btn.innerHTML = `<span class="legend-swatch" style="background:${cat.color}"></span><span>${cat.short}</span>`;
      btn.addEventListener('click', () => toggleCategoryFilter(cat.id));
      legendGrid.appendChild(btn);
    });

    // Create all 118 Element Cells
    ELEMENTS.forEach((el) => {
      const cell = document.createElement('div');
      cell.className = 'pt-cell empty';
      cell.dataset.z = String(el.z);
      cell.dataset.symbol = el.symbol;
      cell.dataset.period = String(el.period);
      cell.dataset.group = String(el.group);
      cell.style.setProperty('--cell-cat-color', CATEGORIES[el.category].color);

      // CSS Grid placement:
      // Main rows 1..7 -> CSS rows 2..8
      // Lanthanides (gridRow 9) -> CSS row 10
      // Actinides (gridRow 10) -> CSS row 11
      const cssRow = el.gridRow <= 7 ? el.gridRow + 1 : el.gridRow + 1;
      const cssCol = el.gridCol + 1;
      cell.style.gridRow = String(cssRow);
      cell.style.gridColumn = String(cssCol);

      bindCellEvents(cell, el);
      dom.grid.appendChild(cell);
      cellElements.set(el.z, cell);
    });
  }

  function createBridgeCell(cssRow, cssCol, rangeText, symText, targetCategory) {
    const bridge = document.createElement('div');
    bridge.className = 'bridge-cell';
    bridge.style.gridRow = String(cssRow);
    bridge.style.gridColumn = String(cssCol);
    bridge.innerHTML = `<span>${rangeText}</span><strong>${symText}</strong>`;
    bridge.title = `Click to highlight ${targetCategory} series below`;

    bridge.addEventListener('click', () => {
      toggleCategoryFilter(targetCategory);
    });

    bridge.addEventListener('dragover', (e) => {
      e.preventDefault();
      bridge.classList.add('drag-over');
    });
    bridge.addEventListener('dragleave', () => {
      bridge.classList.remove('drag-over');
    });
    bridge.addEventListener('drop', (e) => {
      e.preventDefault();
      bridge.classList.remove('drag-over');
      const droppedZ = extractDraggedZ(e);
      const droppedEl = BY_Z.get(droppedZ);
      if (droppedEl) {
        setFeedback(
          'hint',
          'F-BLOCK BRIDGE',
          `${droppedEl.name} (${droppedEl.symbol}) belongs in the ${targetCategory === 'lanthanide' ? '6* Lanthanide' : '7* Actinide'} row right below the main table!`
        );
        Sound.hint();
      }
    });

    dom.grid.appendChild(bridge);
  }

  /* ========================================================================
     Render All 118 Board Cells & Bottom Element Tray
     ======================================================================== */

  function getPhaseAtTemp(el, tempK) {
    if (el.meltK === null) return el.phase.toLowerCase();
    if (tempK < el.meltK) return 'solid';
    if (el.boilK === null || tempK < el.boilK) return 'liquid';
    return 'gas';
  }

  function renderSingleCell(el) {
    const cell = cellElements.get(el.z);
    if (!cell) return;

    const inScope = isElementInScope(el);
    const isSolved = state.solvedSet.has(el.z);
    const examPlacedZ = state.examPlacements.get(el.z);
    const isExamWrong = state.examWrongSlots.has(el.z);

    // Reset dynamic state classes (keep transient wrong-flash if active)
    const keepFlash = cell.classList.contains('wrong-flash');
    cell.className = 'pt-cell';
    if (keepFlash) cell.classList.add('wrong-flash');
    cell.removeAttribute('draggable');

    if (state.hintTargetZ === el.z) cell.classList.add('hint-target');
    if (state.selectedSlotZ === el.z) cell.classList.add('slot-selected');

    // Category / Block filter dimming
    const catMismatch = state.activeCategory && el.category !== state.activeCategory;
    const blockMismatch = state.mode === 'study' && state.studyBlock !== 'all' && el.block !== state.studyBlock;
    if (catMismatch || blockMismatch) {
      cell.classList.add('dimmed');
    }

    // 1. STUDY MODE: Show complete interactive periodic table
    if (state.mode === 'study') {
      const phase = getPhaseAtTemp(el, state.studyTempK);
      cell.classList.add('study-cell');
      cell.dataset.state = 'study';
      cell.innerHTML = `
        <div class="cell-top">
          <span>${el.z}</span>
          <span class="phase-dot phase-${phase}" title="${phase.toUpperCase()} at ${state.studyTempK} K"></span>
        </div>
        <div class="cell-sym">${el.symbol}</div>
        <div class="cell-name">${el.name}</div>
      `;
      return;
    }

    // 2. Out-of-scope slots in scoped quiz modes
    if (!inScope) {
      cell.classList.add('out-of-scope');
      cell.dataset.state = 'locked';
      cell.innerHTML = `<div class="cell-sym" style="font-size:11px;opacity:0.45">${el.symbol}</div>`;
      return;
    }

    // 3. Solved ("Sahi") Slot
    if (isSolved) {
      cell.classList.add('solved');
      cell.dataset.state = 'solved';
      cell.innerHTML = `
        <div class="cell-top">
          <span>${el.z}</span>
          <span class="status-mark sahi" title="Sahi (Correct)!">✓</span>
        </div>
        <div class="cell-sym">${el.symbol}</div>
        <div class="cell-name">${el.name}</div>
      `;
      return;
    }

    // 4. Exam Mode Placed Tile (Unchecked or Checked Wrong)
    if (state.mode === 'exam' && examPlacedZ !== undefined) {
      const placedEl = BY_Z.get(examPlacedZ);
      cell.classList.add(isExamWrong ? 'exam-wrong' : 'exam-placed');
      cell.dataset.state = isExamWrong ? 'exam-wrong' : 'exam-placed';
      cell.setAttribute('draggable', 'true');
      cell.innerHTML = `
        <button type="button" class="cell-remove-btn" data-remove-slot="${el.z}" title="Return ${placedEl.symbol} to tray">×</button>
        <div class="cell-top">
          <span>${state.boardClue === 'numbers' ? el.z : ''}</span>
          ${isExamWrong ? '<span class="status-mark galat" title="Galat (Wrong slot) — drag to right slot!">✗</span>' : ''}
        </div>
        <div class="cell-sym">${placedEl.symbol}</div>
        <div class="cell-name">${placedEl.name}</div>
      `;
      return;
    }

    // 5. Empty Blank Slot awaiting Drag & Drop
    cell.classList.add('empty');
    cell.dataset.state = 'empty';
    if (state.boardClue === 'categories') {
      cell.classList.add('cat-hint');
    }
    const zClue = state.boardClue === 'numbers' ? `<span class="slot-clue-z">${el.z}</span>` : '';
    cell.innerHTML = `
      ${zClue}
      <span class="slot-coord-hint">${slotCoordinateShort(el)}</span>
    `;
  }

  function renderBoard() {
    ELEMENTS.forEach(renderSingleCell);
    document.querySelectorAll('.legend-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.category === state.activeCategory);
    });
    updateStatsUI();
  }

  function renderTray() {
    if (state.mode === 'study') {
      dom.trayDock.classList.add('hidden');
      return;
    }
    dom.trayDock.classList.remove('hidden');

    // Elements currently placed on unverified Exam cells shouldn't duplicate in tray
    const placedInExamSet = new Set(state.examPlacements.values());

    const allRemaining = state.trayOrder
      .map((z) => BY_Z.get(z))
      .filter((el) => isElementInScope(el) && !state.solvedSet.has(el.z) && !placedInExamSet.has(el.z));

    dom.remainingCount.textContent = `${allRemaining.length} left`;

    // Selected tile helper indicator
    if (state.selectedTileZ && BY_Z.get(state.selectedTileZ)) {
      const sel = BY_Z.get(state.selectedTileZ);
      dom.selectedTileBanner.classList.remove('hidden');
      dom.selectedTileBanner.textContent = `Selected: ${sel.symbol} (${sel.name}) — click any blank slot to drop!`;
    } else {
      dom.selectedTileBanner.classList.add('hidden');
    }

    // Filter by category or search text
    const q = state.searchQuery.trim().toLowerCase();
    let visible = allRemaining.filter((el) => {
      if (state.activeCategory && el.category !== state.activeCategory) return false;
      if (!q) return true;
      return (
        el.symbol.toLowerCase().includes(q) ||
        el.name.toLowerCase().includes(q) ||
        el.config.toLowerCase().includes(q) ||
        el.categoryLabel.toLowerCase().includes(q) ||
        String(el.z) === q
      );
    });

    if (state.deckMode === 'wave' && !q) {
      visible = visible.slice(0, 16);
    }

    dom.trayTiles.innerHTML = '';
    const frag = document.createDocumentFragment();

    visible.forEach((el) => {
      const tile = document.createElement('div');
      tile.className = 'el-tile';
      if (state.selectedTileZ === el.z) tile.classList.add('selected');
      tile.draggable = true;
      tile.dataset.z = String(el.z);
      tile.dataset.symbol = el.symbol;

      let primary = el.symbol;
      let secondary = el.name;
      if (state.tileClue === 'symbol') {
        primary = el.symbol;
        secondary = `${el.block}-block`;
      } else if (state.tileClue === 'name') {
        primary = el.name;
        secondary = 'Element';
      } else if (state.tileClue === 'config') {
        primary = el.config;
        secondary = `${el.shells.length} shells`;
      }

      tile.innerHTML = `
        <span class="tile-sym" style="${state.tileClue === 'name' || state.tileClue === 'config' ? 'font-size:12px' : ''}">${primary}</span>
        <span class="tile-sub">${secondary}</span>
      `;

      bindTileEvents(tile, el);
      frag.appendChild(tile);
    });

    dom.trayTiles.appendChild(frag);
  }

  /* ========================================================================
     Drag & Drop + Touch Drag + Click-to-Place Interactions
     ======================================================================== */

  function extractDraggedZ(e) {
    if (dragPayload && dragPayload.z) return dragPayload.z;
    if (e.dataTransfer) {
      const raw = e.dataTransfer.getData('text/plain');
      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return null;
  }

  function highlightAxes(el, active) {
    const gh = groupHeaders.get(el.group);
    const ph = periodHeaders.get(el.gridRow);
    if (gh) gh.classList.toggle('active-axis', active);
    if (ph) ph.classList.toggle('active-axis', active);
    if (hoverCoordEl) {
      hoverCoordEl.textContent = active
        ? (state.mode === 'study' || state.solvedSet.has(el.z)
            ? `#${el.z} ${el.symbol} · ${positionLabel(el)}`
            : `Target Slot: ${positionLabel(el)}`)
        : 'Hover or Drag to Inspect Slot';
    }
  }

  function bindTileEvents(tile, el) {
    // Native HTML5 Drag from Tray
    tile.addEventListener('dragstart', (e) => {
      dragPayload = { z: el.z, fromSlotZ: null };
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', String(el.z));
        e.dataTransfer.effectAllowed = 'move';
      }
      tile.classList.add('dragging');
      Sound.pickup();
    });

    tile.addEventListener('dragend', () => {
      tile.classList.remove('dragging');
      dragPayload = null;
    });

    // Click-to-Select (or place straight into an already-clicked blank slot!)
    tile.addEventListener('click', () => {
      if (state.selectedSlotZ !== null) {
        const targetSlotZ = state.selectedSlotZ;
        closeQuickSlotPopover();
        handleDropAttempt(targetSlotZ, el.z, null);
        return;
      }
      state.selectedTileZ = state.selectedTileZ === el.z ? null : el.z;
      Sound.pickup();
      renderTray();
    });

    // Mobile Touch Drag Support
    bindTouchDrag(tile, () => ({ z: el.z, fromSlotZ: null }), el.symbol);
  }

  function bindCellEvents(cell, slotEl) {
    cell.addEventListener('mouseenter', () => highlightAxes(slotEl, true));
    cell.addEventListener('mouseleave', () => highlightAxes(slotEl, false));

    // Allow dragging an unverified tile FROM an Exam cell to another cell
    cell.addEventListener('dragstart', (e) => {
      if (state.mode !== 'exam') {
        e.preventDefault();
        return;
      }
      const placedZ = state.examPlacements.get(slotEl.z);
      if (!placedZ) {
        e.preventDefault();
        return;
      }
      dragPayload = { z: placedZ, fromSlotZ: slotEl.z };
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', String(placedZ));
        e.dataTransfer.effectAllowed = 'move';
      }
      Sound.pickup();
    });

    cell.addEventListener('dragend', () => {
      dragPayload = null;
    });

    // Drop target handlers
    cell.addEventListener('dragover', (e) => {
      if (state.mode === 'study') return;
      if (!isElementInScope(slotEl) || state.solvedSet.has(slotEl.z)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      cell.classList.add('drag-over');
      highlightAxes(slotEl, true);
    });

    cell.addEventListener('dragleave', () => {
      cell.classList.remove('drag-over');
    });

    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      const droppedZ = extractDraggedZ(e);
      const fromSlotZ = dragPayload ? dragPayload.fromSlotZ : null;
      dragPayload = null;
      if (droppedZ) {
        handleDropAttempt(slotEl.z, droppedZ, fromSlotZ);
      }
    });

    // Click handler on cell
    cell.addEventListener('click', (e) => {
      // Remove button on Exam mode card
      const removeBtn = e.target.closest('[data-remove-slot]');
      if (removeBtn) {
        e.stopPropagation();
        removeExamPlacement(slotEl.z);
        return;
      }

      // Inspect solved or Study cell
      if (state.mode === 'study' || state.solvedSet.has(slotEl.z)) {
        openInspector(slotEl.z);
        return;
      }

      if (!isElementInScope(slotEl)) return;

      // If an element tile from tray is selected -> place it here!
      if (state.selectedTileZ !== null) {
        const chosenZ = state.selectedTileZ;
        state.selectedTileZ = null;
        handleDropAttempt(slotEl.z, chosenZ, null);
        return;
      }

      // Otherwise open quick keyboard symbol popover for this empty slot!
      openQuickSlotPopover(slotEl, cell);
    });

    // Touch drag for re-dragging placed tiles in Exam mode
    bindTouchDrag(
      cell,
      () => {
        if (state.mode !== 'exam') return null;
        const pz = state.examPlacements.get(slotEl.z);
        return pz ? { z: pz, fromSlotZ: slotEl.z } : null;
      },
      null
    );
  }

  function bindTouchDrag(sourceNode, getPayloadFn, fixedLabel) {
    let ghost = null;
    let activeTouchPayload = null;
    let lastHoveredCell = null;

    sourceNode.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const payload = getPayloadFn();
      if (!payload) return;
      activeTouchPayload = payload;
      const el = BY_Z.get(payload.z);
      const touch = e.touches[0];

      ghost = document.createElement('div');
      ghost.className = 'touch-drag-ghost';
      ghost.innerHTML = `<strong class="tile-sym">${fixedLabel || el.symbol}</strong><span class="tile-sub">${el.name}</span>`;
      ghost.style.left = `${touch.clientX}px`;
      ghost.style.top = `${touch.clientY}px`;
      document.body.appendChild(ghost);
    }, { passive: true });

    sourceNode.addEventListener('touchmove', (e) => {
      if (!ghost || !activeTouchPayload) return;
      e.preventDefault();
      const touch = e.touches[0];
      ghost.style.left = `${touch.clientX}px`;
      ghost.style.top = `${touch.clientY}px`;

      const under = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = under ? under.closest('.pt-cell') : null;
      if (lastHoveredCell && lastHoveredCell !== cell) {
        lastHoveredCell.classList.remove('drag-over');
      }
      if (cell && !cell.classList.contains('solved') && !cell.classList.contains('out-of-scope')) {
        cell.classList.add('drag-over');
        lastHoveredCell = cell;
      }
    }, { passive: false });

    sourceNode.addEventListener('touchend', (e) => {
      if (!ghost || !activeTouchPayload) return;
      const touch = e.changedTouches[0];
      if (lastHoveredCell) lastHoveredCell.classList.remove('drag-over');
      ghost.remove();
      ghost = null;

      const under = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = under ? under.closest('.pt-cell') : null;
      const payload = activeTouchPayload;
      activeTouchPayload = null;
      lastHoveredCell = null;

      if (cell && cell.dataset.z) {
        handleDropAttempt(parseInt(cell.dataset.z, 10), payload.z, payload.fromSlotZ);
      }
    });
  }

  /* ========================================================================
     Core Placement & Validation Logic (Sahi / Galat Engine)
     ======================================================================== */

  function handleDropAttempt(slotZ, placedZ, fromSlotZ = null) {
    const slotEl = BY_Z.get(slotZ);
    const placedEl = BY_Z.get(placedZ);
    if (!slotEl || !placedEl) return;
    if (!isElementInScope(slotEl) || state.solvedSet.has(slotZ)) return;

    ensureTimerStarted();
    closeQuickSlotPopover();

    // EXAM MODE: Place or Swap freely without immediate lock until user clicks "Check"
    if (state.mode === 'exam') {
      if (fromSlotZ === slotZ) return;

      const existingInTarget = state.examPlacements.get(slotZ);
      if (fromSlotZ !== null) {
        if (existingInTarget !== undefined) {
          // Swap two placed tiles!
          state.examPlacements.set(fromSlotZ, existingInTarget);
          state.examWrongSlots.delete(fromSlotZ);
          renderSingleCell(BY_Z.get(fromSlotZ));
        } else {
          state.examPlacements.delete(fromSlotZ);
          state.examWrongSlots.delete(fromSlotZ);
          renderSingleCell(BY_Z.get(fromSlotZ));
        }
      }

      state.examPlacements.set(slotZ, placedZ);
      state.examWrongSlots.delete(slotZ);
      Sound.pickup();
      renderSingleCell(slotEl);
      renderTray();
      updateStatsUI();

      setFeedback(
        'neutral',
        'PLACED',
        `Placed ${placedEl.symbol} (${placedEl.name}) on ${positionLabel(slotEl)}. Click "Check Sahi / Galat" anytime to grade!`
      );
      return;
    }

    // LIVE CHECK MODE: Immediate Sahi (Right) or Galat (Wrong) verification!
    if (placedZ === slotZ) {
      const usedHint = state.hintTargetZ === slotZ;
      if (state.hintTargetZ === slotZ) state.hintTargetZ = null;

      state.solvedSet.add(slotZ);
      state.streak += 1;
      const gained = Math.max(40, (usedHint ? 60 : 100) + Math.min(state.streak - 1, 8) * 15);
      state.score += gained;

      Sound.correct(state.streak);
      renderSingleCell(slotEl);
      const cell = cellElements.get(slotZ);
      if (cell) {
        cell.classList.add('just-solved');
        setTimeout(() => cell.classList.remove('just-solved'), 500);
      }

      setFeedback(
        'correct',
        '✓ SAHI!',
        `Sahi Jawab! ${placedEl.name} (${placedEl.symbol}, Z=${placedEl.z}) belongs in ${positionLabel(placedEl)} · +${gained} pts${state.streak >= 2 ? ` (${state.streak}x Streak!)` : ''}`,
        placedEl.z
      );

      renderTray();
      updateStatsUI();
      checkWinCondition();
    } else {
      // WRONG ("GALAT") PLACEMENT!
      state.wrongCount += 1;
      state.streak = 0;
      state.score = Math.max(0, state.score - 15);
      const countForEl = (state.wrongAttemptsPerZ.get(placedZ) || 0) + 1;
      state.wrongAttemptsPerZ.set(placedZ, countForEl);

      state.mistakes.unshift({
        element: placedEl,
        droppedSlot: slotEl,
        mode: 'Live Check'
      });

      Sound.wrong();

      // Flash target slot crimson with visual wrong mark
      const cell = cellElements.get(slotZ);
      if (cell) {
        cell.classList.add('wrong-flash');
        cell.innerHTML = `
          <div class="cell-top"><span>✗</span><span class="status-mark galat">GALAT</span></div>
          <div class="cell-sym" style="color:var(--wrong)">${placedEl.symbol}</div>
        `;
        setTimeout(() => {
          cell.classList.remove('wrong-flash');
          renderSingleCell(slotEl);
        }, 720);
      }

      setFeedback(
        'wrong',
        '✗ GALAT!',
        `Galat Jagah! You dropped ${placedEl.name} (${placedEl.symbol}) on ${positionLabel(slotEl)}. Hint: ${buildSmartHint(placedEl, countForEl)}`
      );

      renderTray();
      updateStatsUI();
    }
  }

  function removeExamPlacement(slotZ) {
    const placedZ = state.examPlacements.get(slotZ);
    if (!placedZ) return;
    state.examPlacements.delete(slotZ);
    state.examWrongSlots.delete(slotZ);
    renderSingleCell(BY_Z.get(slotZ));
    renderTray();
    updateStatsUI();
  }

  function checkExamSheet() {
    if (state.mode !== 'exam') return;
    if (state.examPlacements.size === 0) {
      setFeedback('hint', 'EMPTY SHEET', 'Drag some elements onto the blank Periodic Table first, then click Check Sahi / Galat!');
      return;
    }

    let newlyRight = 0;
    let newlyWrong = 0;

    Array.from(state.examPlacements.entries()).forEach(([slotZ, placedZ]) => {
      if (slotZ === placedZ) {
        state.examPlacements.delete(slotZ);
        state.examWrongSlots.delete(slotZ);
        state.solvedSet.add(slotZ);
        state.streak += 1;
        state.score += 100;
        newlyRight += 1;
        renderSingleCell(BY_Z.get(slotZ));
        const c = cellElements.get(slotZ);
        if (c) {
          c.classList.add('just-solved');
          setTimeout(() => c.classList.remove('just-solved'), 500);
        }
      } else {
        state.examWrongSlots.add(slotZ);
        state.wrongCount += 1;
        state.streak = 0;
        state.score = Math.max(0, state.score - 10);
        newlyWrong += 1;
        state.mistakes.unshift({
          element: BY_Z.get(placedZ),
          droppedSlot: BY_Z.get(slotZ),
          mode: 'Exam Check'
        });
        renderSingleCell(BY_Z.get(slotZ));
      }
    });

    if (newlyWrong === 0 && newlyRight > 0) {
      Sound.correct(3);
      setFeedback('correct', '✓ ALL SAHI!', `Shandar! Every checked element (${newlyRight}) is 100% Sahi and locked in green!`);
    } else if (newlyRight > 0 && newlyWrong > 0) {
      Sound.wrong();
      setFeedback(
        'wrong',
        'EXAM GRADED',
        `${newlyRight} Sahi (✓ Green) & ${newlyWrong} Galat (✗ Red)! Drag red tiles to their right slots to fix them!`
      );
    } else {
      Sound.wrong();
      setFeedback(
        'wrong',
        '✗ GALAT!',
        `All ${newlyWrong} checked placements are Galat (marked Red ✗). Drag them to fix or click "Galat" above for clues!`
      );
    }

    renderTray();
    updateStatsUI();
    checkWinCondition();
  }

  function checkWinCondition() {
    const targets = getTargetElements();
    if (targets.length === 0) return;
    const allSolved = targets.every((el) => state.solvedSet.has(el.z));
    if (!allSolved) return;

    stopTimer();
    Sound.win();

    const totalAttempts = targets.length + state.wrongCount;
    const accuracy = Math.round((targets.length / totalAttempts) * 100);

    document.getElementById('winScore').textContent = String(state.score);
    document.getElementById('winAccuracy').textContent = `${accuracy}%`;
    document.getElementById('winRatio').textContent = `${targets.length} ✓ / ${state.wrongCount} ✗`;
    document.getElementById('winTime').textContent = formatDuration(state.elapsedSec);
    document.getElementById('winSubtitle').textContent =
      `You completed all ${targets.length} elements in "${dom.scopeSelect.options[dom.scopeSelect.selectedIndex].text}"!`;

    dom.winBackdrop.classList.remove('hidden');
  }

  /* ========================================================================
     Smart Hint, Quick Slot Keyboard Entry & Modals
     ======================================================================== */

  function triggerHint() {
    if (state.mode === 'study') return;

    // Pick user's selected tile if any, otherwise first unplaced visible tile
    const placedInExamSet = new Set(state.examPlacements.values());
    let candidateZ = state.selectedTileZ;

    if (!candidateZ || state.solvedSet.has(candidateZ)) {
      const remaining = state.trayOrder.find((z) => {
        const el = BY_Z.get(z);
        return isElementInScope(el) && !state.solvedSet.has(z) && !placedInExamSet.has(z);
      });
      // Or if all elements are sitting wrongly on Exam cells, hint first wrong cell's element
      if (remaining !== undefined) {
        candidateZ = remaining;
      } else if (state.examPlacements.size > 0) {
        candidateZ = Array.from(state.examPlacements.values())[0];
      }
    }

    if (!candidateZ) return;

    const el = BY_Z.get(candidateZ);
    state.selectedTileZ = candidateZ;
    state.hintTargetZ = candidateZ;

    Sound.hint();
    renderBoard();
    renderTray();

    const targetCell = cellElements.get(candidateZ);
    if (targetCell) {
      targetCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    setFeedback(
      'hint',
      '💡 HINT',
      `Selected ${el.symbol} (${el.name}): Watch the pulsing golden slot at ${positionLabel(el)} (${el.categoryLabel})!`
    );
  }

  function openQuickSlotPopover(slotEl, cellNode) {
    state.selectedSlotZ = slotEl.z;
    renderBoard();

    const rect = cellNode.getBoundingClientRect();
    const popWidth = 240;
    const left = Math.min(Math.max(12, rect.left - 60), window.innerWidth - popWidth - 12);
    const top = Math.min(rect.bottom + 6, window.innerHeight - 125);

    dom.slotQuickTitle.textContent = `Slot: ${positionLabel(slotEl)}`;
    dom.slotQuickModal.style.left = `${left}px`;
    dom.slotQuickModal.style.top = `${top}px`;
    dom.slotQuickModal.classList.remove('hidden');
    dom.slotQuickField.value = '';
    setTimeout(() => dom.slotQuickField.focus(), 10);
  }

  function closeQuickSlotPopover() {
    if (state.selectedSlotZ !== null) {
      const prev = state.selectedSlotZ;
      state.selectedSlotZ = null;
      dom.slotQuickModal.classList.add('hidden');
      if (BY_Z.get(prev)) renderSingleCell(BY_Z.get(prev));
    } else {
      dom.slotQuickModal.classList.add('hidden');
    }
  }

  /* ========================================================================
     SVG Bohr Atom Renderer & Inspector Modal
     ======================================================================== */

  function buildBohrSVG(el) {
    const color = CATEGORIES[el.category].color;
    const shellCount = el.shells.length;
    const minR = 26;
    const maxR = 90;
    const step = shellCount > 1 ? (maxR - minR) / (shellCount - 1) : 0;

    let ringsMarkup = '';
    el.shells.forEach((eCount, idx) => {
      const r = shellCount === 1 ? 52 : minR + idx * step;
      const duration = 12 + idx * 5;
      const dir = idx % 2 === 0 ? 'normal' : 'reverse';
      let dots = '';
      for (let i = 0; i < eCount; i++) {
        const angle = (2 * Math.PI * i) / eCount - Math.PI / 2;
        const cx = (100 + r * Math.cos(angle)).toFixed(2);
        const cy = (100 + r * Math.sin(angle)).toFixed(2);
        dots += `<circle cx="${cx}" cy="${cy}" r="2.7" fill="${color}" />`;
      }
      ringsMarkup += `
        <circle cx="100" cy="100" r="${r.toFixed(1)}" fill="none" stroke="rgba(148,163,184,0.28)" stroke-width="1" />
        <g class="bohr-orbit-group" style="animation-duration:${duration}s;animation-direction:${dir}">
          ${dots}
        </g>
      `;
    });

    return `
      <svg viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Bohr shell model of ${el.name}">
        ${ringsMarkup}
        <circle cx="100" cy="100" r="16" fill="${color}" opacity="0.22" />
        <circle cx="100" cy="100" r="12" fill="${color}" />
        <text x="100" y="104" text-anchor="middle" font-size="10" font-weight="800" fill="#090e1a">${el.symbol}</text>
      </svg>
    `;
  }

  function openInspector(z) {
    const el = BY_Z.get(z);
    if (!el) return;
    const cat = CATEGORIES[el.category];

    document.getElementById('inspZ').textContent = String(el.z);
    document.getElementById('inspSym').textContent = el.symbol;
    document.getElementById('inspMass').textContent = el.mass;
    document.getElementById('inspBadge').style.borderColor = cat.color;

    const catTag = document.getElementById('inspCategory');
    catTag.textContent = cat.label;
    catTag.style.color = cat.color;
    catTag.style.background = 'rgba(148, 163, 184, 0.14)';

    document.getElementById('inspName').textContent = `${el.name} (${el.symbol})`;
    document.getElementById('inspFact').textContent = el.fact;
    document.getElementById('inspShells').textContent = `Shells: ${el.shells.join(' · ')}`;
    document.getElementById('bohrContainer').innerHTML = buildBohrSVG(el);

    document.getElementById('specZ').textContent = `${el.z} (${el.z} protons, ${el.z} electrons)`;
    document.getElementById('specMass').textContent = `${el.mass} u`;
    document.getElementById('specPG').textContent = positionLabel(el);
    document.getElementById('specBlock').textContent = `${el.block}-block`;
    document.getElementById('specConfig').textContent = el.config;
    document.getElementById('specPhase').textContent = el.phase;
    document.getElementById('specMeltBoil').textContent =
      `${el.meltK ? `${el.meltK} K` : '—'} / ${el.boilK ? `${el.boilK} K` : '—'}`;
    document.getElementById('specEN').textContent =
      `${el.electronegativity ?? '—'} · Discovered ${el.year}`;

    dom.inspectorBackdrop.classList.remove('hidden');
  }

  function openMistakesModal() {
    dom.mistakesList.innerHTML = '';
    if (state.mistakes.length === 0) {
      dom.mistakesList.innerHTML =
        '<div style="padding:18px;text-align:center;color:var(--text-secondary)">Zero Galat attempts so far — spotless chemistry accuracy!</div>';
    } else {
      state.mistakes.forEach((m) => {
        const row = document.createElement('div');
        row.className = 'mistake-item';
        row.innerHTML = `
          <div>
            <strong style="color:var(--wrong)">✗ ${m.element.symbol} (${m.element.name})</strong>
            <div style="color:var(--text-secondary);font-size:11.5px;margin-top:2px">
              You dropped on: <strong>${positionLabel(m.droppedSlot)}</strong>
            </div>
          </div>
          <div style="text-align:right">
            <span style="color:var(--correct);font-weight:700">✓ Sahi Spot:</span>
            <div style="font-size:11.5px;font-weight:700">${positionLabel(m.element)}</div>
          </div>
        `;
        dom.mistakesList.appendChild(row);
      });
    }
    dom.mistakesBackdrop.classList.remove('hidden');
  }

  /* ========================================================================
     Mode Switching, Filters & Reset Controls
     ======================================================================== */

  function setMode(newMode) {
    state.mode = newMode;
    closeQuickSlotPopover();
    state.selectedTileZ = null;
    state.hintTargetZ = null;

    // Return unverified exam cards cleanly if leaving Exam Mode
    if (newMode !== 'exam') {
      state.examPlacements.clear();
      state.examWrongSlots.clear();
    }

    document.querySelectorAll('.mode-tab').forEach((btn) => {
      const active = btn.dataset.mode === newMode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    const isStudy = newMode === 'study';
    dom.playControls.classList.toggle('hidden', isStudy);
    dom.studyControls.classList.toggle('hidden', !isStudy);
    dom.btnHint.classList.toggle('hidden', isStudy);

    if (isStudy) {
      stopTimer();
      setFeedback(
        'neutral',
        'STUDY LAB',
        'Click any element to inspect its animated Bohr electron shells, or drag the Temperature slider to see melting & boiling live!'
      );
    } else if (newMode === 'exam') {
      setFeedback(
        'neutral',
        'EXAM MODE',
        'Drop elements freely into any blank slots (drag between cells to swap). Click "Check Sahi / Galat" when ready!'
      );
    } else {
      setFeedback(
        'neutral',
        'LIVE CHECK',
        'Drag & drop any element tile onto the blank Periodic Table for instant Sahi (✓) or Galat (✗) verification!'
      );
    }

    renderBoard();
    renderTray();
  }

  function toggleCategoryFilter(categoryId) {
    state.activeCategory = state.activeCategory === categoryId ? null : categoryId;
    renderBoard();
    renderTray();
  }

  function resetChallenge() {
    stopTimer();
    state.solvedSet.clear();
    state.examPlacements.clear();
    state.examWrongSlots.clear();
    state.wrongAttemptsPerZ.clear();
    state.mistakes = [];
    state.selectedTileZ = null;
    state.hintTargetZ = null;
    state.score = 0;
    state.wrongCount = 0;
    state.streak = 0;
    state.elapsedSec = 0;
    state.trayOrder = shuffleArray(ELEMENTS.map((e) => e.z));
    closeQuickSlotPopover();
    dom.winBackdrop.classList.add('hidden');

    setFeedback(
      'neutral',
      'RESET',
      'Fresh blank Periodic Table ready! Drag & drop elements below to test your chemistry mastery.'
    );
    renderBoard();
    renderTray();
  }

  /* ========================================================================
     Wire UI Controls & Global Keyboard Shortcuts
     ======================================================================== */

  function bindGlobalControls() {
    document.querySelectorAll('.mode-tab').forEach((tab) => {
      tab.addEventListener('click', () => setMode(tab.dataset.mode));
    });

    dom.scopeSelect.addEventListener('change', () => {
      state.scope = dom.scopeSelect.value;
      resetChallenge();
    });

    dom.boardClueSelect.addEventListener('change', () => {
      state.boardClue = dom.boardClueSelect.value;
      renderBoard();
    });

    dom.tileClueSelect.addEventListener('change', () => {
      state.tileClue = dom.tileClueSelect.value;
      renderTray();
    });

    dom.traySearch.addEventListener('input', () => {
      state.searchQuery = dom.traySearch.value;
      renderTray();
    });

    dom.btnDeckAll.addEventListener('click', () => {
      state.deckMode = 'all';
      dom.btnDeckAll.classList.add('active');
      dom.btnDeckWave.classList.remove('active');
      renderTray();
    });

    dom.btnDeckWave.addEventListener('click', () => {
      state.deckMode = 'wave';
      dom.btnDeckWave.classList.add('active');
      dom.btnDeckAll.classList.remove('active');
      renderTray();
    });

    dom.btnShuffle.addEventListener('click', () => {
      state.trayOrder = shuffleArray(state.trayOrder);
      Sound.pickup();
      renderTray();
    });

    dom.btnCheckExam.addEventListener('click', checkExamSheet);
    dom.btnHint.addEventListener('click', triggerHint);
    dom.btnReset.addEventListener('click', resetChallenge);

    dom.btnFeedbackInspect.addEventListener('click', () => {
      openInspector(state.lastInspectedZ);
    });

    // Study Mode Controls
    document.querySelectorAll('.block-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        state.studyBlock = pill.dataset.block;
        document.querySelectorAll('.block-pill').forEach((p) => p.classList.toggle('active', p === pill));
        renderBoard();
      });
    });

    dom.tempSlider.addEventListener('input', () => {
      state.studyTempK = parseInt(dom.tempSlider.value, 10);
      const celsius = Math.round(state.studyTempK - 273.15);
      dom.tempReadout.textContent = `${state.studyTempK} K (${celsius} °C)`;
      renderBoard();
    });

    dom.btnResetTemp.addEventListener('click', () => {
      state.studyTempK = 298;
      dom.tempSlider.value = '298';
      dom.tempReadout.textContent = '298 K (25 °C)';
      renderBoard();
    });

    // Sound & Theme Toggles
    const updateSoundIcon = () => {
      dom.btnSound.textContent = Sound.isEnabled() ? '🔊' : '🔇';
    };
    updateSoundIcon();
    dom.btnSound.addEventListener('click', () => {
      Sound.toggle();
      updateSoundIcon();
      if (Sound.isEnabled()) Sound.pickup();
    });

    try {
      const savedTheme = localStorage.getItem('pt_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch (_) {}

    const syncThemeIcon = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      dom.btnTheme.textContent = current === 'dark' ? '☀️' : '🌙';
    };
    syncThemeIcon();

    dom.btnTheme.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('pt_theme', next);
      } catch (_) {}
      syncThemeIcon();
    });

    // Quick Slot Keyboard Form Submit
    dom.slotQuickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (state.selectedSlotZ === null) return;
      const val = dom.slotQuickField.value.trim().toLowerCase();
      if (!val) return;

      const matched = BY_SYMBOL.get(val) || BY_NAME.get(val);
      if (!matched) {
        setFeedback('wrong', 'UNKNOWN ELEMENT', `"${dom.slotQuickField.value.trim()}" is not a valid element symbol or name.`);
        Sound.wrong();
        return;
      }
      if (state.solvedSet.has(matched.z)) {
        setFeedback('hint', 'ALREADY PLACED', `${matched.name} (${matched.symbol}) is already placed on the Periodic Table!`);
        return;
      }

      const targetSlot = state.selectedSlotZ;
      closeQuickSlotPopover();
      handleDropAttempt(targetSlot, matched.z, null);
    });

    dom.btnCloseQuick.addEventListener('click', closeQuickSlotPopover);

    // Modals Close Handlers
    dom.btnMistakes.addEventListener('click', openMistakesModal);
    dom.btnCloseInspector.addEventListener('click', () => dom.inspectorBackdrop.classList.add('hidden'));
    dom.btnCloseMistakes.addEventListener('click', () => dom.mistakesBackdrop.classList.add('hidden'));
    dom.btnCloseWin.addEventListener('click', () => dom.winBackdrop.classList.add('hidden'));
    dom.btnPlayAgain.addEventListener('click', resetChallenge);
    dom.btnExploreAfterWin.addEventListener('click', () => {
      dom.winBackdrop.classList.add('hidden');
      setMode('study');
    });

    [dom.inspectorBackdrop, dom.mistakesBackdrop, dom.winBackdrop].forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.add('hidden');
      });
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeQuickSlotPopover();
        dom.inspectorBackdrop.classList.add('hidden');
        dom.mistakesBackdrop.classList.add('hidden');
        dom.winBackdrop.classList.add('hidden');
        if (state.selectedTileZ !== null) {
          state.selectedTileZ = null;
          renderTray();
        }
        return;
      }

      const tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'h' || e.key === 'H') {
        triggerHint();
      } else if (e.key === 'Enter' && state.mode === 'exam') {
        checkExamSheet();
      }
    });
  }

  /* ========================================================================
     Boot Application
     ======================================================================== */

  function init() {
    state.trayOrder = shuffleArray(ELEMENTS.map((e) => e.z));
    buildPeriodicGridSkeleton();
    bindGlobalControls();
    renderBoard();
    renderTray();
  }

  init();
})();
