/**
 * Celsior Detailing — 5500K Inspection Light Beam Controller
 * 60 FPS Hardware-Accelerated Reflection Ray
 * Strict Zero-Emoji Architecture
 * 
 * Mechanics:
 * - Traverses across #heroVisualBeam and #heroCarImage.
 * - Tracks pointer (cursor & touch) and scroll parallax.
 * - Linear interpolation (lerp factor 0.08) in requestAnimationFrame loop.
 * - Auto-pauses via IntersectionObserver when off-screen.
 */

(function () {
  'use strict';

  class InspectionLightBeam {
    constructor() {
      this.frame = document.getElementById('heroVisualBeam');
      if (!this.frame) return;

      this.beamLayer = this.frame.querySelector('.hero-beam-layer');
      this.carImage = document.getElementById('heroCarImage');
      if (!this.beamLayer) return;

      // Coordinates and velocity interpolation
      this.targetX = 0;
      this.targetY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.baseRotation = 15; // standard 15 degree ray angle

      this.isHovered = false;
      this.isVisible = true;
      this.ticking = false;
      this.rafId = null;

      // Cached rect for performance (prevent layout thrashing)
      this.rect = null;

      this.init();
    }

    init() {
      this.updateRect();

      // Pointer tracking
      this.frame.addEventListener('pointerenter', this.onPointerEnter.bind(this), { passive: true });
      this.frame.addEventListener('pointerleave', this.onPointerLeave.bind(this), { passive: true });
      this.frame.addEventListener('pointermove', this.onPointerMove.bind(this), { passive: true });

      // Window resize & scroll listeners with throttled rect cache
      window.addEventListener('resize', this.updateRect.bind(this), { passive: true });
      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });

      // IntersectionObserver to auto-pause when scrolled out of view
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible) {
              this.updateRect();
              this.requestUpdate();
            } else if (this.rafId) {
              cancelAnimationFrame(this.rafId);
              this.ticking = false;
            }
          });
        }, { threshold: 0.1 });

        this.observer.observe(this.frame);
      }

      this.requestUpdate();
    }

    updateRect() {
      if (this.frame) {
        this.rect = this.frame.getBoundingClientRect();
      }
    }

    onPointerEnter() {
      this.isHovered = true;
      this.frame.classList.add('beam-tracking');
      this.updateRect();
      this.requestUpdate();
    }

    onPointerLeave() {
      this.isHovered = false;
      this.frame.classList.remove('beam-tracking');
      this.targetX = 0;
      this.targetY = 0;
      this.requestUpdate();
    }

    onPointerMove(e) {
      if (!this.rect) this.updateRect();
      if (!this.rect || this.rect.width === 0) return;

      // Relative coordinates from -50% to +50%
      const relX = (e.clientX - this.rect.left) / this.rect.width; // 0..1
      const relY = (e.clientY - this.rect.top) / this.rect.height; // 0..1

      // Range of motion across the vehicle body
      this.targetX = (relX - 0.5) * 70; // -35% to +35%
      this.targetY = (relY - 0.5) * 20; // -10% to +10%

      this.requestUpdate();
    }

    onScroll() {
      if (!this.isVisible) return;
      this.updateRect();
      if (!this.isHovered && this.rect) {
        // Subtle scroll parallax angle variation
        const windowHeight = window.innerHeight || 800;
        const scrollProgress = (this.rect.top / windowHeight);
        this.targetX = (scrollProgress - 0.5) * 25;
        this.requestUpdate();
      }
    }

    requestUpdate() {
      if (!this.ticking && this.isVisible) {
        this.ticking = true;
        this.rafId = requestAnimationFrame(this.update.bind(this));
      }
    }

    update() {
      if (!this.isVisible) {
        this.ticking = false;
        return;
      }

      // Linear interpolation (lerp 0.08) for smooth 60 FPS motion
      const factor = 0.08;
      this.currentX += (this.targetX - this.currentX) * factor;
      this.currentY += (this.targetY - this.currentY) * factor;

      // Apply transform to the beam layer
      const rot = this.baseRotation + (this.currentX * 0.1);
      this.beamLayer.style.transform = `translate3d(${this.currentX.toFixed(2)}%, ${this.currentY.toFixed(2)}%, 0) rotate(${rot.toFixed(1)}deg)`;

      // Subtle dynamic specular reflection on car image if hovered
      if (this.carImage && this.isHovered) {
        const brightness = 1 + Math.abs(this.currentX) * 0.002;
        this.carImage.style.filter = `brightness(${brightness.toFixed(3)})`;
      } else if (this.carImage && this.carImage.style.filter) {
        this.carImage.style.filter = '';
      }

      // Check if animation has settled
      const diffX = Math.abs(this.targetX - this.currentX);
      const diffY = Math.abs(this.targetY - this.currentY);

      if (diffX > 0.02 || diffY > 0.02) {
        this.rafId = requestAnimationFrame(this.update.bind(this));
      } else {
        this.ticking = false;
      }
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.celsiorInspectionBeam = new InspectionLightBeam();
    });
  } else {
    window.celsiorInspectionBeam = new InspectionLightBeam();
  }
})();
