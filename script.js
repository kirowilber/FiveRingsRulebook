(function() {
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
    'damage':'nav-ch2',
    'firearms':'nav-ch2',
    'martial-arts':'nav-ch2',
    'chapter-3':'nav-ch3',
    'status-effects':'nav-ch3',
    'wealth':'nav-ch3',
    'languages':'nav-ch3',
    'chapter-4':'nav-ch4',
    'advantages':'nav-ch4',
    'skills-list':'nav-ch4',
    'chapter-5':'nav-ch5',
    'equipment':'nav-app',
  };

  const anchors = Object.keys(chapterMap)
    .map(function(id){ return document.getElementById(id); })
    .filter(Boolean);

  function onScroll() {
    const y = window.scrollY + 140;
    let cur = anchors[0];
    anchors.forEach(function(a){ if(a.offsetTop <= y) cur = a; });
    const cid = chapterMap[cur.id];
    if (cid) {
      document.querySelectorAll('.nav-chapter').forEach(function(c){
        c.classList.toggle('open', c.id === cid);
      });
    }
    document.querySelectorAll('.nav-section-link, .nav-chapter-link').forEach(function(a){
      const href = (a.getAttribute('href')||'').replace('#','');
      a.classList.toggle('active', href === cur.id);
    });
  }

  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();