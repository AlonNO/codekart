import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const GLYPHS = ['0', '1', '{', '}', '(', ')', ';', '=', '+', '-', '*', '/', '<', '>'];

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const TypingFXOverlay = forwardRef(function TypingFXOverlay(_props, ref) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);

  // resize canvas to full screen (overlay)
  useEffect(() => {
    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  function spawnSparks(x, y, intensity = 1) {
    const n = Math.floor(6 * intensity);
    for (let i = 0; i < n; i++) {
      const speed = rand(120, 380) * intensity;
      const angle = rand(-Math.PI * 0.7, Math.PI * 0.7);
      particlesRef.current.push({
        kind: 'spark',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(40, 140),
        ttl: rand(0.25, 0.55),
        life: 0,
        size: rand(1, 2.5) * intensity,
        color: pick(['#ffd54a', '#ff9f1c', '#ffffff']),
      });
    }
  }
  function spawnConfetti(x, y, intensity = 1) {
    const n = Math.floor(10 * intensity);
    for (let i = 0; i < n; i++) {
      particlesRef.current.push({
        kind: 'pixel', // Reusing pixel rendering, but different physics/colors
        x, y,
        vx: rand(-300, 300) * intensity,
        vy: rand(-400, -100) * intensity,
        ttl: rand(0.5, 1.2),
        life: 0,
        size: rand(3, 6) * intensity,
        color: pick(['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7']),
      });
    }
  }
  function spawnPixels(x, y, intensity = 1) {
    const n = Math.floor(8 * intensity);
    for (let i = 0; i < n; i++) {
      particlesRef.current.push({
        kind: 'pixel',
        x, y,
        vx: rand(-180, 180) * intensity,
        vy: rand(-260, -60) * intensity,
        ttl: rand(0.35, 0.8),
        life: 0,
        size: rand(2, 4) * intensity,
        color: pick(['#7df9ff', '#b267ff', '#00ff87', '#ffd54a']),
      });
    }
  }

  function spawnMatrix(x, y, intensity = 1) {
    const n = Math.floor(4 * intensity);
    for (let i = 0; i < n; i++) {
      particlesRef.current.push({
        kind: 'glyph',
        x: x + rand(-6, 6),
        y: y + rand(-6, 6),
        vx: rand(-25, 25) * intensity,
        vy: rand(80, 220) * intensity,
        ttl: rand(0.5, 1.2),
        life: 0,
        size: rand(10, 14) * intensity,
        color: pick(['#00ff87', '#32ff9d', '#00d46a']),
        char: pick(GLYPHS),
      });
    }
  }

  function spawnLightning(x, y, intensity = 1) {
    // rare, punchy: a quick jagged stroke
    particlesRef.current.push({
      kind: 'bolt',
      x, y,
      ttl: 0.18,
      life: 0,
      size: 1,
      color: pick(['#7df9ff', '#b267ff', '#ffffff']),
      pts: Array.from({ length: 6 }).map((_, i) => ({
        dx: i * rand(4, 10) * intensity,
        dy: rand(-10, 10) * intensity
      }))
    });
  }

  function tick(ts) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const dt = Math.min(0.033, (ts - (lastTsRef.current || ts)) / 1000);
    lastTsRef.current = ts;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const gravity = 520;
    const list = particlesRef.current;

    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life += dt;

      const t = p.life / p.ttl;
      if (t >= 1) {
        list.splice(i, 1);
        continue;
      }

      const alpha = 1 - t;

      if (p.kind === 'spark' || p.kind === 'pixel' || p.kind === 'glyph') {
        p.vy += gravity * dt * 0.6;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      ctx.globalAlpha = alpha;

      if (p.kind === 'spark') {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();
        ctx.restore();
      }

      if (p.kind === 'pixel') {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      if (p.kind === 'glyph') {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      }

      if (p.kind === 'bolt') {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        for (const pt of p.pts) ctx.lineTo(p.x + pt.dx, p.y + pt.dy);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;

    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useImperativeHandle(ref, () => ({
    spawn({ x, y, style, intensity = 1 }) {
      if (!style || style === 'none') return;

      if (style === 'sparks') spawnSparks(x, y, intensity);
      if (style === 'pixels') spawnPixels(x, y, intensity);
      if (style === 'matrix') spawnMatrix(x, y, intensity);
      if (style === 'lightning') spawnLightning(x, y, intensity);
      if (style === 'confetti') spawnConfetti(x, y, intensity);
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[55]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
});

export default TypingFXOverlay;