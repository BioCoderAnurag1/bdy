// Confetti System
const confettiColors = [
  '#e05a26', // Orange
  '#d4af37', // Gold
  '#ffd700', // Yellow
  '#a8dadc', // Light Blue
  '#ffffff', // White
  '#f16e3a'  // Light Orange
];

class ConfettiParticle {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * -canvasHeight - 20;
    this.size = Math.random() * 6 + 5;
    this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 + 1.5;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 6 - 3;
    this.shape = Math.random() > 0.5 ? 'star' : 'rect';
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;

    if (this.y > this.canvasHeight) {
      this.y = -20;
      this.x = Math.random() * this.canvasWidth;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    
    if (this.shape === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * this.size,
                   Math.sin(((18 + i * 72) * Math.PI) / 180) * this.size);
        ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (this.size / 2),
                   Math.sin(((54 + i * 72) * Math.PI) / 180) * (this.size / 2));
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

let confettiActive = false; // Disabled until envelope opens
let confettiParticles = [];
let canvas, ctx;

function initConfetti() {
  canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  confettiParticles = [];
  const maxConfetti = 80;
  for (let i = 0; i < maxConfetti; i++) {
    confettiParticles.push(new ConfettiParticle(canvas.width, canvas.height));
  }

  function animate() {
    if (!confettiActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// Web Audio API Synthesizer for SFX
let sfxCtx = null;

function playSynthSFX(type) {
  try {
    if (!sfxCtx) {
      sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (sfxCtx.state === 'suspended') {
      sfxCtx.resume();
    }

    const now = sfxCtx.currentTime;
    const gain = sfxCtx.createGain();
    gain.connect(sfxCtx.destination);

    if (type === 'rip') {
      // Envelope tearing noise burst
      const bufferSize = sfxCtx.sampleRate * 0.4;
      const buffer = sfxCtx.createBuffer(1, bufferSize, sfxCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = sfxCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = sfxCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500;
      
      noise.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      noise.start(now);
      noise.stop(now + 0.4);
    } 
    else if (type === 'switch') {
      // Light switch click sound
      const osc = sfxCtx.createOscillator();
      osc.type = 'triangle';
      osc.connect(gain);
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.setValueAtTime(250, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
    else if (type === 'pop') {
      // Balloon pop noise burst
      const bufferSize = sfxCtx.sampleRate * 0.12;
      const buffer = sfxCtx.createBuffer(1, bufferSize, sfxCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = sfxCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = sfxCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 450;

      noise.connect(filter);
      filter.connect(gain);

      const osc = sfxCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(15, now + 0.1);
      const oscGain = sfxCtx.createGain();
      osc.connect(oscGain);
      oscGain.connect(sfxCtx.destination);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      oscGain.gain.setValueAtTime(0.45, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      noise.start(now);
      noise.stop(now + 0.11);
      osc.start(now);
      osc.stop(now + 0.11);
    }
  } catch (err) {
    console.warn('AudioContext SFX failed to initialize:', err);
  }
}

// Sound Control & Audio Setup
let isMuted = true;
let audio = null;

function setupAudio() {
  audio = document.getElementById('bg-song');
  const soundToggle = document.getElementById('sound-toggle');

  if (!audio || !soundToggle) return;

  function unmuteAndPlay() {
    audio.muted = false;
    isMuted = false;
    soundToggle.textContent = '🔊';
    audio.play().catch(err => console.log('Audio playback delayed:', err));
  }

  // Toggle button click
  soundToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMuted) {
      unmuteAndPlay();
    } else {
      audio.muted = true;
      isMuted = true;
      soundToggle.textContent = '🔇';
      audio.pause();
    }
  });

  // Play button click scrolls directly to gallery
  const playBtn = document.getElementById('hero-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      unmuteAndPlay();
      const target = document.getElementById('gallery');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// Vintage Envelope wax seal action
function setupEnvelope() {
  const envelopeContainer = document.getElementById('envelope-container');
  const waxSeal = document.getElementById('wax-seal');
  const soundToggle = document.getElementById('sound-toggle');

  if (!envelopeContainer || !waxSeal) return;

  waxSeal.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Play envelope tear sound
    playSynthSFX('rip');
    envelopeContainer.classList.add('opened');

    // Reveal page and start music/confetti sequence
    setTimeout(() => {
      // Play switch sound
      playSynthSFX('switch');
      
      // Auto unmute and start music
      if (audio) {
        audio.muted = false;
        isMuted = false;
        if (soundToggle) soundToggle.textContent = '🔊';
        audio.play().catch(err => console.log('Audio autoplay blocked:', err));
      }

      // Start confetti falling
      confettiActive = true;
      initConfetti();

      // Start spawner for floating interactive balloons
      startBalloonSpawner();

      // Automatically scroll to the message letter timeline
      const letterSec = document.getElementById('letter-timeline');
      if (letterSec) {
        letterSec.scrollIntoView({ behavior: 'smooth' });
        // Wait for smooth scroll animation to finish, then start typing the message
        setTimeout(() => {
          if (!hasTyped) {
            hasTyped = true;
            typeWriteDiary(birthdayMessage, 'diary-content', 35);
          }
        }, 1000);
      }
    }, 1200);
  });
}

// Typewriter Diary Love Letter Effect
const birthdayMessage = [
  "Today is...",
  "as beautiful as other days",
  "but you realize",
  "another year has gone",
  "in a blink of the eyes",
  "however, Do you know..?",
  "today is just special",
  "so special to you",
  "Let's make it the best celebration ever!",
  "and let me share a piece of happiness with you.",
  "I wish you all the best!",
  "May all your wishes come true.",
  "real story of your life is just about to begin...",
  "enjoy every single moment today!",
  "and lastly...",
  "a very happy birthday! 🎂🎉"
].join("\n\n");

let hasTyped = false;

function typeWriteDiary(text, elementId, speed = 35) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.innerHTML = '';
  
  let i = 0;
  
  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      // Add slight organic typing delay variation
      const delay = speed + (Math.random() * 20 - 10);
      setTimeout(typing, delay);
    }
  }
  
  typing();
}

function setupTypewriterScrollTrigger() {
  const target = document.getElementById('letter-timeline');
  if (!target) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Fallback in case envelope click doesn't trigger scroll or user scrolls past quickly
      if (entry.isIntersecting && !hasTyped) {
        hasTyped = true;
        setTimeout(() => {
          typeWriteDiary(birthdayMessage, 'diary-content', 35);
        }, 300);
      }
    });
  }, { threshold: 0.15 });

