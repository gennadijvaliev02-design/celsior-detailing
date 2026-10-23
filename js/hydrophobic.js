/**
 * Celsior Detailing — Hydrophobic 9H Canvas 2D Physics Engine
 * High-Performance Water-Beading Simulator with Zero Garbage Collection Pauses
 * Strict Zero-Emoji Architecture
 * 
 * Technical Highlights:
 * - Pre-allocated Object Pool of exactly 75 droplets (Zero GC Jank).
 * - Retina/High-DPI resolution scaling (window.devicePixelRatio).
 * - Hydrophobic physics (contact angle >110°) vs Untreated sheeting (<30°).
 * - Real-time droplet coalescence (merging on collision).
 * - Interactive controls: Spray burst, Flow intensity slider, Coating toggle.
 * - Auto-pauses with IntersectionObserver when off-screen.
 */

(function () {
  'use strict';

  class HydrophobicEngine {
    constructor() {
      this.canvas = document.getElementById('hydrophobicCanvas');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;

      // DOM Controls
      this.btnSpray = document.getElementById('btnSprayWater');
      this.btnToggle = document.getElementById('toggleCoatingState');
      this.labelToggle = document.getElementById('labelCoatingMode');
      this.rangeIntensity = document.getElementById('rangeWaterIntensity');
      this.labelIntensity = document.getElementById('rangeWaterValue');

      // Physics State
      this.poolSize = 75;
      this.droplets = new Array(this.poolSize);
      this.isCeramicActive = true; // true = 9H ceramic beads (>110°), false = untreated sheeting (30°)
      this.intensityLevel = 2;     // 1 to 5
      this.tiltX = 0.0;
      this.tiltY = 1.35;           // base downhill gravity slope

      // Viewport & Lifecycle
      this.dpr = window.devicePixelRatio || 1;
      this.width = 600;
      this.height = 420;
      this.running = false;
      this.rafId = null;
      this.isVisible = false;

      this.setupObjectPool();
      this.resizeCanvas();
      this.bindEvents();
      this.initObserver();
    }

    /**
     * Pre-allocates fixed memory pool for 75 droplets to prevent runtime GC pauses.
     */
    setupObjectPool() {
      for (let i = 0; i < this.poolSize; i++) {
        this.droplets[i] = {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          r: 3 + Math.random() * 5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 0.8 + Math.random() * 1.4,
          contactAngle: 115,
          alpha: 0.82 + Math.random() * 0.18,
          active: i < 35 // initial active droplets
        };
      }
    }

    /**
     * Resizes canvas buffer according to device pixel ratio for crisp rendering.
     */
    resizeCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || 600;
      this.height = rect.height || 420;

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
    }

    /**
     * Binds UI controls and pointer interactions.
     */
    bindEvents() {
      window.addEventListener('resize', () => {
        this.resizeCanvas();
      }, { passive: true });

      // Spray button handler
      if (this.btnSpray) {
        this.btnSpray.addEventListener('click', () => {
          this.sprayWaterBurst(20);
        });
      }

      // Coating toggle handler
      if (this.btnToggle) {
        this.btnToggle.addEventListener('click', () => {
          this.toggleCoating();
        });
      }

      // Intensity range slider
      if (this.rangeIntensity) {
        this.rangeIntensity.addEventListener('input', (e) => {
          this.setIntensity(parseInt(e.target.value, 10));
        });
      }

      // Pointer tilt interaction on canvas
      this.canvas.addEventListener('pointermove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width; // 0..1
        this.tiltX = (relX - 0.5) * 1.8;
      }, { passive: true });

      this.canvas.addEventListener('pointerleave', () => {
        this.tiltX = 0;
      }, { passive: true });
    }

    /**
     * Observes visibility to pause render loop when off-screen.
     */
    initObserver() {
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible) {
              this.start();
            } else {
              this.stop();
            }
          });
        }, { threshold: 0.15 });

        this.observer.observe(this.canvas);
      } else {
        // Fallback for older browsers
        this.start();
      }
    }

    /**
     * Sprays a burst of new droplets from the object pool.
     */
    sprayWaterBurst(count) {
      let activated = 0;
      for (let i = 0; i < this.poolSize && activated < count; i++) {
        const d = this.droplets[i];
        if (!d.active || Math.random() < 0.4) {
          d.active = true;
          d.x = 20 + Math.random() * (this.width - 40);
          d.y = -10 - Math.random() * 40;
          d.r = 2.5 + Math.random() * 4.5;
          d.vx = (Math.random() - 0.5) * 1.5;
          d.vy = 2.0 + Math.random() * 2.5;
          activated++;
        }
      }
    }

    /**
     * Toggles between 9H ceramic coating and untreated paint.
     */
    toggleCoating() {
      this.isCeramicActive = !this.isCeramicActive;
      if (this.btnToggle) {
        this.btnToggle.setAttribute('aria-pressed', String(this.isCeramicActive));
      }
      if (this.labelToggle) {
        this.labelToggle.textContent = this.isCeramicActive
          ? 'Керамика 9H (Активна)'
          : 'До обработки (Без защиты)';
      }

      // Update contact angle for all droplets
      const targetAngle = this.isCeramicActive ? 115 : 28;
      for (let i = 0; i < this.poolSize; i++) {
        this.droplets[i].contactAngle = targetAngle;
      }
    }

    /**
     * Adjusts precipitation intensity and flow rate.
     */
    setIntensity(level) {
      this.intensityLevel = Math.max(1, Math.min(5, level));
      const labels = [
        'Легкая морось',
        'Умеренный дождь',
        'Ливень',
        'Штормовой поток',
        'Экстремальный тест'
      ];

      if (this.labelIntensity) {
        this.labelIntensity.textContent = labels[this.intensityLevel - 1];
      }

      // Adjust number of active droplets based on intensity
      const activeTargets = [20, 35, 50, 65, 75];
      const targetCount = activeTargets[this.intensityLevel - 1];

      for (let i = 0; i < this.poolSize; i++) {
        this.droplets[i].active = i < targetCount;
      }
    }

    start() {
      if (!this.running) {
        this.running = true;
        this.render();
      }
    }

    stop() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    /**
     * Main 60 FPS animation loop.
     */
    render() {
      if (!this.running) return;

      this.ctx.clearRect(0, 0, this.width, this.height);

      // Simulation parameters based on coating state
      const friction = this.isCeramicActive ? 0.985 : 0.92;
      const speedMult = this.isCeramicActive ? (1.0 + this.intensityLevel * 0.15) : 0.35;

      for (let i = 0; i < this.poolSize; i++) {
        const d = this.droplets[i];
        if (!d.active) continue;

        // Physics updates
        d.vx += this.tiltX * 0.08;
        d.vy += (this.tiltY * 0.05) * speedMult;

        d.vx *= friction;
        d.vy *= friction;

        d.x += d.vx;
        d.y += d.vy;

        // Coalescence check: merge colliding droplets in ceramic mode
        if (this.isCeramicActive) {
          for (let j = i + 1; j < this.poolSize; j++) {
            const other = this.droplets[j];
            if (!other.active) continue;

            const dx = other.x - d.x;
            const dy = other.y - d.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (d.r + other.r) * 0.85) {
              // Merge other into d
              const combinedArea = Math.PI * d.r * d.r + Math.PI * other.r * other.r;
              d.r = Math.min(14, Math.sqrt(combinedArea / Math.PI));
              d.vy += other.vy * 0.25;

              // Reset other droplet to top of stream
              other.y = -10 - Math.random() * 30;
              other.x = Math.random() * this.width;
              other.r = 2.5 + Math.random() * 3.5;
              other.vx = 0;
              other.vy = 0.8 + Math.random() * 1.2;
            }
          }
        }

        // Respawn when droplet falls below bottom boundary
        if (d.y > this.height + 25) {
          d.y = -15 - Math.random() * 20;
          d.x = Math.random() * this.width;
          d.r = 3 + Math.random() * 4.5;
          d.vx = (Math.random() - 0.5) * 0.4;
          d.vy = 0.8 + Math.random() * 1.5;
        }

        // Draw droplet
        if (this.isCeramicActive) {
          this.drawCeramicBead(d);
        } else {
          this.drawUntreatedSheeting(d);
        }
      }

      this.rafId = requestAnimationFrame(this.render.bind(this));
    }

    /**
     * Renders a perfect spherical pearl with contact angle >110° and 5500K specular highlight.
     */
    drawCeramicBead(d) {
      const ctx = this.ctx;
      const x = d.x;
      const y = d.y;
      const r = d.r;

      // Contact shadow beneath droplet
      ctx.beginPath();
      ctx.arc(x + 1.2, y + 2.0, r * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();

      // Spherical pearl body with realistic optical refraction
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(
        x - r * 0.35, y - r * 0.35, r * 0.1,
        x, y, r
      );
      grad.addColorStop(0.0, 'rgba(242, 247, 252, 0.95)');
      grad.addColorStop(0.45, 'rgba(56, 189, 248, 0.55)');
      grad.addColorStop(0.85, 'rgba(15, 23, 42, 0.85)');
      grad.addColorStop(1.0, 'rgba(56, 189, 248, 0.7)');

      ctx.fillStyle = grad;
      ctx.fill();

      // Sharp 5500K daylight specular glare on dome
      ctx.beginPath();
      ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.fill();

      // Edge cold cyan highlight
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(242, 247, 252, 0.5)';
      ctx.stroke();
    }

    /**
     * Renders untreated paint sheeting: flattened water spots adhering to paintwork (<30°).
     */
    drawUntreatedSheeting(d) {
      const ctx = this.ctx;
      const x = d.x;
      const y = d.y;
      const rx = d.r * 1.8;
      const ry = d.r * 0.75;

      // Flat irregular puddle
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.fill();

      // Faint dull reflection
      ctx.beginPath();
      ctx.ellipse(x - rx * 0.2, y - ry * 0.2, rx * 0.3, ry * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242, 247, 252, 0.25)';
      ctx.fill();
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.celsiorHydrophobic = new HydrophobicEngine();
    });
  } else {
    window.celsiorHydrophobic = new HydrophobicEngine();
  }
})();
