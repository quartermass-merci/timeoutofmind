/* ===== NAVIGATION ===== */
(function() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('mobile-overlay');
  const heroSection = document.getElementById('hero');

  // Sticky nav: transparent on hero, opaque elsewhere
  const observer = new IntersectionObserver(([entry]) => {
    const onHero = entry.isIntersecting;
    navbar.classList.toggle('scrolled', !onHero);
    navbar.classList.toggle('nav-hero', onHero);
  }, { threshold: 0.1 });
  observer.observe(heroSection);

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
  });

  // Close overlay on link click
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active nav link
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => sectionObserver.observe(s));
})();


/* ===== PLAYER PASSWORD GATE ===== */
(function() {
  var HASH = 'eea88569bf8c343040de44a47f29739633ae3735e36fb28afe4b560ee1de2192';
  var gate = document.getElementById('player-gate');
  var form = document.getElementById('gate-form');
  var input = document.getElementById('gate-input');
  var error = document.getElementById('gate-error');
  var player = document.getElementById('audio-player');

  if (!gate || !player) return;

  // Check if already unlocked this session
  if (sessionStorage.getItem('toomrc-unlocked') === '1') {
    gate.classList.add('unlocked');
  } else {
    player.classList.add('locked');
  }

  async function sha256(str) {
    var buf = new TextEncoder().encode(str);
    var hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(function(b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    error.classList.remove('visible');
    var digest = await sha256(input.value);
    if (digest === HASH) {
      sessionStorage.setItem('toomrc-unlocked', '1');

      // 1. Success flash on input + button
      input.classList.add('success');
      document.querySelector('.gate-btn').classList.add('success');

      // 2. After a beat, start the unlock sequence
      setTimeout(function() {
        // Fade out the gate
        gate.classList.add('unlocking');

        // Spawn warm glow behind player
        var glow = document.createElement('div');
        glow.className = 'player-unlock-glow';
        document.getElementById('listen').appendChild(glow);

        // After gate fades, reveal the player with staggered entrance
        setTimeout(function() {
          gate.classList.add('unlocked');
          player.classList.remove('locked');
          player.classList.add('visible', 'entering');

          // Clean up glow after animation
          setTimeout(function() {
            if (glow.parentNode) glow.parentNode.removeChild(glow);
            player.classList.remove('entering');
          }, 2000);
        }, 500);
      }, 400);

    } else {
      // Shake the form on wrong password
      form.classList.add('shake');
      error.classList.add('visible');
      input.value = '';
      input.focus();
      setTimeout(function() { form.classList.remove('shake'); }, 500);
    }
  });
})();

/* ===== AUDIO PLAYER ===== */
(function() {
  const audio = document.getElementById('audio-element');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const progressWrap = document.getElementById('progress-wrap');
  const progressBar = document.getElementById('progress-bar');
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const nowPlaying = document.getElementById('now-playing');
  const trackList = document.getElementById('track-list');
  const tracks = Array.from(trackList.querySelectorAll('li'));

  let currentIndex = -1;
  let isPlaying = false;

  function formatTime(s) {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function loadTrack(index) {
    tracks.forEach(t => t.classList.remove('active'));
    tracks[index].classList.add('active');
    currentIndex = index;
    audio.src = tracks[index].dataset.src;
    const artist = tracks[index].querySelector('.track-artist').textContent;
    const title = tracks[index].querySelector('.track-title').textContent;
    nowPlaying.textContent = `${artist} — ${title}`;
  }

  function play() {
    if (currentIndex === -1) loadTrack(0);
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = '&#10074;&#10074;';
    playBtn.classList.add('is-playing');
    const smokeCanvas = document.querySelector('.smoke-canvas');
    if (smokeCanvas) smokeCanvas.classList.add('active');
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '&#9654;';
    playBtn.classList.remove('is-playing');
  }

  playBtn.addEventListener('click', () => isPlaying ? pause() : play());

  prevBtn.addEventListener('click', () => {
    const idx = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
    loadTrack(idx);
    if (isPlaying) audio.play();
  });

  nextBtn.addEventListener('click', () => {
    const idx = currentIndex >= tracks.length - 1 ? 0 : currentIndex + 1;
    loadTrack(idx);
    if (isPlaying) audio.play();
  });

  tracks.forEach((track, i) => {
    track.addEventListener('click', () => {
      loadTrack(i);
      play();
    });
  });

  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = pct + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    const idx = currentIndex >= tracks.length - 1 ? 0 : currentIndex + 1;
    loadTrack(idx);
    play();
  });

  progressWrap.addEventListener('click', (e) => {
    const rect = progressWrap.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });
})();