  observer.observe(target);
}

// Interactive Balloon Spawner & Popper
const balloonColors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff9f1c'];
let balloonSpawnerInterval = null;

function startBalloonSpawner() {
  if (balloonSpawnerInterval) return;
  // Spawn a balloon every 2.5 seconds
  balloonSpawnerInterval = setInterval(spawnBalloon, 2500);
}

function spawnBalloon() {
  if (!confettiActive) return; // Keep off if envelope closed

  const balloon = document.createElement('div');
  balloon.className = 'balloon-element';

  const string = document.createElement('div');
  string.className = 'balloon-string';
  balloon.appendChild(string);

  // Random color from list
  const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
  balloon.style.backgroundColor = color;

  // Random horizontal starting position and size scaling
  const startX = Math.random() * (window.innerWidth - 80) + 10;
  const scale = 0.7 + Math.random() * 0.6;
  balloon.style.left = `${startX}px`;
  balloon.style.transform = `scale(${scale})`;

  document.body.appendChild(balloon);

  // Animation values
  let posY = -100;
  const speed = 1.2 + Math.random() * 1.8;
  const swingSpeed = 0.02 + Math.random() * 0.03;
  const swingRange = 8 + Math.random() * 15;
  let angle = Math.random() * Math.PI;

  function updateBalloon() {
    posY += speed;
    angle += swingSpeed;
    const xOffset = Math.sin(angle) * swingRange;

    balloon.style.bottom = `${posY}px`;
    balloon.style.transform = `scale(${scale}) translateX(${xOffset}px)`;

    // Remove if it floats off screen
    if (posY > window.innerHeight + 100) {
      balloon.remove();
    } else {
      // Loop update if balloon still exists on DOM
      if (document.body.contains(balloon)) {
        requestAnimationFrame(updateBalloon);
      }
    }
  }

  // Pop interaction handler
  const popHandler = (e) => {
    e.stopPropagation();
    playSynthSFX('pop');
    
    // Calculate viewport coordinates for pop particle splash
    const rect = balloon.getBoundingClientRect();
    const blastX = rect.left + rect.width / 2;
    const blastY = window.innerHeight - rect.top - rect.height / 2;
    
    createPopEffect(blastX, blastY, color);
    balloon.remove();
  };

  balloon.addEventListener('click', popHandler);
  balloon.addEventListener('touchstart', popHandler);

  requestAnimationFrame(updateBalloon);
}

// Sparkle Particle Pop Splash Effect
function createPopEffect(x, y, color) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = `${x}px`;
  container.style.bottom = `${y}px`;
  container.style.width = '0px';
  container.style.height = '0px';
  container.style.zIndex = '1600';
  document.body.appendChild(container);

  const particleCount = 10;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.style.position = 'absolute';
    p.style.width = '7px';
    p.style.height = '7px';
    p.style.borderRadius = '50%';
    p.style.backgroundColor = color;
    container.appendChild(p);

    const angle = (i * 360 / particleCount) * Math.PI / 180;
    const velocity = 2.5 + Math.random() * 3;
    let distance = 0;

    function animParticle() {
      distance += velocity;
      p.style.left = `${Math.cos(angle) * distance}px`;
      p.style.top = `${Math.sin(angle) * distance}px`;
      p.style.opacity = `${1 - distance / 50}`;

      if (distance < 50) {
        requestAnimationFrame(animParticle);
      } else {
        p.remove();
      }
    }
    animParticle();
  }

  setTimeout(() => container.remove(), 1000);
}

// Lightbox Modal Setup
function setupLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');
  const collageItems = document.querySelectorAll('.collage-item');

  if (!modal || !modalImg || !closeBtn) return;

  collageItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const img = item.querySelector('.collage-img');
      const caption = item.querySelector('.collage-caption');
      
      if (img) {
        modalImg.src = img.src;
        modalCaption.textContent = caption ? caption.textContent : '';
        modal.classList.add('active');
        confettiActive = false; // Pause confetti animation for performance
      }
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    confettiActive = true;
    initConfetti(); // Restart confetti animation
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Navigation links scroll helper
function setupNavigation() {
  const links = document.querySelectorAll('.hero-nav-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Init elements on load
document.addEventListener('DOMContentLoaded', () => {
  setupEnvelope();
  setupAudio();
  setupLightbox();
  setupNavigation();
  setupTypewriterScrollTrigger();
});
