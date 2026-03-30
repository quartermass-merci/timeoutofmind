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
uniform float bass;
uniform float treble;

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
  // Bass churns the smoke — distorts UV space
  float bassWarp = bass * 0.3;
  uv*=vec2(2.0 + bassWarp, 1.0);
  float speed = 0.015 + bass * 0.02;
  float n=fbm(uv*(.28 + treble * 0.1)-vec2(T*.01,0));
  n=noise(uv*3.+n*(2.0 + bass * 1.5));
  col.r-=fbm(uv+vec2(0,T*speed)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*speed)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*speed)+n+.006);
  // Sunset tint when treble is high
  vec3 smokeColor=mix(vec3(0.24,0.20,0.15), vec3(0.35,0.18,0.18), treble * 0.6);
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
  const bassLoc = gl.getUniformLocation(program, 'bass');
  const trebleLoc = gl.getUniformLocation(program, 'treble');
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
    // Audio-reactive uniforms
    const ar = window._audioReactive;
    gl.uniform1f(bassLoc, ar ? ar.getBass() : 0);
    gl.uniform1f(trebleLoc, ar ? ar.getTreble() : 0);
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


/* ===== OVERDRIVE: AUDIO-REACTIVE SMOKE ===== */
(function() {
  const audio = document.getElementById('audio-element');
  const canvas = document.querySelector('.smoke-canvas');
  if (!audio || !canvas) return;

  let audioCtx, analyser, source, dataArray, connected = false;

  function connectAudio() {
    if (connected) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      connected = true;
    } catch(e) { /* silent fail — smoke still works without audio reactivity */ }
  }

  // Connect on first play
  audio.addEventListener('play', connectAudio, { once: true });

  // Expose getAudioData for the smoke shader to consume
  window._audioReactive = {
    getBass: function() {
      if (!connected || !analyser) return 0;
      analyser.getByteFrequencyData(dataArray);
      // Average of first 8 bins (low frequencies / bass)
      let sum = 0;
      for (let i = 0; i < 8; i++) sum += dataArray[i];
      return (sum / 8) / 255;
    },
    getTreble: function() {
      if (!connected || !analyser) return 0;
      analyser.getByteFrequencyData(dataArray);
      // Average of bins 40-80 (high frequencies)
      let sum = 0;
      for (let i = 40; i < 80; i++) sum += dataArray[i];
      return (sum / 40) / 255;
    }
  };
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