/* ===== SMOKE SHADER (WebGL) ===== */
(function() {
  const listenSection = document.getElementById('listen');
  const canvas = document.createElement('canvas');
  canvas.className = 'smoke-canvas';
  listenSection.insertBefore(canvas, listenSection.firstChild);

  const gl = canvas.getContext('webgl2');
  if (!gl) return;

  const vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

  const fragmentSrc = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);
  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);
  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);
  vec3 smokeColor=vec3(0.24,0.20,0.15);
  col=mix(col,smokeColor,dot(col,vec3(.21,.71,.07)));
  col=mix(vec3(.08),col,min(time*.1,1.));
  col=clamp(col,.08,1.);
  O=vec4(col,1);
}`;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compileShader(gl.VERTEX_SHADER, vertexSrc);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,-1,-1,1,1,1,-1]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const resLoc = gl.getUniformLocation(program, 'resolution');
  const timeLoc = gl.getUniformLocation(program, 'time');
  let animId = null;
  let isVisible = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 1);
    const rect = listenSection.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize);

  function render(now) {
    if (!isVisible) { animId = null; return; }
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, now * 1e-3);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animId = requestAnimationFrame(render);
  }

  const smokeObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !animId) animId = requestAnimationFrame(render);
  }, { threshold: 0.05 });
  smokeObserver.observe(listenSection);
})();


/* ===== GALLERY SCROLLER ===== */
(function() {
  const rows = document.querySelectorAll('.scroll-row');

  rows.forEach(row => {
    const track = row.querySelector('.scroll-track');
    const speed = row.dataset.speed || 30;

    // Duplicate items for seamless loop
    const items = track.innerHTML;
    track.innerHTML = items + items;

    row.style.setProperty('--speed', speed + 's');
  });
})();


/* ===== LIGHTBOX ===== */
(function() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  // Only use the ORIGINAL images (first half), not the duplicated ones
  const scrollTrack = document.querySelector('.scroll-track');
  const totalOriginal = scrollTrack ? scrollTrack.children.length / 2 : 0;
  const allItems = Array.from(document.querySelectorAll('.scroll-item'));
  const originalImages = allItems.slice(0, totalOriginal).map(item => item.querySelector('img'));

  let currentIdx = 0;

  function open(index) {
    currentIdx = index % totalOriginal;
    lightboxImg.src = originalImages[currentIdx].src;
    lightboxImg.alt = originalImages[currentIdx].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prev() {
    currentIdx = currentIdx <= 0 ? originalImages.length - 1 : currentIdx - 1;
    lightboxImg.src = originalImages[currentIdx].src;
  }

  function next() {
    currentIdx = currentIdx >= originalImages.length - 1 ? 0 : currentIdx + 1;
    lightboxImg.src = originalImages[currentIdx].src;
  }

  // Attach click to ALL items (including duplicates) but map to original index
  allItems.forEach((item, i) => {
    item.addEventListener('click', () => open(i % totalOriginal));
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });
})();


/* ===== OVERDRIVE: SCROLL REVEALS ===== */
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const allReveal = Array.from(document.querySelectorAll('.reveal, .photo-break'));

  function checkReveals() {
    const vh = window.innerHeight;
    allReveal.forEach((el, i) => {
      if (el.classList.contains('visible')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.92 && rect.bottom > 0) {
        el.classList.add('visible');
      }
    });
  }

  // Check on scroll (throttled via rAF)
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { checkReveals(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  // Initial check
  checkReveals();

  // Rate price count-up animation
  const ratePrices = document.querySelectorAll('.rate-price');
  const priceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const text = el.textContent;
      const match = text.match(/\$[\d,]+/);
      if (!match) return;

      const target = parseInt(match[0].replace(/[$,]/g, ''));
      const per = el.querySelector('.rate-per');
      const perText = per ? per.textContent : '';
      const duration = 600;
      const start = performance.now();

      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const val = Math.round(target * ease);
        el.childNodes[0].textContent = '$' + val.toLocaleString();
        if (t < 1) requestAnimationFrame(tick);
        else el.classList.add('counted');
      }
      requestAnimationFrame(tick);
      priceObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  ratePrices.forEach(el => priceObserver.observe(el));
})();



/* ===== LEAFLET MAP ===== */
(function() {
  const lat = 42.1265;
  const lng = -82.8765;

  const map = L.map('map', {
    scrollWheelZoom: false,
    zoomControl: false
  }).setView([lat, lng], 14);

  // Muted tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(`
    <strong style="font-family:'Special Elite',monospace;font-size:14px">Time Out Of Mind Recording Co.</strong><br>
    <span style="font-family:'Courier Prime',monospace;font-size:12px">14451 Concession Road 14<br>
    Essex, Ontario</span><br>
    <a href="mailto:timeoutofmindrecordingco@gmail.com" style="color:#C4956A;font-size:12px">Email Us</a>
  `).openPopup();
})();

