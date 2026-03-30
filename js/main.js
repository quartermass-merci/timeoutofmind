/* ===== NAVIGATION ===== */
(function() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('mobile-overlay');
  const heroSection = document.getElementById('hero');

  // Sticky nav on scroll
  const observer = new IntersectionObserver(([entry]) => {
    navbar.classList.toggle('scrolled', !entry.isIntersecting);
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
    const src = tracks[index].dataset.src;
    audio.src = src;
    const artist = tracks[index].querySelector('.track-artist').textContent;
    const title = tracks[index].querySelector('.track-title').textContent;
    nowPlaying.textContent = `${artist} — ${title}`;
  }

  function play() {
    if (currentIndex === -1) loadTrack(0);
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = '&#10074;&#10074;';
    // Activate smoke
    const smokeCanvas = document.querySelector('.smoke-canvas');
    if (smokeCanvas) smokeCanvas.classList.add('active');
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '&#9654;';
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

  // Only render when the section is visible
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

    // Set speed via CSS custom property
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

  const allImages = Array.from(document.querySelectorAll('.scroll-item img'));
  let currentIdx = 0;

  function open(index) {
    currentIdx = index;
    lightboxImg.src = allImages[index].src;
    lightboxImg.alt = allImages[index].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prev() {
    currentIdx = currentIdx <= 0 ? allImages.length - 1 : currentIdx - 1;
    lightboxImg.src = allImages[currentIdx].src;
  }

  function next() {
    currentIdx = currentIdx >= allImages.length - 1 ? 0 : currentIdx + 1;
    lightboxImg.src = allImages[currentIdx].src;
  }

  allImages.forEach((img, i) => {
    img.parentElement.addEventListener('click', () => open(i));
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


/* ===== SCROLL REVEAL ===== */
(function() {
  const revealElements = document.querySelectorAll('#listen .section-title, #watch .section-title, #about .section-title, #rates .section-title, #gear .section-title, #gallery .section-title, #contact .section-title, .rate-card, .gear-category, .rates-remember, .rates-extras, .contact-info, .contact-map, .video-item, .about-text p, .about-photo, .gear-photo, .section-coda p');

  revealElements.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // Stagger rate cards and gear categories
  document.querySelectorAll('.rate-card').forEach((card, i) => {
    card.style.transitionDelay = (i * 0.1) + 's';
  });
  document.querySelectorAll('.gear-category').forEach((cat, i) => {
    cat.style.transitionDelay = (i * 0.08) + 's';
  });
  document.querySelectorAll('.section-coda p').forEach((p, i) => {
    p.style.transitionDelay = (i * 0.15) + 's';
  });
})();


/* ===== LEAFLET MAP ===== */
(function() {
  const lat = 42.1265;
  const lng = -82.8765;

  const map = L.map('map', {
    scrollWheelZoom: false,
    zoomControl: false
  }).setView([lat, lng], 14);

  // Muted tile layer for aesthetic cohesion
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
