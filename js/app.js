/**
 * Periodic Table Arena — Interactive Drag & Drop Chemistry Lab Engine
 * Features:
 *   - Live Check Mode (Instant Sahi / Galat feedback, combo streaks, progressive mnemonic hints)
 *   - Exam Sheet Mode (Free fill, cell-to-cell drag/swap, batch Sahi/Galat grading)
 *   - Study Reference Mode (Full 118 table, Kelvin/Celsius phase simulator, animated SVG Bohr models)
 *   - Multi-Option & Custom Editable Desi Mnemonics Studio (3 presets per series + custom editor saved in localStorage)
 *   - Android Phone & Tablet Fullscreen + 2D Scroll + Smart Touch-Drag Disambiguation
 */
(function () {
  'use strict';

  const { ELEMENTS, CATEGORIES } = window.PERIODIC_DATA;
  const MNEMONICS = window.MNEMONICS_DATA;
  const Sound = window.SoundFX;

  const BY_Z = new Map();
  const BY_SYMBOL = new Map();
  const BY_NAME = new Map();

  ELEMENTS.forEach((el) => {
    BY_Z.set(el.z, el);
    BY_SYMBOL.set(el.symbol.toLowerCase(), el);
    BY_NAME.set(el.name.toLowerCase(), el);
  });

  const GROUP_SUBLABELS = {
    1: 'IA', 2: 'IIA', 3: 'IIIB', 4: 'IVB', 5: 'VB', 6: 'VIB', 7: 'VIIB',
    8: 'VIIIB', 9: 'VIIIB', 10: 'VIIIB', 11: 'IB', 12: 'IIB',
    13: 'IIIA', 14: 'IVA', 15: 'VA', 16: 'VIA', 17: 'VIIA', 18: 'VIIIA'
  };

  const state = {
    mode: 'live',          // 'live' | 'exam' | 'study'
    scope: 'all',          // 'all' | 'first20' | 'first36' | 'sp' | 'd' | 'f'
    boardClue: 'blank',    // 'blank' | 'numbers' | 'categories'
    tileClue: 'both',      // 'both' | 'symbol' | 'name' | 'config'
    deckMode: 'all',       // 'all' | 'wave'
    searchQuery: '',
    activeCategory: null,
    studyBlock: 'all',
    studyTempK: 298,

    trayOrder: [],
    trayCollapsed: false,
    solvedSet: new Set(),
    examPlacements: new Map(), // slotZ -> placedElementZ
    examWrongSlots: new Set(),

    selectedTileZ: null,
    selectedSlotZ: null,
    hintTargetZ: null,
    lastInspectedZ: 1,

    mnemTab: 'd',
    mnemSelfTest: false,
    editingSeriesId: null,

    wrongAttemptsPerZ: new Map(),
    mistakes: [],
    score: 0,
    wrongCount: 0,
    streak: 0,
    elapsedSec: 0,
    timerRunning: false,
    timerId: null
  };

  const dom = {
    appShell: document.querySelector('.app-shell'),
    boardWrapper: document.querySelector('.board-wrapper'),
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
    btnMnemonics: document.getElementById('btnMnemonics'),
    btnHint: document.getElementById('btnHint'),
    btnReset: document.getElementById('btnReset'),
    btnZoomToggle: document.getElementById('btnZoomToggle'),
    btnMobileFilters: document.getElementById('btnMobileFilters'),
    btnFullscreen: document.getElementById('btnFullscreen'),
    btnSound: document.getElementById('btnSound'),
    btnTheme: document.getElementById('btnTheme'),
    btnMistakes: document.getElementById('btnMistakes'),
    btnDeckAll: document.getElementById('btnDeckAll'),
    btnDeckWave: document.getElementById('btnDeckWave'),
    btnShuffle: document.getElementById('btnShuffle'),
    btnToggleTray: document.getElementById('btnToggleTray'),

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
    btnExploreAfterWin: document.getElementById('btnExploreAfterWin'),

    mnemonicsBackdrop: document.getElementById('mnemonicsBackdrop'),
    btnCloseMnemonics: document.getElementById('btnCloseMnemonics'),
    btnMnemSelfTest: document.getElementById('btnMnemSelfTest'),
    btnPracticeBlock: document.getElementById('btnPracticeBlock'),
    mnemonicsBody: document.getElementById('mnemonicsBody')
  };

  const cellElements = new Map();
  const groupHeaders = new Map();
  const periodHeaders = new Map();
  let progressLabelEl = null;
  let progressFillEl = null;
  let hoverCoordEl = null;
  let dragPayload = null;

  /* ========================================================================
     Scope, Position Helpers & Dynamic Mnemonic Hints
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
    const mnem = MNEMONICS ? MNEMONICS.getForElement(el.z) : null;
    if (wrongCountForEl >= 3) {
      return `Exact spot: ${positionLabel(el)} (${el.categoryLabel}, Z=${el.z}).`;
    }
    if (wrongCountForEl === 2) {
      if (mnem) {
        return `Trick (${mnem.seriesBadge}): ${mnem.highlighted}`;
      }
      return `Closer clue: ${el.symbol} (Z=${el.z}) sits in Period ${el.period} inside the ${el.block}-block!`;
    }
    if (mnem) {
      return `Z=${el.z} (${el.block}-block) · Word Clue: "${mnem.word}" in "${mnem.line}"`;
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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ========================================================================
     Timer & Scoreboard
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
     Build Periodic Table Grid Skeleton & Render Board/Tray
     ======================================================================== */

  function buildPeriodicGridSkeleton() {
    dom.grid.innerHTML = '';
    cellElements.clear();
    groupHeaders.clear();
    periodHeaders.clear();

    const corner = document.createElement('div');
    corner.className = 'axis-period';
    corner.style.gridRow = '1';
    corner.style.gridColumn = '1';
    corner.textContent = 'P\\G';
    corner.title = 'Periods (rows 1–7) and Groups (columns 1–18)';
    dom.grid.appendChild(corner);

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

    createBridgeCell(7, 4, '57–71', 'La–Lu', 'lanthanide');
    createBridgeCell(8, 4, '89–103', 'Ac–Lr', 'actinide');

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

    ELEMENTS.forEach((el) => {
      const cell = document.createElement('div');
      cell.className = 'pt-cell empty';
      cell.dataset.z = String(el.z);
      cell.dataset.symbol = el.symbol;
      cell.dataset.period = String(el.period);
      cell.dataset.group = String(el.group);
      cell.style.setProperty('--cell-cat-color', CATEGORIES[el.category].color);

      const cssRow = el.gridRow + 1;
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

    bridge.addEventListener('click', () => toggleCategoryFilter(targetCategory));
    bridge.addEventListener('dragover', (e) => {
      e.preventDefault();
      bridge.classList.add('drag-over');
    });
    bridge.addEventListener('dragleave', () => bridge.classList.remove('drag-over'));
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

    const keepFlash = cell.classList.contains('wrong-flash');
    cell.className = 'pt-cell';
    if (keepFlash) cell.classList.add('wrong-flash');
    cell.removeAttribute('draggable');

    if (state.hintTargetZ === el.z) cell.classList.add('hint-target');
    if (state.selectedSlotZ === el.z) cell.classList.add('slot-selected');

    const catMismatch = state.activeCategory && el.category !== state.activeCategory;
    const blockMismatch = state.mode === 'study' && state.studyBlock !== 'all' && el.block !== state.studyBlock;
    if (catMismatch || blockMismatch) {
      cell.classList.add('dimmed');
    }

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

    if (!inScope) {
      cell.classList.add('out-of-scope');
      cell.dataset.state = 'locked';
      cell.innerHTML = `<div class="cell-sym" style="font-size:11px;opacity:0.45">${el.symbol}</div>`;
      return;
    }

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
    dom.trayDock.classList.toggle('collapsed', state.trayCollapsed);
    if (dom.btnToggleTray) {
      dom.btnToggleTray.textContent = state.trayCollapsed ? '▲ Tray' : '▼ Tray';
    }

    const placedInExamSet = new Set(state.examPlacements.values());
    const allRemaining = state.trayOrder
      .map((z) => BY_Z.get(z))
      .filter((el) => isElementInScope(el) && !state.solvedSet.has(el.z) && !placedInExamSet.has(el.z));

    dom.remainingCount.textContent = `${allRemaining.length} left`;

    if (state.selectedTileZ && BY_Z.get(state.selectedTileZ)) {
      const sel = BY_Z.get(state.selectedTileZ);
      dom.selectedTileBanner.classList.remove('hidden');
      dom.selectedTileBanner.innerHTML = `Selected: <strong>${sel.symbol}</strong> (${sel.name}) — tap slot! <span style="margin-left:5px;text-decoration:underline;cursor:pointer">Cancel ×</span>`;
    } else {
      dom.selectedTileBanner.classList.add('hidden');
    }

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
     Drag & Drop + Android Smart Touch-Drag + Dual-Axis Auto-Panning
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

  function isTouchPrimary() {
    return Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function bindTileEvents(tile, el) {
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

    bindTouchDrag(tile, () => ({ z: el.z, fromSlotZ: null }), el.symbol);
  }

  function bindCellEvents(cell, slotEl) {
    cell.addEventListener('mouseenter', () => highlightAxes(slotEl, true));
    cell.addEventListener('mouseleave', () => highlightAxes(slotEl, false));

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

    cell.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove-slot]');
      if (removeBtn) {
        e.stopPropagation();
        removeExamPlacement(slotEl.z);
        return;
      }

      if (state.mode === 'study' || state.solvedSet.has(slotEl.z)) {
        openInspector(slotEl.z);
        return;
      }

      if (!isElementInScope(slotEl)) return;

      if (state.selectedTileZ !== null) {
        const chosenZ = state.selectedTileZ;
        state.selectedTileZ = null;
        handleDropAttempt(slotEl.z, chosenZ, null);
        return;
      }

      openQuickSlotPopover(slotEl, cell);
    });

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
    let pendingPayload = null;
    let dragActive = false;
    let gestureCanceled = false;
    let startX = 0;
    let startY = 0;
    let curX = 0;
    let curY = 0;
    let lastHoveredCell = null;
    let rafId = null;

    function updateAutoScroll() {
      if (!dragActive) return;
      const edge = 56;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let vx = 0;
      let vy = 0;

      if (curX < edge) {
        vx = -Math.min(12, Math.ceil((edge - curX) / 5));
      } else if (curX > vw - edge) {
        vx = Math.min(12, Math.ceil((curX - (vw - edge)) / 5));
      }

      if (curY < edge) {
        vy = -Math.min(11, Math.ceil((edge - curY) / 5));
      } else if (curY > vh - edge) {
        vy = Math.min(11, Math.ceil((curY - (vh - edge)) / 5));
      }

      if (vx !== 0 && dom.boardWrapper) {
        dom.boardWrapper.scrollLeft += vx;
      }
      if (vy !== 0 && dom.appShell) {
        dom.appShell.scrollTop += vy;
      }
      if (vx !== 0 || vy !== 0) {
        refreshHoveredTarget(curX, curY);
      }
      rafId = requestAnimationFrame(updateAutoScroll);
    }

    function refreshHoveredTarget(x, y) {
      const under = document.elementFromPoint(x, y);
      const cell = under ? under.closest('.pt-cell') : null;
      if (lastHoveredCell && lastHoveredCell !== cell) {
        lastHoveredCell.classList.remove('drag-over');
      }
      if (cell && !cell.classList.contains('solved') && !cell.classList.contains('out-of-scope')) {
        cell.classList.add('drag-over');
        lastHoveredCell = cell;
        const slotZ = parseInt(cell.dataset.z, 10);
        if (BY_Z.get(slotZ)) highlightAxes(BY_Z.get(slotZ), true);
      }
    }

    function cleanupDrag() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (lastHoveredCell) {
        lastHoveredCell.classList.remove('drag-over');
        lastHoveredCell = null;
      }
      if (ghost) {
        ghost.remove();
        ghost = null;
      }
      sourceNode.classList.remove('dragging');
      pendingPayload = null;
      dragActive = false;
      gestureCanceled = false;
    }

    sourceNode.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const payload = getPayloadFn();
      if (!payload) return;

      pendingPayload = payload;
      dragActive = false;
      gestureCanceled = false;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      curX = touch.clientX;
      curY = touch.clientY;
    }, { passive: true });

    sourceNode.addEventListener('touchmove', (e) => {
      if (!pendingPayload || gestureCanceled) return;
      const touch = e.touches[0];
      curX = touch.clientX;
      curY = touch.clientY;
      const dx = curX - startX;
      const dy = curY - startY;

      if (!dragActive) {
        const dist = Math.hypot(dx, dy);
        if (dist < 8) return;

        // Horizontal swipe on tray scrolls naturally without hijacking
        if (pendingPayload.fromSlotZ === null && Math.abs(dx) > Math.abs(dy) * 1.15) {
          gestureCanceled = true;
          pendingPayload = null;
          return;
        }

        dragActive = true;
        const el = BY_Z.get(pendingPayload.z);
        sourceNode.classList.add('dragging');
        Sound.pickup();

        ghost = document.createElement('div');
        ghost.className = 'touch-drag-ghost';
        ghost.innerHTML = `<strong class="tile-sym">${fixedLabel || el.symbol}</strong><span class="tile-sub">${el.name}</span>`;
        ghost.style.left = `${curX}px`;
        ghost.style.top = `${curY}px`;
        document.body.appendChild(ghost);
        rafId = requestAnimationFrame(updateAutoScroll);
      }

      e.preventDefault();
      if (ghost) {
        ghost.style.left = `${curX}px`;
        ghost.style.top = `${curY}px`;
      }
      refreshHoveredTarget(curX, curY);
    }, { passive: false });

    sourceNode.addEventListener('touchend', (e) => {
      if (!dragActive || !pendingPayload) {
        cleanupDrag();
        return;
      }
      const touch = e.changedTouches[0];
      const payload = pendingPayload;
      cleanupDrag();

      const under = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = under ? under.closest('.pt-cell') : null;
      if (cell && cell.dataset.z) {
        handleDropAttempt(parseInt(cell.dataset.z, 10), payload.z, payload.fromSlotZ);
      }
    });

    sourceNode.addEventListener('touchcancel', cleanupDrag);
  }

  /* ========================================================================
     Sahi / Galat Placement Engine
     ======================================================================== */

  function handleDropAttempt(slotZ, placedZ, fromSlotZ = null) {
    const slotEl = BY_Z.get(slotZ);
    const placedEl = BY_Z.get(placedZ);
    if (!slotEl || !placedEl) return;
    if (!isElementInScope(slotEl) || state.solvedSet.has(slotZ)) return;

    ensureTimerStarted();
    closeQuickSlotPopover();

    if (state.mode === 'exam') {
      if (fromSlotZ === slotZ) return;

      const existingInTarget = state.examPlacements.get(slotZ);
      if (fromSlotZ !== null) {
        if (existingInTarget !== undefined) {
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
     Smart Hint, Quick Slot Entry & Bohr Inspector
     ======================================================================== */

  function triggerHint() {
    if (state.mode === 'study') return;

    const placedInExamSet = new Set(state.examPlacements.values());
    let candidateZ = state.selectedTileZ;

    if (!candidateZ || state.solvedSet.has(candidateZ)) {
      const remaining = state.trayOrder.find((z) => {
        const el = BY_Z.get(z);
        return isElementInScope(el) && !state.solvedSet.has(z) && !placedInExamSet.has(z);
      });
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
      targetCell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    const mnem = MNEMONICS ? MNEMONICS.getForElement(el.z) : null;
    const mnemSuffix = mnem ? ` · Trick word: "${mnem.word}"` : '';

    setFeedback(
      'hint',
      '💡 HINT',
      `Selected ${el.symbol} (${el.name}): Pulsing golden slot at ${positionLabel(el)}${mnemSuffix}!`
    );
  }

  function openQuickSlotPopover(slotEl, cellNode) {
    if (state.selectedSlotZ === slotEl.z) {
      closeQuickSlotPopover();
      return;
    }

    state.selectedSlotZ = slotEl.z;
    renderBoard();

    const rect = cellNode.getBoundingClientRect();
    const popWidth = 240;
    const left = Math.min(Math.max(12, rect.left - 60), window.innerWidth - popWidth - 12);
    const top = Math.min(rect.bottom + 6, window.innerHeight - 135);

    dom.slotQuickTitle.textContent = `Slot: ${positionLabel(slotEl)}`;
    dom.slotQuickModal.style.left = `${left}px`;
    dom.slotQuickModal.style.top = `${top}px`;
    dom.slotQuickModal.classList.remove('hidden');
    dom.slotQuickField.value = '';

    if (!isTouchPrimary()) {
      setTimeout(() => dom.slotQuickField.focus(), 10);
    } else {
      Sound.pickup();
      setFeedback(
        'neutral',
        'SLOT SELECTED',
        `Selected ${positionLabel(slotEl)} — tap any element tile below to place here, or tap the input box to type!`
      );
    }
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

    const inspMnemEl = document.getElementById('inspMnemonic');
    const mnemInfo = MNEMONICS ? MNEMONICS.getForElement(el.z) : null;
    if (inspMnemEl && mnemInfo) {
      inspMnemEl.classList.remove('hidden');
      inspMnemEl.innerHTML = `<strong>🧠 ${escapeHtml(mnemInfo.seriesBadge)}:</strong> "${escapeHtml(mnemInfo.word)}" → <span>${escapeHtml(mnemInfo.line)}</span>`;
    } else if (inspMnemEl) {
      inspMnemEl.classList.add('hidden');
    }

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
     Multi-Option + Custom User-Editable Mnemonics Studio
     ======================================================================== */

  function renderMnemonicsBody() {
    const tabData = MNEMONICS.TABS[state.mnemTab];
    if (!tabData || !dom.mnemonicsBody) return;

    document.querySelectorAll('[data-mnem-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mnemTab === state.mnemTab);
    });

    if (dom.btnPracticeBlock) {
      dom.btnPracticeBlock.textContent = tabData.practiceLabel;
    }
    if (dom.btnMnemSelfTest) {
      dom.btnMnemSelfTest.classList.toggle('active', state.mnemSelfTest);
      dom.btnMnemSelfTest.textContent = state.mnemSelfTest ? '👁️ Show All Symbols' : '🙈 Self-Test';
    }

    dom.mnemonicsBody.innerHTML = '';

    tabData.series.forEach((rawSeries) => {
      const s = MNEMONICS.getResolvedSeries(rawSeries);
      const isEditing = state.editingSeriesId === s.id;
      const card = document.createElement('div');
      card.className = 'mnem-series-card';
      card.dataset.seriesId = s.id;

      const optionPillsHtml = s.options
        .map((opt, idx) => {
          const isActive = s.activeChoice === idx;
          return `<button type="button" class="mnem-opt-pill ${isActive ? 'active' : ''}" data-select-opt="${idx}" data-series="${s.id}">
            ${isActive ? '✓ ' : ''}${escapeHtml(opt.label)}
          </button>`;
        })
        .join('');

      const customPillHtml = s.hasCustom
        ? `<button type="button" class="mnem-opt-pill ${s.activeChoice === 'custom' ? 'active' : ''}" data-select-opt="custom" data-series="${s.id}">
            ${s.activeChoice === 'custom' ? '✓ ' : ''}★ Mera Custom
          </button>`
        : '';

      const pairsHtml = s.pairs
        .map(
          ([sym, z, word]) => `
          <div class="mnem-chip ${state.mnemSelfTest ? 'masked' : ''}" data-mnem-z="${z}" title="Click to ${state.mnemSelfTest ? 'reveal symbol' : `inspect ${sym} (Z=${z})`}">
            <span class="mnem-chip-top">${z}</span>
            <span class="mnem-chip-sym">${sym}</span>
            <span class="mnem-chip-word">${escapeHtml(word)}</span>
          </div>
        `
        )
        .join('');

      let editorHtml = '';
      if (isEditing) {
        const draftLine = s.customEntry ? s.customEntry.line : s.line;
        const draftWords = s.customEntry ? s.customEntry.words : s.pairs.map((p) => p[2]);

        const wordBoxes = s.elements
          .map(
            ([sym, z], idx) => `
            <label class="mnem-word-item">
              <span>${z} · ${sym}</span>
              <input type="text" data-word-idx="${idx}" value="${escapeHtml(draftWords[idx] || '')}" placeholder="${sym} word" />
            </label>
          `
          )
          .join('');

        editorHtml = `
          <div class="mnem-editor-box" data-editor-for="${s.id}">
            <label class="mnem-editor-label">✏️ Apna Khud Ka Mnemonic Sentence Likho (Space se words apne aap neeche elements me bhar jayenge!):</label>
            <div class="mnem-editor-row">
              <input type="text" class="mnem-line-input" data-line-input="${s.id}" value="${escapeHtml(draftLine)}" placeholder="Type apna mnemonic sentence here..." />
              <button type="button" class="chip-btn" data-auto-split="${s.id}">⚡ Auto-Split Words</button>
            </div>
            <div class="mnem-word-inputs">${wordBoxes}</div>
            <div class="mnem-editor-actions">
              ${s.hasCustom ? `<button type="button" class="action-btn ghost-btn" data-delete-custom="${s.id}">🗑️ Delete Custom</button>` : ''}
              <button type="button" class="action-btn ghost-btn" data-cancel-edit="${s.id}">Cancel</button>
              <button type="button" class="action-btn check-btn" data-save-custom="${s.id}">💾 Save &amp; Use My Mnemonic</button>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="mnem-card-head">
          <span class="mnem-series-badge">${escapeHtml(s.badge)}</span>
          <div class="mnem-options-bar">
            ${optionPillsHtml}
            ${customPillHtml}
            <button type="button" class="mnem-edit-btn" data-toggle-edit="${s.id}">
              ${isEditing ? '✕ Close Editor' : '✏️ Khud Likho / Edit'}
            </button>
          </div>
        </div>
        <p class="mnem-line">“${escapeHtml(s.line)}”</p>
        <div class="mnem-pairs">${pairsHtml}</div>
        ${editorHtml}
        <p class="mnem-note">💡 ${escapeHtml(s.note)}</p>
      `;

      dom.mnemonicsBody.appendChild(card);
    });

    // Wire option preset pills
    dom.mnemonicsBody.querySelectorAll('[data-select-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const seriesId = btn.dataset.series;
        const rawOpt = btn.dataset.selectOpt;
        const choice = rawOpt === 'custom' ? 'custom' : parseInt(rawOpt, 10);
        MNEMONICS.selectOption(seriesId, choice);
        Sound.pickup();
        renderMnemonicsBody();
      });
    });

    // Wire Edit / Khud Likho toggle
    dom.mnemonicsBody.querySelectorAll('[data-toggle-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const seriesId = btn.dataset.toggleEdit;
        state.editingSeriesId = state.editingSeriesId === seriesId ? null : seriesId;
        Sound.pickup();
        renderMnemonicsBody();
      });
    });

    // Wire Live Sentence Auto-Split & Editor Save/Cancel/Delete buttons
    if (state.editingSeriesId) {
      const editorBox = dom.mnemonicsBody.querySelector(`[data-editor-for="${state.editingSeriesId}"]`);
      if (editorBox) {
        const lineInput = editorBox.querySelector(`[data-line-input="${state.editingSeriesId}"]`);
        const wordInputs = [...editorBox.querySelectorAll('[data-word-idx]')];

        const syncWordsFromSentence = () => {
          const split = MNEMONICS.splitLineIntoWords(lineInput.value, wordInputs.length);
          wordInputs.forEach((inp, idx) => {
            inp.value = split[idx];
          });
        };

        lineInput.addEventListener('input', syncWordsFromSentence);

        const autoBtn = editorBox.querySelector('[data-auto-split]');
        if (autoBtn) autoBtn.addEventListener('click', syncWordsFromSentence);

        const cancelBtn = editorBox.querySelector('[data-cancel-edit]');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            state.editingSeriesId = null;
            renderMnemonicsBody();
          });
        }

        const delBtn = editorBox.querySelector('[data-delete-custom]');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            MNEMONICS.deleteCustomMnemonic(state.editingSeriesId);
            state.editingSeriesId = null;
            Sound.pickup();
            renderMnemonicsBody();
          });
        }

        const saveBtn = editorBox.querySelector('[data-save-custom]');
        if (saveBtn) {
          saveBtn.addEventListener('click', () => {
            const customWords = wordInputs.map((inp) => inp.value.trim());
            MNEMONICS.saveCustomMnemonic(state.editingSeriesId, lineInput.value, customWords);
            state.editingSeriesId = null;
            Sound.correct(2);
            renderMnemonicsBody();
          });
        }
      }
    }

    // Wire element chip click (Self-Test flip OR open Bohr Inspector)
    dom.mnemonicsBody.querySelectorAll('.mnem-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const z = parseInt(chip.dataset.mnemZ, 10);
        if (state.mnemSelfTest && chip.classList.contains('masked')) {
          chip.classList.remove('masked');
          chip.classList.add('revealed');
          Sound.correct(1);
          return;
        }
        dom.mnemonicsBackdrop.classList.add('hidden');
        openInspector(z);
      });
    });
  }

  function openMnemonicsModal(defaultTab = state.mnemTab) {
    state.mnemTab = defaultTab || 'd';
    state.editingSeriesId = null;
    renderMnemonicsBody();
    dom.mnemonicsBackdrop.classList.remove('hidden');
  }

  /* ========================================================================
     Mode Switching, Filters & Global Controls
     ======================================================================== */

  function setMode(newMode) {
    state.mode = newMode;
    closeQuickSlotPopover();
    state.selectedTileZ = null;
    state.hintTargetZ = null;

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
      if (state.trayCollapsed) state.trayCollapsed = false;
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

    if (dom.btnToggleTray) {
      dom.btnToggleTray.addEventListener('click', () => {
        state.trayCollapsed = !state.trayCollapsed;
        Sound.pickup();
        renderTray();
      });
    }

    dom.btnCheckExam.addEventListener('click', checkExamSheet);
    if (dom.btnMnemonics) {
      dom.btnMnemonics.addEventListener('click', () => openMnemonicsModal(state.mnemTab));
    }
    dom.btnHint.addEventListener('click', triggerHint);
    dom.btnReset.addEventListener('click', resetChallenge);

    dom.btnFeedbackInspect.addEventListener('click', () => {
      openInspector(state.lastInspectedZ);
    });

    document.querySelectorAll('.block-pill[data-block]').forEach((pill) => {
      pill.addEventListener('click', () => {
        state.studyBlock = pill.dataset.block;
        document.querySelectorAll('.block-pill[data-block]').forEach((p) => p.classList.toggle('active', p === pill));
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
      const metaTheme = document.getElementById('metaThemeColor');
      if (metaTheme) {
        metaTheme.setAttribute('content', current === 'dark' ? '#090e1a' : '#f1f5f9');
      }
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

    dom.selectedTileBanner.addEventListener('click', () => {
      state.selectedTileZ = null;
      Sound.pickup();
      renderTray();
    });

    if (dom.btnZoomToggle) {
      dom.btnZoomToggle.addEventListener('click', () => {
        const isFit = dom.grid.classList.toggle('mobile-fit');
        dom.btnZoomToggle.textContent = isFit ? '🔍' : '🗺️';
        dom.btnZoomToggle.title = isFit ? 'Switch to Thumb Comfort Zoom' : 'Switch to Full 18-Column Overview';
        Sound.pickup();
      });
    }

    if (dom.btnMobileFilters) {
      dom.btnMobileFilters.addEventListener('click', () => {
        const activePanel = state.mode === 'study' ? dom.studyControls : dom.playControls;
        const opened = activePanel.classList.toggle('mobile-open');
        dom.btnMobileFilters.style.borderColor = opened ? 'var(--accent)' : '';
        Sound.pickup();
      });
    }

    // Smooth Fullscreen Mode (preserves full 2D scrolling in both Portrait & Landscape!)
    if (dom.btnFullscreen) {
      dom.btnFullscreen.addEventListener('click', async () => {
        try {
          const docEl = document.documentElement;
          const reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
          const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
          if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (reqFs) await reqFs.call(docEl);
          } else if (exitFs) {
            await exitFs.call(document);
          }
        } catch (_) {}
      });
    }

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

    dom.btnMistakes.addEventListener('click', openMistakesModal);
    dom.btnCloseInspector.addEventListener('click', () => dom.inspectorBackdrop.classList.add('hidden'));
    dom.btnCloseMistakes.addEventListener('click', () => dom.mistakesBackdrop.classList.add('hidden'));
    dom.btnCloseWin.addEventListener('click', () => dom.winBackdrop.classList.add('hidden'));
    if (dom.btnCloseMnemonics) {
      dom.btnCloseMnemonics.addEventListener('click', () => dom.mnemonicsBackdrop.classList.add('hidden'));
    }
    if (dom.btnMnemSelfTest) {
      dom.btnMnemSelfTest.addEventListener('click', () => {
        state.mnemSelfTest = !state.mnemSelfTest;
        Sound.pickup();
        renderMnemonicsBody();
      });
    }
    if (dom.btnPracticeBlock) {
      dom.btnPracticeBlock.addEventListener('click', () => {
        const tabData = MNEMONICS.TABS[state.mnemTab];
        const targetScope = tabData ? tabData.practiceScope : 'd';
        dom.mnemonicsBackdrop.classList.add('hidden');
        if (state.mode === 'study') setMode('live');
        dom.scopeSelect.value = targetScope;
        state.scope = targetScope;
        resetChallenge();
      });
    }
    document.querySelectorAll('[data-mnem-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.mnemTab = btn.dataset.mnemTab;
        state.editingSeriesId = null;
        Sound.pickup();
        renderMnemonicsBody();
      });
    });

    dom.btnPlayAgain.addEventListener('click', resetChallenge);
    dom.btnExploreAfterWin.addEventListener('click', () => {
      dom.winBackdrop.classList.add('hidden');
      setMode('study');
    });

    [dom.inspectorBackdrop, dom.mistakesBackdrop, dom.winBackdrop, dom.mnemonicsBackdrop].forEach((backdrop) => {
      if (!backdrop) return;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.add('hidden');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeQuickSlotPopover();
        dom.inspectorBackdrop.classList.add('hidden');
        dom.mistakesBackdrop.classList.add('hidden');
        dom.winBackdrop.classList.add('hidden');
        if (dom.mnemonicsBackdrop) dom.mnemonicsBackdrop.classList.add('hidden');
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
      } else if (e.key === 'm' || e.key === 'M') {
        openMnemonicsModal(state.mnemTab);
      } else if (e.key === 'Enter' && state.mode === 'exam') {
        checkExamSheet();
      }
    });
  }

  function init() {
    state.trayOrder = shuffleArray(ELEMENTS.map((e) => e.z));
    buildPeriodicGridSkeleton();
    bindGlobalControls();
    renderBoard();
    renderTray();
  }

  init();
})();
