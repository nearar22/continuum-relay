// RelayCorridorCanvas.jsx
// =======================
// The cinematic hero canvas: a glowing baton of light travels through a dark
// corridor of lanes between contributor stations, trailing orbiting context
// layers. DPR-aware, paused when the tab is hidden, and fully replaced by a
// calm static render when reduced motion is requested.

import { useRef, useEffect } from 'react';
import { useReducedMotion, useMotionIntensity } from '../../hooks/useReducedMotion.js';
import styles from './RelayCorridorCanvas.module.css';

const ACCENTS = ['#ffb84d', '#2ee8c6', '#4c7dff', '#ff6b5c', '#55f0a6'];

export function RelayCorridorCanvas() {
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();
  const intensity = useMotionIntensity();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let running = true;
    let t = 0;

    const LANES = 5;
    const stations = [];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStations();
    }

    function buildStations() {
      stations.length = 0;
      for (let i = 0; i < LANES; i += 1) {
        const y = (height / (LANES + 1)) * (i + 1);
        stations.push({ y, accent: ACCENTS[i % ACCENTS.length], phase: i * 1.3 });
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      paintBackdrop();
      stations.forEach((s) => {
        paintLane(s, 0);
        const x = width * 0.5;
        paintBaton(x, s.y, s.accent, 0, true);
      });
    }

    function paintBackdrop() {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, 'rgba(10,13,16,0.0)');
      g.addColorStop(1, 'rgba(5,6,8,0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    function paintLane(s, time) {
      // The lane itself: a faint horizontal rule with a moving shimmer.
      ctx.strokeStyle = 'rgba(138,150,163,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * 0.06, s.y);
      ctx.lineTo(width * 0.94, s.y);
      ctx.stroke();

      // Station nodes at each end.
      paintNode(width * 0.06, s.y, s.accent);
      paintNode(width * 0.94, s.y, s.accent);
    }

    function paintNode(x, y, accent) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }

    function paintBaton(x, y, accent, time, isStatic) {
      // Orbiting context layers.
      const layerCount = 4;
      for (let i = 0; i < layerCount; i += 1) {
        const r = 16 + i * 7;
        const a = isStatic ? 0 : time * (0.6 + i * 0.2) + i;
        ctx.save();
        ctx.globalAlpha = 0.5 - i * 0.08;
        ctx.strokeStyle = ACCENTS[i % ACCENTS.length];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const start = a % (Math.PI * 2);
        ctx.arc(x, y, r, start, start + Math.PI * 1.3);
        ctx.stroke();
        ctx.restore();
      }
      // The core capsule.
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 24;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(247,250,252,0.95)';
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function paintTrail(x, y, accent) {
      const grad = ctx.createLinearGradient(width * 0.06, y, x, y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, accent);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.06, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
    }

    function frame() {
      if (!running) return;
      t += 0.016 * (intensity || 1);
      ctx.clearRect(0, 0, width, height);
      paintBackdrop();

      stations.forEach((s, i) => {
        paintLane(s, t);
        // Baton travels left to right on a loop, offset per lane.
        const cycle = (t * 0.12 + s.phase / 6) % 1;
        const x = width * 0.06 + cycle * (width * 0.88);
        paintTrail(x, s.y, s.accent);
        paintBaton(x, s.y, s.accent, t + i, false);
      });

      raf = requestAnimationFrame(frame);
    }

    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced, intensity]);

  return (
    <div className={styles.frame}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <span className="cr-visually-hidden">
        Animated illustration of glowing batons of light traveling through dark relay lanes between
        contributor stations.
      </span>
    </div>
  );
}
