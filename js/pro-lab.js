/**
 * Periodic Lab PRO v2.0 — UI & Interactive Module Controller
 * Powers: Splash Screen, XP & 12 Achievements, Periodic Trends Heatmaps,
 * JEE/NEET Rapid Quiz Battle, Molar Mass & Compound Lab, Voice Audio & Comparator!
 */
(function () {
  'use strict';

  const DATA = window.PERIODIC_DATA;
  const PRO = window.CHEM_PRO;
  const MNEM = window.MNEMONICS_DATA;
  const Sound = window.SoundFX;

  if (!DATA || !PRO) return;

  const ELEMENTS = DATA.ELEMENTS;
  const BY_Z = new Map(ELEMENTS.map((e) => [e.z, e]));
  const profile = PRO.loadProfile();

  let activeTrend = 'none';
  let inspectedZ = 11;
  let compareZ = 19; // Default rival (e.g. Na vs K)

  // Quiz state
  const quiz = {
    category: 'mixed',
    timed: true,
    timeLeft: 15,
    timerId: null,
    current: null,
    answered: false,
    score: 0,
    right: 0,
    total: 0,
    streak: 0,
    used5050: false,
    usedHint: false
  };

  // Compound Lab state
  const lab = {
    filterTag: 'All',
    search: '',
    currentFormula: 'CuSO4.5H2O'
  };

  /* ========================================================================
     1. Boot Splash & XP / Achievements Toast System
     ======================================================================== */

  function initSplash() {
    const splash = document.getElementById('appSplash');
    if (!splash) return;
    const dismiss = () => {
      if (splash.classList.contains('splash-hide')) return;
      splash.classList.add('splash-hide');
      setTimeout(() => {
        if (splash.parentNode) splash.remove();
      }, 420);
    };
    splash.addEventListener('click', dismiss);
    setTimeout(dismiss, 880);
  }

  let toastTimer = null;
  function showProToast(icon, title, sub) {
    const el = document.getElementById('proXpToast');
    if (!el) return;
    el.innerHTML = `<span style="font-size:18px">${icon}</span><div><div>${title}</div>${sub ? `<small style="color:var(--text-secondary);font-weight:600">${sub}</small>` : ''}</div>`;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function unlockBadge(id) {
    if (profile.badges.includes(id)) return false;
    const badge = PRO.ACHIEVEMENTS.find((b) => b.id === id);
    if (!badge) return false;
    profile.badges.push(id);
    PRO.saveProfile(profile);
    if (Sound) Sound.levelUp();
    showProToast(badge.icon, `Trophy Unlocked: ${badge.title}!`, badge.desc);
    return true;
  }

  function awardXP(amount, reasonLabel) {
    const beforeRank = PRO.getRankInfo(profile.xp).current.level;
    profile.xp += amount;
    const afterInfo = PRO.getRankInfo(profile.xp);
    const afterRank = afterInfo.current.level;

    if (afterRank >= 5) unlockBadge('level_5');
    PRO.saveProfile(profile);
    renderProfilePill();

    if (afterRank > beforeRank) {
      if (Sound) Sound.levelUp();
      showProToast(afterInfo.current.icon, `LEVEL UP! Lv.${afterRank} ${afterInfo.current.title}`, `+${amount} XP · ${reasonLabel}`);
    } else if (reasonLabel) {
      showProToast('✨', `+${amount} XP`, reasonLabel);
    }
  }

  function renderProfilePill() {
    const btn = document.getElementById('btnProfileXP');
    if (!btn) return;
    const info = PRO.getRankInfo(profile.xp);
    btn.innerHTML = `<span>${info.current.icon}</span><span class="xp-lvl">Lv.${info.current.level}</span><span>${profile.xp} XP</span>`;
    btn.title = `${info.current.title} (Lv.${info.current.level}) · Click to view Trophies & Stats`;
  }

  function openProfileModal() {
    const backdrop = document.getElementById('profileBackdrop');
    if (!backdrop) return;
    const info = PRO.getRankInfo(profile.xp);

    document.getElementById('profRankIcon').textContent = info.current.icon;
    document.getElementById('profRankTitle').textContent = `Lv.${info.current.level} · ${info.current.title}`;
    document.getElementById('profXpSub').textContent = info.next
      ? `${profile.xp} / ${info.next.xp} XP to reach ${info.next.title} · 🔥 ${profile.dailyStreak} Day Streak`
      : `${profile.xp} XP · MAX LEGEND RANK ACHIEVED! · 🔥 ${profile.dailyStreak} Day Streak`;
    document.getElementById('profXpFill').style.width = `${info.pct}%`;

    document.getElementById('profSolvedStat').textContent = String(profile.elementsSolvedTotal);
    document.getElementById('profQuizStat').textContent = String(profile.quizCorrectTotal);
    document.getElementById('profStreakStat').textContent = `${profile.bestStreak}x`;
    document.getElementById('profBadgesStat').textContent = `${profile.badges.length}/${PRO.ACHIEVEMENTS.length}`;

    const grid = document.getElementById('profBadgesGrid');
    grid.innerHTML = PRO.ACHIEVEMENTS.map((b) => {
      const unlocked = profile.badges.includes(b.id);
      return `
        <div class="badge-item ${unlocked ? 'unlocked' : ''}">
          <span class="badge-icon">${b.icon}</span>
          <div>
            <strong>${b.title} ${unlocked ? '✓' : '🔒'}</strong>
            <small>${b.desc}</small>
          </div>
        </div>
      `;
    }).join('');

    backdrop.classList.remove('hidden');
  }

  /* ========================================================================
     2. Periodic Trends Heatmap Overlay (Inside Study Mode)
     ======================================================================== */

  const TREND_CONFIGS = {
    en: {
      label: 'Electronegativity',
      min: 0.7,
      max: 4.0,
      minText: '0.79 (Cs)',
      maxText: '3.98 (F)',
      getVal: (el) => el.electronegativity,
      fmt: (v) => v.toFixed(2)
    },
    radius: {
      label: 'Atomic Radius',
      min: 31,
      max: 300,
      minText: '31 pm (He)',
      maxText: '298 pm (Cs)',
      getVal: (el) => PRO.getRadius(el.z),
      fmt: (v) => `${Math.round(v)} pm`
    },
    ie: {
      label: '1st Ionization',
      min: 375,
      max: 2375,
      minText: '376 (Cs)',
      maxText: '2372 kJ',
      getVal: (el) => PRO.getIonization(el.z),
      fmt: (v) => `${Math.round(v)}`
    },
    melt: {
      label: 'Melting Point',
      min: 14,
      max: 3800,
      minText: '14 K (H)',
      maxText: '3800 K (C)',
      getVal: (el) => el.meltK,
      fmt: (v) => `${Math.round(v)} K`
    }
  };

  function heatColor(norm) {
    const t = Math.max(0, Math.min(1, norm));
    // Smooth scientific multi-stop HSL/RGB interpolation: Deep Cyan -> Royal Violet -> Vivid Rose -> Solar Gold
    const stops = [
      [14, 165, 233],   // 0.00 Cyan
      [99, 102, 241],   // 0.35 Indigo
      [236, 72, 153],   // 0.70 Pink-Rose
      [245, 158, 11]    // 1.00 Gold-Amber
    ];
    const scaled = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(scaled));
    const f = scaled - i;
    const r = Math.round(stops[i][0] + (stops[i + 1][0] - stops[i][0]) * f);
    const g = Math.round(stops[i][1] + (stops[i + 1][1] - stops[i][1]) * f);
    const b = Math.round(stops[i][2] + (stops[i + 1][2] - stops[i][2]) * f);
    return {
      bg: `rgba(${r}, ${g}, ${b}, 0.30)`,
      border: `rgb(${r}, ${g}, ${b})`
    };
  }

  function applyTrendHeatmap() {
    const legendBar = document.getElementById('trendLegendBar');
    const cells = document.querySelectorAll('.pt-cell[data-z]');
    const appState = window.ArenaApp ? window.ArenaApp.getState() : null;

    if (!appState || appState.mode !== 'study' || activeTrend === 'none' || !TREND_CONFIGS[activeTrend]) {
      if (legendBar) legendBar.classList.add('hidden');
      cells.forEach((cell) => {
        if (cell.classList.contains('trend-cell')) {
          cell.classList.remove('trend-cell');
          cell.style.background = '';
          cell.style.borderColor = '';
        }
      });
      return;
    }

    const cfg = TREND_CONFIGS[activeTrend];
    if (legendBar) {
      legendBar.classList.remove('hidden');
      document.getElementById('trendMinLabel').textContent = cfg.minText;
      document.getElementById('trendMaxLabel').textContent = cfg.maxText;
    }

    cells.forEach((cell) => {
      const z = parseInt(cell.dataset.z, 10);
      const el = BY_Z.get(z);
      if (!el) return;
      const val = cfg.getVal(el);
      cell.classList.add('trend-cell');

      const nameNode = cell.querySelector('.cell-name');
      if (val === null || val === undefined) {
        cell.style.background = 'rgba(100, 116, 139, 0.12)';
        cell.style.borderColor = 'rgba(100, 116, 139, 0.28)';
        if (nameNode) nameNode.innerHTML = '<span class="trend-val-tag">N/A</span>';
        return;
      }

      const norm = (val - cfg.min) / (cfg.max - cfg.min);
      const col = heatColor(norm);
      cell.style.background = col.bg;
      cell.style.borderColor = col.border;
      if (nameNode) {
        nameNode.innerHTML = `<span class="trend-val-tag">${cfg.fmt(val)}</span>`;
      }
    });
  }

  /* ========================================================================
     3. Rapid Quiz Battle Engine (JEE / NEET / Class 11–12)
     ======================================================================== */

  function stopQuizTimer() {
    if (quiz.timerId) {
      clearInterval(quiz.timerId);
      quiz.timerId = null;
    }
  }

  function updateQuizStatsUI() {
    const acc = quiz.total > 0 ? Math.round((quiz.right / quiz.total) * 100) : 100;
    document.getElementById('quizScoreVal').textContent = String(quiz.score);
    document.getElementById('quizStreakVal').textContent = `${quiz.streak}🔥`;
    document.getElementById('quizAccVal').textContent = `${quiz.right}/${quiz.total} (${acc}%)`;
    const timerBtn = document.getElementById('btnQuizTimerMode');
    if (timerBtn) {
      timerBtn.textContent = quiz.timed ? '⏱️ 15s Blitz: ON' : '🧘 Untimed Mode';
      timerBtn.classList.toggle('active', quiz.timed);
    }
  }

  function loadNextQuizQuestion() {
    stopQuizTimer();
    quiz.answered = false;
    quiz.used5050 = false;
    quiz.usedHint = false;
    quiz.timeLeft = 15;
    quiz.current = PRO.generateQuizQuestion(quiz.category, ELEMENTS, MNEM);

    document.getElementById('quizQuestionText').textContent = quiz.current.q;
    document.getElementById('quizHintBox').classList.add('hidden');
    document.getElementById('quizExplainBar').classList.add('hidden');
    document.getElementById('btnQuiz5050').disabled = false;
    document.getElementById('btnQuizHint').disabled = false;

    const letters = ['A', 'B', 'C', 'D'];
    const optsGrid = document.getElementById('quizOptionsGrid');
    optsGrid.innerHTML = quiz.current.opts.map((optText, idx) => `
      <button type="button" class="quiz-opt-btn" data-opt-idx="${idx}">
        <span class="quiz-opt-key">${letters[idx]}</span>
        <span>${optText}</span>
      </button>
    `).join('');

    optsGrid.querySelectorAll('.quiz-opt-btn').forEach((btn) => {
      btn.addEventListener('click', () => submitQuizAnswer(parseInt(btn.dataset.optIdx, 10)));
    });

    const timerFill = document.getElementById('quizTimerFill');
    const timerTrack = document.getElementById('quizTimerTrack');
    if (quiz.timed) {
      timerTrack.classList.remove('hidden');
      timerFill.style.width = '100%';
      quiz.timerId = setInterval(() => {
        quiz.timeLeft = Math.max(0, +(quiz.timeLeft - 0.25).toFixed(2));
        timerFill.style.width = `${(quiz.timeLeft / 15) * 100}%`;
        if (quiz.timeLeft <= 0) {
          stopQuizTimer();
          submitQuizAnswer(-1);
        }
      }, 250);
    } else {
      timerTrack.classList.add('hidden');
    }

    updateQuizStatsUI();
  }

  function submitQuizAnswer(chosenIdx) {
    if (quiz.answered || !quiz.current) return;
    quiz.answered = true;
    stopQuizTimer();

    quiz.total += 1;
    profile.quizAttemptedTotal += 1;
    const isCorrect = chosenIdx === quiz.current.ans;

    const buttons = document.querySelectorAll('#quizOptionsGrid .quiz-opt-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === quiz.current.ans) btn.classList.add('opt-correct');
      else if (idx === chosenIdx) btn.classList.add('opt-wrong');
    });

    const expBar = document.getElementById('quizExplainBar');
    const expText = document.getElementById('quizExplainText');
    expBar.classList.remove('hidden');

    if (isCorrect) {
      quiz.right += 1;
      quiz.streak += 1;
      const bonus = Math.min(quiz.streak, 6) * 20;
      quiz.score += 100 + bonus;

      profile.quizCorrectTotal += 1;
      if (quiz.streak > profile.bestStreak) profile.bestStreak = quiz.streak;

      if (Sound) Sound.correct(quiz.streak);
      expText.innerHTML = `<strong style="color:var(--correct)">✓ Sahi Jawab! (+${100 + bonus} pts)</strong> — ${quiz.current.exp}`;

      awardXP(20 + Math.min(quiz.streak * 3, 15), 'Quiz Battle Answer');
      if (quiz.streak >= 5) unlockBadge('streak_5');
      if (quiz.streak >= 10) unlockBadge('streak_10');
      if (profile.quizCorrectTotal >= 5) unlockBadge('quiz_rookie');
      if (profile.quizCorrectTotal >= 25) unlockBadge('quiz_ace');
    } else {
      quiz.streak = 0;
      if (Sound) Sound.wrong();
      const prefix = chosenIdx === -1 ? '⏰ Time Up!' : '✗ Galat Jawab!';
      expText.innerHTML = `<strong style="color:var(--wrong)">${prefix}</strong> — ${quiz.current.exp}`;
      PRO.saveProfile(profile);
    }

    updateQuizStatsUI();
  }

  /* ========================================================================
     4. Compound & Molar Mass Pro Lab Engine
     ======================================================================== */

  function analyzeFormulaNow(formulaStr, countAchievement = false) {
    lab.currentFormula = formulaStr;
    const input = document.getElementById('labFormulaInput');
    if (input && input.value !== formulaStr) input.value = formulaStr;

    const res = PRO.parseChemicalFormula(formulaStr, ELEMENTS);
    const outBox = document.getElementById('labResultContainer');

    if (!res.ok) {
      outBox.innerHTML = `<div class="quiz-hint-box" style="border-color:var(--wrong);background:var(--wrong-soft)">⚠️ ${res.error}</div>`;
      return;
    }

    if (countAchievement) {
      profile.compoundsAnalyzed += 1;
      awardXP(8, `Analyzed ${res.formula}`);
      if (profile.compoundsAnalyzed >= 5) unlockBadge('compound_chef');
    }

    const palette = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#818cf8', '#fb923c'];
    const barSegments = res.breakdown.map((b, i) => {
      const col = palette[i % palette.length];
      return `<div style="width:${b.percent.toFixed(2)}%;background:${col}" title="${b.symbol}: ${b.percent.toFixed(1)}%"></div>`;
    }).join('');

    const atomRows = res.breakdown.map((b, i) => {
      const col = palette[i % palette.length];
      return `
        <div class="comp-atom-row" data-inspect-z="${b.z}" title="Click to inspect ${b.name} 3D Bohr shells">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:10px;height:10px;border-radius:50%;background:${col};display:inline-block"></span>
            <strong>${b.symbol}</strong>
            <span style="color:var(--text-secondary)">${b.name} × <strong>${b.count}</strong></span>
          </div>
          <div class="mono" style="font-size:11.5px">
            ${b.subMass.toFixed(3)} g/mol · <strong style="color:${col}">${b.percent.toFixed(1)}%</strong> ↗
          </div>
        </div>
      `;
    }).join('');

    const famousMarkup = res.famous
      ? `<div class="famous-note-box">
           <strong>🧪 ${res.famous.name}</strong> <span style="opacity:0.8">(${res.famous.state})</span><br/>
           ${res.famous.note}
         </div>`
      : '';

    outBox.innerHTML = `
      <div class="molar-hero-box">
        <div>
          <div style="font-size:11px;color:var(--text-secondary);font-weight:700">EXACT MOLAR MASS (${res.formula})</div>
          <div class="molar-big-num">${res.molarMass.toFixed(4)} <span style="font-size:13px;font-weight:700">g/mol</span></div>
        </div>
        <div style="text-align:right;font-size:12px">
          <div><strong>${res.totalAtoms}</strong> Total Atoms</div>
          <div style="color:var(--text-secondary)"><strong>${res.elementTypes}</strong> Distinct Elements</div>
        </div>
      </div>
      ${famousMarkup}
      <div class="mass-bar-stack" aria-label="Mass percentage bar chart">${barSegments}</div>
      <div class="comp-rows">${atomRows}</div>
    `;

    outBox.querySelectorAll('[data-inspect-z]').forEach((row) => {
      row.addEventListener('click', () => {
        const z = parseInt(row.dataset.inspectZ, 10);
        if (window.ArenaApp) window.ArenaApp.openInspector(z);
      });
    });

    document.querySelectorAll('.compound-preset-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.formula === res.formula);
    });
  }

  function renderCompoundsGallery() {
    const listEl = document.getElementById('labCompoundsList');
    if (!listEl) return;
    const q = lab.search.trim().toLowerCase();
    const filtered = PRO.FAMOUS_COMPOUNDS.filter((c) => {
      if (lab.filterTag !== 'All' && c.tag !== lab.filterTag) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        c.note.toLowerCase().includes(q)
      );
    });

    listEl.innerHTML = filtered.map((c) => `
      <button type="button" class="compound-preset-card ${c.formula === lab.currentFormula ? 'active' : ''}" data-formula="${c.formula}">
        <div class="compound-preset-top">
          <span class="compound-formula-pill mono">${c.formula}</span>
          <span style="font-size:9.5px;color:var(--text-muted)">${c.tag}</span>
        </div>
        <span class="compound-name-txt">${c.name}</span>
        <span class="compound-state-txt">${c.state}</span>
      </button>
    `).join('');

    listEl.querySelectorAll('.compound-preset-card').forEach((card) => {
      card.addEventListener('click', () => {
        if (Sound) Sound.pickup();
        analyzeFormulaNow(card.dataset.formula, true);
      });
    });
  }

  /* ========================================================================
     5. Enhanced Bohr Element Inspector (Voice Audio + Element Comparator)
     ======================================================================== */

  function renderComparisonBars() {
    const a = BY_Z.get(inspectedZ);
    const b = BY_Z.get(compareZ);
    const container = document.getElementById('compareBarsContainer');
    if (!a || !b || !container) return;

    const metrics = [
      { label: 'Atomic Mass (u)', va: PRO.numericMass(a.mass), vb: PRO.numericMass(b.mass), fmt: (v) => v.toFixed(2) },
      { label: 'Electronegativity', va: a.electronegativity || 0, vb: b.electronegativity || 0, fmt: (v) => (v ? v.toFixed(2) : 'N/A') },
      { label: '1st Ionization (kJ/mol)', va: PRO.getIonization(a.z) || 0, vb: PRO.getIonization(b.z) || 0, fmt: (v) => (v ? `${v}` : 'N/A') },
      { label: 'Atomic Radius (pm)', va: PRO.getRadius(a.z) || 0, vb: PRO.getRadius(b.z) || 0, fmt: (v) => (v ? `${v} pm` : 'N/A') },
      { label: 'Melting Point (K)', va: a.meltK || 0, vb: b.meltK || 0, fmt: (v) => (v ? `${v} K` : 'N/A') }
    ];

    container.innerHTML = metrics.map((m) => {
      const top = Math.max(m.va, m.vb, 0.001);
      const pa = Math.round((m.va / top) * 100);
      const pb = Math.round((m.vb / top) * 100);
      return `
        <div class="cmp-row">
          <div class="cmp-label-line">
            <strong style="color:var(--accent)">${a.symbol}: ${m.fmt(m.va)}</strong>
            <span>${m.label}</span>
            <strong style="color:#ec4899">${b.symbol}: ${m.fmt(m.vb)}</strong>
          </div>
          <div class="cmp-dual-track">
            <div class="cmp-half"><div class="cmp-fill-a" style="width:${pa}%"></div></div>
            <div class="cmp-half"><div class="cmp-fill-b" style="width:${pb}%"></div></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function enhanceInspectorForZ(z) {
    inspectedZ = z;
    const el = BY_Z.get(z);
    if (!el) return;

    const radNode = document.getElementById('specRadius');
    const ieNode = document.getElementById('specIonization');
    const oxNode = document.getElementById('specOxidation');

    const r = PRO.getRadius(z);
    const ie = PRO.getIonization(z);
    if (radNode) radNode.textContent = r ? `${r} pm` : '—';
    if (ieNode) ieNode.textContent = ie ? `${ie} kJ/mol` : '—';
    if (oxNode) oxNode.textContent = PRO.getOxidation(z, el);

    const cmpSelect = document.getElementById('compareElementSelect');
    if (cmpSelect) {
      if (compareZ === z) compareZ = z === 1 ? 2 : z - 1;
      cmpSelect.value = String(compareZ);
    }
    renderComparisonBars();
  }

  /* ========================================================================
     6. Wire All Events & Boot Pro Modules
     ======================================================================== */

  function bindProUI() {
    initSplash();
    renderProfilePill();

    // Profile modal triggers
    const profBtn = document.getElementById('btnProfileXP');
    const profBackdrop = document.getElementById('profileBackdrop');
    const btnCloseProf = document.getElementById('btnCloseProfile');
    if (profBtn) profBtn.addEventListener('click', () => {
      if (Sound) Sound.pickup();
      openProfileModal();
    });
    if (btnCloseProf) btnCloseProf.addEventListener('click', () => profBackdrop.classList.add('hidden'));
    if (profBackdrop) {
      profBackdrop.addEventListener('click', (e) => {
        if (e.target === profBackdrop) profBackdrop.classList.add('hidden');
      });
    }

    // Periodic Trend Heatmap select
    const trendSelect = document.getElementById('trendSelect');
    if (trendSelect) {
      trendSelect.addEventListener('change', () => {
        activeTrend = trendSelect.value;
        if (Sound) Sound.pickup();
        if (activeTrend !== 'none') unlockBadge('trends_explorer');
        if (window.ArenaApp) window.ArenaApp.renderBoard();
        applyTrendHeatmap();
      });
    }

    // Speak Element Dossier aloud
    const speakBtn = document.getElementById('btnSpeakElement');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        const el = BY_Z.get(inspectedZ);
        if (!el || !Sound) return;
        const ok = Sound.speak(
          `${el.name}, symbol ${el.symbol.split('').join(' ')}. Atomic number ${el.z}. ${el.categoryLabel}, Period ${el.period}, Group ${el.group}. ${el.fact}`
        );
        if (!ok) showProToast('🔊', el.name, `Z=${el.z} · ${el.config}`);
      });
    }

    // Populate Compare dropdown
    const cmpSelect = document.getElementById('compareElementSelect');
    if (cmpSelect) {
      cmpSelect.innerHTML = ELEMENTS.map(
        (e) => `<option value="${e.z}">Z=${e.z} · ${e.symbol} (${e.name})</option>`
      ).join('');
      cmpSelect.value = String(compareZ);
      cmpSelect.addEventListener('change', () => {
        compareZ = parseInt(cmpSelect.value, 10) || 1;
        if (Sound) Sound.pickup();
        unlockBadge('atom_comparator');
        renderComparisonBars();
      });
    }

    // Quiz Battle controls
    document.querySelectorAll('[data-quiz-cat]').forEach((pill) => {
      pill.addEventListener('click', () => {
        quiz.category = pill.dataset.quizCat;
        document.querySelectorAll('[data-quiz-cat]').forEach((p) => p.classList.toggle('active', p === pill));
        if (Sound) Sound.pickup();
        loadNextQuizQuestion();
      });
    });

    const btnQuizTimer = document.getElementById('btnQuizTimerMode');
    if (btnQuizTimer) {
      btnQuizTimer.addEventListener('click', () => {
        quiz.timed = !quiz.timed;
        if (Sound) Sound.pickup();
        loadNextQuizQuestion();
      });
    }

    const btnQuiz5050 = document.getElementById('btnQuiz5050');
    if (btnQuiz5050) {
      btnQuiz5050.addEventListener('click', () => {
        if (quiz.answered || quiz.used5050 || !quiz.current) return;
        quiz.used5050 = true;
        btnQuiz5050.disabled = true;
        if (Sound) Sound.hint();
        const wrongIndices = [0, 1, 2, 3].filter((i) => i !== quiz.current.ans);
        wrongIndices.sort(() => Math.random() - 0.5);
        const btns = document.querySelectorAll('#quizOptionsGrid .quiz-opt-btn');
        wrongIndices.slice(0, 2).forEach((idx) => {
          if (btns[idx]) btns[idx].classList.add('opt-eliminated');
        });
      });
    }

    const btnQuizHint = document.getElementById('btnQuizHint');
    if (btnQuizHint) {
      btnQuizHint.addEventListener('click', () => {
        if (!quiz.current || quiz.usedHint) return;
        quiz.usedHint = true;
        btnQuizHint.disabled = true;
        if (Sound) Sound.hint();
        const box = document.getElementById('quizHintBox');
        box.innerHTML = `💡 <strong>Smart Clue:</strong> ${quiz.current.hint}`;
        box.classList.remove('hidden');
      });
    }

    const btnQuizSpeak = document.getElementById('btnQuizSpeak');
    if (btnQuizSpeak) {
      btnQuizSpeak.addEventListener('click', () => {
        if (quiz.current && Sound) {
          Sound.speak(`${quiz.current.q}. Options: ${quiz.current.opts.join(', ')}`);
        }
      });
    }

    const btnNextQ = document.getElementById('btnNextQuizQ');
    if (btnNextQ) {
      btnNextQ.addEventListener('click', () => {
        if (Sound) Sound.pickup();
        loadNextQuizQuestion();
      });
    }

    // Compound Lab controls
    const keypad = document.getElementById('labKeypad');
    const formulaInput = document.getElementById('labFormulaInput');
    if (keypad && formulaInput) {
      const keys = ['H', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'S', 'Cl', 'K', 'Ca', 'Cr', 'Mn', 'Fe', 'Cu', 'Zn', '(', ')', '2', '3', '4', '.5H2O'];
      keypad.innerHTML =
        keys.map((k) => `<button type="button" class="keypad-chip mono" data-key="${k}">${k}</button>`).join('') +
        '<button type="button" class="keypad-chip" id="btnLabClear" style="color:var(--wrong)">⌫ Clear</button>';

      keypad.querySelectorAll('[data-key]').forEach((b) => {
        b.addEventListener('click', () => {
          if (Sound) Sound.tick();
          formulaInput.value += b.dataset.key;
          analyzeFormulaNow(formulaInput.value, false);
        });
      });

      document.getElementById('btnLabClear').addEventListener('click', () => {
        formulaInput.value = '';
        formulaInput.focus();
      });

      formulaInput.addEventListener('input', () => analyzeFormulaNow(formulaInput.value, false));
      document.getElementById('labFormulaForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (Sound) Sound.pickup();
        analyzeFormulaNow(formulaInput.value, true);
      });
    }

    const compSearch = document.getElementById('labCompoundSearch');
    if (compSearch) {
      compSearch.addEventListener('input', () => {
        lab.search = compSearch.value;
        renderCompoundsGallery();
      });
    }

    document.querySelectorAll('[data-comp-tag]').forEach((btn) => {
      btn.addEventListener('click', () => {
        lab.filterTag = btn.dataset.compTag;
        document.querySelectorAll('[data-comp-tag]').forEach((b) => b.classList.toggle('active', b === btn));
        renderCompoundsGallery();
      });
    });

    // Bridge listeners from core app.js
    window.addEventListener('pt:modechange', (e) => {
      const m = e.detail.mode;
      const quizView = document.getElementById('quizStageView');
      const labView = document.getElementById('labStageView');
      if (quizView) quizView.classList.toggle('hidden', m !== 'quiz');
      if (labView) labView.classList.toggle('hidden', m !== 'lab');

      if (m === 'quiz') {
        loadNextQuizQuestion();
      } else {
        stopQuizTimer();
      }

      if (m === 'lab') {
        renderCompoundsGallery();
        analyzeFormulaNow(lab.currentFormula || 'CuSO4.5H2O', false);
      }

      if (m === 'study') {
        applyTrendHeatmap();
      }
    });

    window.addEventListener('pt:boardrender', () => {
      applyTrendHeatmap();
    });

    window.addEventListener('pt:inspect', (e) => {
      enhanceInspectorForZ(e.detail.z);
    });

    window.addEventListener('pt:correct', (e) => {
      const cnt = e.detail.count || 1;
      const streak = e.detail.streak || 1;
      profile.elementsSolvedTotal += cnt;
      if (streak > profile.bestStreak) profile.bestStreak = streak;

      awardXP(cnt * 15 + Math.min(streak * 2, 12), cnt > 1 ? `${cnt} Exam Elements Sahi!` : `Z=${e.detail.z} Placed!`);
      unlockBadge('first_atom');
      if (streak >= 5) unlockBadge('streak_5');
      if (streak >= 10) unlockBadge('streak_10');
      if (profile.elementsSolvedTotal >= 20) unlockBadge('solved_20');
      if (profile.elementsSolvedTotal >= 118) unlockBadge('solved_118');
    });

    window.addEventListener('pt:win', () => {
      profile.challengesWon += 1;
      awardXP(120, 'Challenge Board Completed!');
      unlockBadge('challenge_winner');
    });

    // Keyboard shortcuts in Quiz Mode (1-4 to pick A-D, N/ArrowRight for next question)
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const st = window.ArenaApp ? window.ArenaApp.getState() : null;
      if (!st || st.mode !== 'quiz') return;

      if (!quiz.answered && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const btns = document.querySelectorAll('#quizOptionsGrid .quiz-opt-btn');
        if (btns[idx] && !btns[idx].classList.contains('opt-eliminated')) {
          submitQuizAnswer(idx);
        }
      } else if (quiz.answered && (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight' || e.key === ' ')) {
        e.preventDefault();
        loadNextQuizQuestion();
      }
    });
  }

  bindProUI();
})();
