(function() {

/* SIDEBAR + SCROLL SPY */

  const sidebar   = document.getElementById('sidebar');
  const toggle    = document.getElementById('sidebar-toggle');
  const main      = document.getElementById('main-content');
  const label     = toggle.querySelector('.toggle-label');
  const icon      = toggle.querySelector('.toggle-icon');
  const MOBILE_BP = 900;
  let isMobile = window.innerWidth <= MOBILE_BP;
  let open = !isMobile;

  function applyState() {
    if (isMobile) {
      sidebar.classList.toggle('open', open);
      sidebar.classList.remove('collapsed');
      toggle.classList.remove('collapsed');
      main.classList.remove('expanded');
    } else {
      sidebar.classList.toggle('collapsed', !open);
      sidebar.classList.remove('open');
      toggle.classList.toggle('collapsed', !open);
      main.classList.toggle('expanded', !open);
    }
    label.textContent = open ? 'Hide' : 'Nav';
    icon.textContent  = open ? '◀' : '▶';
  }
  toggle.addEventListener('click', function() { open = !open; applyState(); });
  window.addEventListener('resize', function() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= MOBILE_BP;
    if (wasMobile !== isMobile) { open = !isMobile; applyState(); }
  });
  applyState();

  // Chapter accordion
  document.querySelectorAll('.nav-chapter-link[data-chapter]').forEach(function(link) {
    link.addEventListener('click', function() {
      const id = this.dataset.chapter;
      const el = document.getElementById(id);
      const was = el.classList.contains('open');
      document.querySelectorAll('.nav-chapter').forEach(function(c) { c.classList.remove('open'); });
      if (!was) el.classList.add('open');
    });
  });

  // Scroll spy
  const chapterMap = {
    'cover':'', 
    'toc':'',
    'chapter-1':'nav-ch1', 
    'character-creation':'nav-ch1',
    'rings-traits':'nav-ch1', 
    'skill-checks':'nav-ch1',
    'chapter-2':'nav-ch2', 
    'initiative':'nav-ch2',
    'defense':'nav-ch2', 
    'attacking':'nav-ch2',
    'damage':'nav-ch2', 
    'firearms':'nav-ch2',
    'martial-arts':'nav-ch2', 
    'spirit-recovery':'nav-ch2',
    'chapter-3':'nav-ch3', 
    'status-effects':'nav-ch3',
    'wealth':'nav-ch3', 
    'languages':'nav-ch3', 
    'social':'nav-ch3',
    'chapter-4':'nav-ch4', 
    'advantages':'nav-ch4', 
    'skills-list':'nav-ch4',
    'chapter-5':'nav-ch5',
    'equipment':'nav-app',
    'char-sheet':'nav-sheet',
  };
  var anchors = Object.keys(chapterMap).map(function (id) { return document.getElementById(id); }).filter(Boolean);

function onScroll() {
    var y = window.scrollY + 140, cur = anchors[0];
    anchors.forEach(function (a) { if (a.offsetTop <= y) cur = a; });
    var cid = chapterMap[cur.id];
    if (cid) document.querySelectorAll('.nav-chapter').forEach(function (c) { c.classList.toggle('open', c.id === cid); });
    document.querySelectorAll('.nav-section-link,.nav-chapter-link').forEach(function (a) {
      a.classList.toggle('active', (a.getAttribute('href') || '').replace('#', '') === cur.id);
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* CHARACTER SHEET STATE */
  var traits = {
    agility:0, intelligence:0,
    strength:0, perception:0,
    reflexes:0, awareness:0,
    stamina:0,  willpower:0,
    'spirit-max':0, 'spirit-cur':0,
  };

  var ringPairs = {
    fire:  ['agility',  'intelligence'],
    water: ['strength', 'perception'],
    air:   ['reflexes', 'awareness'],
    earth: ['stamina',  'willpower'],
  };

  var dwCount = 0;

  /* DERIVED CALCULATIONS */
  function calcRing(name) {
    if (name === 'spirit') return traits['spirit-max'];
    var p = ringPairs[name];
    return Math.floor((traits[p[0]] + traits[p[1]]) / 2);
  }

  function getRingSum() {
    return ['fire','water','air','earth'].reduce(function(s,r){ return s + calcRing(r); }, 0) + traits['spirit-max'];
  }

  /* UPDATE ALL DERIVED DISPLAYS */
  function updateAll() {
    updateRings();
    updateActionDice();
    updatePassiveTN();
    updateWoundCheck();
    updateDWDots();        // regenerate dots if earth ring changed
    updateDWColors();
    updateStatusChips();
  }

  function updateRings() {
    ['fire','water','air','earth','spirit'].forEach(function(ring) {
      var el = document.getElementById('ring-' + ring);
      if (el) el.textContent = calcRing(ring) || '—';
    });
  }

  function updateActionDice() {
    var v   = (document.querySelector('input[name="action-variant"]:checked') || {}).value || 'plus1';
    var sum = getRingSum();
    var res = Math.floor(sum / 5) + (v === 'plus1' ? 1 : 0);
    var fml = document.getElementById('action-formula');
    var rel = document.getElementById('action-result');
    if (fml) fml.textContent = (v === 'plus1' ? '1 + ' : '') + sum + ' ÷ 5 = ' + (sum > 0 ? res : '—');
    if (rel) rel.textContent = sum > 0 ? res : '—';
  }

  function updatePassiveTN() {
    var v = (document.querySelector('input[name="tn-variant"]:checked') || {}).value || 'plus5';
    var water = calcRing('water'), air = calcRing('air');
    var plus  = v === 'plus5' ? 5 : 0;
    var hint  = v === 'plus5' ? '5 + Ring×5' : 'Ring×5';
    var pm = document.getElementById('passive-melee'),
        pr = document.getElementById('passive-ranged'),
        pmf= document.getElementById('passive-melee-formula'),
        prf= document.getElementById('passive-ranged-formula');
    if (pm)  pm.textContent  = water ? water * 5 + plus : '—';
    if (pr)  pr.textContent  = air   ? air   * 5 + plus : '—';
    if (pmf) pmf.textContent = water ? '(' + hint + ')' : '';
    if (prf) prf.textContent = air   ? '(' + hint + ')' : '';
  }

  function updateWoundCheck() {
    // Wound check = Stamina K Stamina
    var sta = traits.stamina;
    var val = sta ? sta + 'K' + sta : '—';
    var el1 = document.getElementById('wound-check-val');
    var el2 = document.getElementById('wound-check-val-r');
    if (el1) el1.textContent = val;
    if (el2) el2.textContent = val;
  }

  /* DRAMATIC WOUND DOTS
    Earth Ring determines total dots:
      dots = earth × 2  (the incap threshold)
      or at least 6 for display when earth = 0 */
  function updateDWDots() {
    var earth    = calcRing('earth');
    var total    = earth > 0 ? earth * 2 : 6;   // show 6 neutral dots when unset
    var box      = document.getElementById('dw-boxes');
    var note     = document.getElementById('dw-threshold-note');
    if (!box) return;

    // Only rebuild if count changed
    var existing = box.querySelectorAll('.cs-dw-dot').length;
    if (existing !== total) {
      box.innerHTML = '';
      for (var i = 1; i <= total; i++) {
        var span = document.createElement('span');
        span.className = 'cs-dw-dot';
        span.dataset.idx = i;
        span.addEventListener('click', onDWClick);
        box.appendChild(span);
      }
      // Clamp dwCount to the new total
      if (dwCount > total) dwCount = total;
    }

    if (note) {
      note.textContent = earth > 0
        ? '(Crippled: ' + earth + ' · Incap: ' + (earth*2) + ')'
        : '';
    }
  }

  function onDWClick() {
    var idx = parseInt(this.dataset.idx);
    dwCount = (dwCount >= idx) ? idx - 1 : idx;
    updateDWColors();
    updateStatusChips();
  }

  function updateDWColors() {
    var earth = calcRing('earth');
    document.querySelectorAll('.cs-dw-dot').forEach(function(dot) {
      var idx = parseInt(dot.dataset.idx);
      dot.classList.toggle('filled', idx <= dwCount);
      dot.classList.remove('cs-dw-healthy','cs-dw-crippled','cs-dw-incap');
      if (earth > 0) {
        // idx < earth  → healthy (filling these is fine)
        // idx === earth → crippled threshold (this wound tips you into Crippled)
        // idx > earth && idx < earth*2 → still crippled zone
        // idx === earth*2 → incapacitated threshold (this wound tips you into Incap)
        if      (idx < earth)           dot.classList.add('cs-dw-healthy');
        else if (idx < earth * 2)       dot.classList.add('cs-dw-crippled');
        else                            dot.classList.add('cs-dw-incap');
      }
    });
  }

  /* STATUS CHIPS — driven by FW input + DW */
  function updateStatusChips() {
    var earth  = calcRing('earth');
    var fwEl   = document.getElementById('fw-input');
    var fw     = fwEl ? (parseInt(fwEl.value) || 0) : 0;
    var active = earth > 0;

    var healthy  = document.getElementById('status-healthy');
    var crippled = document.getElementById('status-crippled');
    var incap    = document.getElementById('status-incap');

    // Status is driven by dramatic wounds
    if (healthy)  healthy.classList.toggle('active',  active && dwCount < earth);
    if (crippled) crippled.classList.toggle('active', active && dwCount >= earth && dwCount < earth * 2);
    if (incap)    incap.classList.toggle('active',    active && dwCount >= earth * 2);
  }

  // Listen to flesh-wound input changes
  var fwInput = document.getElementById('fw-input');
  if (fwInput) {
    fwInput.addEventListener('input', function() {
      updateStatusChips();
    });
  }

  /* TRAIT DOT-PIPS */
  document.querySelectorAll('.cs-dots').forEach(function(group) {
    var dots     = group.querySelectorAll('.cs-dot');
    var traitKey = group.dataset.trait;
    var input    = group.parentElement.querySelector('.cs-trait-num');

    function setVal(v) {
      if (traitKey === 'spirit-cur') v = Math.min(v, traits['spirit-max']);
      v = Math.max(0, Math.min(5, v));
      traits[traitKey] = v;
      group.dataset.val = v;
      dots.forEach(function(d, j) { d.classList.toggle('filled', j < v); });
      if (input) input.value = v || '';
      updateAll();
    }

    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() {
        setVal((parseInt(group.dataset.val) || 0) === i + 1 ? 0 : i + 1);
      });
    });

    if (input) {
      input.addEventListener('input', function() {
        var v = parseInt(this.value) || 0;
        if (traitKey !== 'spirit-cur') v = Math.min(5, v);
        traits[traitKey] = Math.max(0, Math.min(5, v));
        group.dataset.val = traits[traitKey];
        dots.forEach(function(d, j) { d.classList.toggle('filled', j < traits[traitKey]); });
        updateAll();
      });
    }
  });

  /* VARIANT RADIO TOGGLES */
  document.querySelectorAll('input[name="action-variant"], input[name="tn-variant"]').forEach(function(r) {
    r.addEventListener('change', updateAll);
  });

  /* TABLE ROW ADD + DELETE */
  window.csAddRow = function(btn) {
    var tbody = document.getElementById(btn.dataset.target);
    var tpl   = tbody.querySelector('tr').cloneNode(true);
    tpl.querySelectorAll('[contenteditable]').forEach(function(d) { d.textContent = ''; });
    tpl.querySelectorAll('input').forEach(function(i) { i.value = ''; });
    tbody.appendChild(tpl);
    // Re-attach delete handler on the new row's button
    var del = tpl.querySelector('.cs-row-del');
    if (del) del.addEventListener('click', function() { csDelRow(this); });
  };

  window.csDelRow = function(btn) {
    var row = btn.closest('tr');
    var tbody = row.parentNode;
    // Always keep at least one row
    if (tbody.querySelectorAll('tr').length > 1) {
      row.remove();
    } else {
      // Clear instead of delete if it's the last row
      row.querySelectorAll('[contenteditable]').forEach(function(d) { d.textContent = ''; });
      row.querySelectorAll('input').forEach(function(i) { i.value = ''; });
    }
  };

  // Attach delete listeners to pre-existing rows
  document.querySelectorAll('.cs-row-del').forEach(function(btn) {
    btn.addEventListener('click', function() { csDelRow(this); });
  });

  // Show delete button only on row hover/focus 
  // (CSS handles this, but ensure the button is 
  // wired on any dynamically added rows via csAddRow above)

  // Init
  updateAll();

})();