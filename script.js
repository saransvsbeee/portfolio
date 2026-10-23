// =========================================================
// Saran S. | EEE Portfolio — Interactive Logic
//   1) Mobile menu
//   2) Navbar scroll state + active link highlight
//   3) IntersectionObserver section reveal
//   4) Footer year
//   5) Thunder/lightning background animation (canvas)
//   6) GPU-circuit shard animation (canvas)
// =========================================================

// ---------- Mobile menu ----------
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => navLinks.classList.remove("open"))
);

// ---------- Navbar border on scroll + active link highlight ----------
const navbar = document.getElementById("navbar");
const sections = document.querySelectorAll("main section[id]");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
  let current = "home";
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 160) current = s.id;
  });
  navLinks.querySelectorAll("a").forEach(a =>
    a.classList.toggle("active", a.getAttribute("href") === "#" + current)
  );
});

// ---------- Reveal sections on scroll ----------
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// =========================================================
// THUNDER / LIGHTNING background — Enhanced Cinematic Edition
//   • Brighter bolts with multi-pass glow (wide halo + bright core)
//   • Soft white-blue sky flash that illuminates the whole frame
//   • Extended bolt lifetime (1.0s – 2.0s) with cubic ease-out fade
//   • Smooth long-tail afterglow for natural fade-out
//   • Subtle flicker modulation for realism
//   • Occasional double-strike + ground-echo for cinematic drama
// =========================================================
(function thunder() {
  const canvas = document.getElementById("thunder-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // A single bolt = array of {x,y} points from sky downward
  function makeBolt(originX) {
    const points = [{ x: originX, y: 0 }];
    let x = originX, y = 0;
    const targetY = h * (0.55 + Math.random() * 0.40);
    while (y < targetY) {
      y += 16 + Math.random() * 30;
      x += (Math.random() - 0.5) * 75;
      points.push({ x, y });
    }
    return points;
  }

  // Branches off the main bolt — more frequent, longer, for drama
  function makeBranches(bolt) {
    const branches = [];
    bolt.forEach((p, i) => {
      if (i === 0 || i === bolt.length - 1) return;
      if (Math.random() < 0.24) {
        const len = 3 + Math.floor(Math.random() * 6);
        let bx = p.x, by = p.y;
        const dir = Math.random() < 0.5 ? -1 : 1;
        const branch = [{ x: bx, y: by }];
        for (let k = 0; k < len; k++) {
          bx += dir * (12 + Math.random() * 38);
          by += 10 + Math.random() * 26;
          branch.push({ x: bx, y: by });
        }
        branches.push(branch);
      }
    });
    return branches;
  }

  // Cubic ease-out — fast attack, slow smooth tail
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  const flashes = [];
  let nextBoltAt = performance.now() + 2500 + Math.random() * 2000; // first bolt ~2.5–4.5s after load

  function spawnFlash(intensityBoost = 1.0) {
    const originX = Math.random() * w;
    const bolt = makeBolt(originX);
    const branches = makeBranches(bolt);
    // Longer-lived flash for cinematic, realistic fade
    const life = 1100 + Math.random() * 900; // 1.1s – 2.0s
    // Brighter base intensity
    const intensity = Math.min(1.0, (0.75 + Math.random() * 0.30) * intensityBoost);
    flashes.push({
      bolt, branches,
      bornAt: performance.now(),
      life,
      intensity,
      // Per-flash flicker seed (so multiple flashes don't pulse in sync)
      flickerSeed: Math.random() * Math.PI * 2
    });
  }

  function drawBolt(points, alpha, width, color, glow) {
    if (points.length < 2 || alpha <= 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = color;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = glow;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    ctx.clearRect(0, 0, w, h);

    // Maybe spawn a new bolt (single strike only, with longer gaps for drama)
    if (now >= nextBoltAt) {
      spawnFlash();
      // No secondary strikes — keep each thunder as a single clean bolt
      nextBoltAt = now + 5200 + Math.random() * 4800; // ~5.2s – 10s between strikes
    }

    // Draw + age flashes
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      const age = now - f.bornAt;
      const t = age / f.life;
      if (t >= 1) { flashes.splice(i, 1); continue; }

      // ===== ALPHA ENVELOPE (smooth attack + cubic ease-out tail) =====
      // Phase 1 (0 – 0.06): sharp rise — lightning ignition
      // Phase 2 (0.06 – 0.30): hold high (sustained flash)
      // Phase 3 (0.30 – 1.00): cubic ease-out fade (long smooth tail)
      let envelope;
      if (t < 0.06) {
        envelope = t / 0.06;                                    // 0 → 1
      } else if (t < 0.30) {
        envelope = 1.0;                                          // sustained peak
      } else {
        envelope = 1 - easeOutCubic((t - 0.30) / 0.70);        // smooth fade to 0
      }
      // Subtle flicker modulation (sin-based, damps as flash ages)
      const flicker = 0.85 + 0.15 * Math.sin(age * 0.05 + f.flickerSeed);
      let alpha = envelope * f.intensity * flicker;

      // ===== SKY-WIDE ILLUMINATION (soft white-blue flash) =====
      // Stronger at peak, smoothly fades with the bolt. Covers full frame.
      // Uses a soft blue-white tint (cooler than the bolt itself).
      if (t < 0.55) {
        const skyPhase = t < 0.06 ? t / 0.06 : (t < 0.30 ? 1.0 : 1 - easeOutCubic((t - 0.30) / 0.25));
        const skyAlpha = skyPhase * 0.22 * f.intensity;  // brighter than before
        // Layered radial sky glow — brightest near bolt origin, soft falloff
        const bx = f.bolt[0].x;
        const grad = ctx.createRadialGradient(bx, 0, 0, bx, h * 0.4, Math.max(w, h) * 0.7);
        grad.addColorStop(0, `rgba(220, 235, 255, ${skyAlpha})`);      // white-blue core
        grad.addColorStop(0.35, `rgba(180, 200, 255, ${skyAlpha * 0.55})`);
        grad.addColorStop(1, "rgba(120, 150, 220, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Plus a thin full-frame wash for atmospheric illumination
        const washAlpha = skyPhase * 0.06 * f.intensity;
        ctx.fillStyle = `rgba(200, 220, 255, ${washAlpha})`;
        ctx.fillRect(0, 0, w, h);
      }

      // ===== BOLT RENDERING (multi-pass for dramatic glow) =====
      // Pass 1: wide soft halo (very faint, large blur)
      drawBolt(f.bolt, alpha * 0.40, 10, "#9d4edd", 30);
      // Pass 2: medium glow (purple)
      drawBolt(f.bolt, alpha * 0.70, 5,  "#c98bff", 20);
      // Pass 3: bright core (white-blue, thin, sharp)
      drawBolt(f.bolt, alpha * 1.00, 2,  "#f4f8ff", 14);
      // Pass 4: ultra-thin inner core (pure white, no blur) — the "wire"
      drawBolt(f.bolt, alpha * 1.00, 0.8, "#ffffff", 0);

      // Branches — slightly dimmer, with their own glow
      f.branches.forEach(b => {
        drawBolt(b, alpha * 0.55, 4,   "#9d4edd", 18);
        drawBolt(b, alpha * 0.80, 1.2, "#e8e0ff", 10);
      });

      // ===== GROUND ECHO — a soft pool of light where the bolt lands =====
      const last = f.bolt[f.bolt.length - 1];
      if (last && t < 0.65) {
        const echoPhase = t < 0.10 ? t / 0.10 : 1 - easeOutCubic((t - 0.10) / 0.55);
        const echoAlpha = echoPhase * 0.18 * f.intensity;
        const echoR = 180 + 80 * echoPhase;
        const echoGrad = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, echoR);
        echoGrad.addColorStop(0, `rgba(220, 235, 255, ${echoAlpha})`);
        echoGrad.addColorStop(0.5, `rgba(157, 78, 221, ${echoAlpha * 0.4})`);
        echoGrad.addColorStop(1, "rgba(157, 78, 221, 0)");
        ctx.fillStyle = echoGrad;
        ctx.beginPath();
        ctx.arc(last.x, last.y, echoR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(frame);
  }

  if (!reduced) requestAnimationFrame(frame);
})();

// =========================================================
// GPU IC CHIPS background
//   Floating QFP-style IC packages — rectangular chip body with
//   pin legs on all four sides, a corner dot (pin-1 indicator),
//   and subtle inner trace detail. Evokes a board full of GPU
//   silicon packages. Slow drift + subtle rotation, neon glow.
// =========================================================
(function gpuChips() {
  const canvas = document.getElementById("shard-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initChips();
  }

  const chips = [];

  function initChips() {
    chips.length = 0;
    const count = Math.min(14, Math.max(6, Math.floor(w / 130)));
    for (let i = 0; i < count; i++) {
      const size = 26 + Math.random() * 40;
      chips.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size,
        // Pin count proportional to size, even number
        pinsPerSide: Math.max(4, Math.round(size / 7) * 2),
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.0018,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        color: Math.random() < 0.7 ? "#9d4edd" : "#60a5fa",
        alpha: 0.20 + Math.random() * 0.22
      });
    }
  }

  function drawChip(c) {
    const s = c.size;
    const pinLen = s * 0.22;
    const pinW = s * 0.06;
    const body = s; // half-width of the chip body
    const pins = c.pinsPerSide;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.globalAlpha = c.alpha;

    // ---- Draw pin legs (top, right, bottom, left) ----
    ctx.strokeStyle = c.color;
    ctx.lineWidth = pinW * 0.6;
    ctx.lineCap = "butt";
    ctx.shadowBlur = 6;
    ctx.shadowColor = c.color;

    for (let i = 0; i < pins; i++) {
      const t = (i + 0.5) / pins; // 0..1 along the side
      const offset = -body + t * (body * 2);

      // Top pins
      ctx.beginPath();
      ctx.moveTo(offset, -body);
      ctx.lineTo(offset, -body - pinLen);
      ctx.stroke();

      // Bottom pins
      ctx.beginPath();
      ctx.moveTo(offset, body);
      ctx.lineTo(offset, body + pinLen);
      ctx.stroke();

      // Left pins
      ctx.beginPath();
      ctx.moveTo(-body, offset);
      ctx.lineTo(-body - pinLen, offset);
      ctx.stroke();

      // Right pins
      ctx.beginPath();
      ctx.moveTo(body, offset);
      ctx.lineTo(body + pinLen, offset);
      ctx.stroke();
    }

    // ---- Draw chip body (filled rect with subtle gradient) ----
    ctx.shadowBlur = 14;
    const grad = ctx.createLinearGradient(-body, -body, body, body);
    grad.addColorStop(0, "rgba(43, 16, 85, 0.85)");
    grad.addColorStop(1, "rgba(20, 8, 40, 0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(-body, -body, body * 2, body * 2);

    // Body outline
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-body, -body, body * 2, body * 2);

    // ---- Inner detail: die area (smaller rect inside) ----
    ctx.shadowBlur = 0;
    ctx.strokeStyle = c.color;
    ctx.globalAlpha = c.alpha * 0.5;
    ctx.lineWidth = 0.8;
    const die = body * 0.55;
    ctx.strokeRect(-die, -die, die * 2, die * 2);

    // ---- Pin-1 indicator dot (top-left corner) ----
    ctx.globalAlpha = c.alpha * 1.4;
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(-body + body * 0.22, -body + body * 0.22, body * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // ---- Center contact pad ----
    ctx.globalAlpha = c.alpha * 0.8;
    ctx.fillStyle = "#c98bff";
    ctx.beginPath();
    ctx.arc(0, 0, body * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    // Update positions
    for (const c of chips) {
      c.x += c.vx; c.y += c.vy; c.rot += c.vRot;
      const margin = c.size + 30;
      if (c.x < -margin) c.x = w + margin;
      if (c.x > w + margin) c.x = -margin;
      if (c.y < -margin) c.y = h + margin;
      if (c.y > h + margin) c.y = -margin;
    }

    // Draw faint PCB-style traces between nearby chips
    for (let i = 0; i < chips.length; i++) {
      for (let j = i + 1; j < chips.length; j++) {
        const a = chips[i], b = chips[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 280) {
          const alpha = (1 - d / 280) * 0.10;
          ctx.strokeStyle = `rgba(157, 78, 221, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          // right-angle "PCB trace" routing
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw the chips on top
    for (const c of chips) drawChip(c);

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  if (!reduced) requestAnimationFrame(frame);
})();
