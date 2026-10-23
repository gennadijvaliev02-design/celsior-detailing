/**
 * Celsior Detailing — Clearcoat Macro Zoom 3x Optical Loupe
 * High-Precision Geometric Inspection Lens (Hardware-Accelerated 60 FPS)
 * Strict Zero-Emoji Architecture
 * 
 * Mechanics:
 * - 3.0x optical magnification over #macroZoomImage
 * - Precise bounding rect calculations accounting for actual image bounds
 * - Zero image deformation (aspect ratio and coordinates strictly matched 1:1)
 * - Honest optical inspection parameters (no fake synthetic telemetry)
 */

(function () {
  'use strict';

  class MacroZoomInspector {
    constructor() {
      this.container = document.getElementById('macroZoomContainer');
      this.image = document.getElementById('macroZoomImage');
      this.loupe = document.getElementById('macroZoomLoupe');

      if (!this.container || !this.image || !this.loupe) return;

      // Optical parameters
      this.zoomFactor = 3.0;
      this.lensDiameter = 140; // px
      this.halfLens = this.lensDiameter / 2;

      // High-res retina image source for the loupe reflection
      this.zoomImageSrc = 'assets/images/case_cayenne_macro@2x.webp';

      // State and coordinates
      this.imgRect = null;
      this.contRect = null;
      this.targetX = 0;
      this.targetY = 0;
      this.isHovered = false;
      this.ticking = false;
      this.rafId = null;

      this.init();
    }

    init() {
      // Pre-load and set high-res background image on loupe
      this.loupe.style.backgroundImage = `url("${this.zoomImageSrc}")`;
      this.updateGeometry();

      // Unified Pointer Events (Mouse, Touch, Pen)
      this.container.addEventListener('pointerenter', this.onPointerEnter.bind(this), { passive: true });
      this.container.addEventListener('pointerdown', this.onPointerDown.bind(this), { passive: false });
      this.container.addEventListener('pointerleave', this.onPointerLeave.bind(this), { passive: true });
      this.container.addEventListener('pointerup', this.onPointerLeave.bind(this), { passive: true });
      this.container.addEventListener('pointercancel', this.onPointerLeave.bind(this), { passive: true });
      this.container.addEventListener('pointermove', this.onPointerMove.bind(this), { passive: false });

      // Window events for geometry invalidation
      window.addEventListener('resize', this.updateGeometry.bind(this), { passive: true });
      window.addEventListener('scroll', this.updateGeometry.bind(this), { passive: true });

      // In case image hasn't finished loading natural bounds yet
      if (this.image.complete) {
        this.updateGeometry();
      } else {
        this.image.addEventListener('load', this.updateGeometry.bind(this), { once: true });
      }
    }

    /**
     * Cache bounding rects of both image and container to prevent layout thrashing
     */
    updateGeometry() {
      if (!this.container || !this.image) return;
      this.contRect = this.container.getBoundingClientRect();
      this.imgRect = this.image.getBoundingClientRect();

      if (this.imgRect && this.imgRect.width > 0 && this.imgRect.height > 0) {
        const bgW = Math.round(this.imgRect.width * this.zoomFactor);
        const bgH = Math.round(this.imgRect.height * this.zoomFactor);
        this.loupe.style.backgroundSize = `${bgW}px ${bgH}px`;
      }
    }

    onPointerEnter(e) {
      this.isHovered = true;
      this.updateGeometry();
      this.loupe.classList.add('active');
      this.onPointerMove(e);
    }

    onPointerDown(e) {
      this.isHovered = true;
      this.updateGeometry();
      this.loupe.classList.add('active');
      if (e.pointerType === 'touch') {
        // Prevent accidental page drag while actively inspecting macro view
        if (e.cancelable) e.preventDefault();
      }
      this.onPointerMove(e);
    }

    onPointerLeave() {
      this.isHovered = false;
      this.loupe.classList.remove('active');
    }

    onPointerMove(e) {
      if (!this.isHovered) return;
      if (!this.imgRect || !this.contRect || this.imgRect.width === 0) {
        this.updateGeometry();
      }
      if (!this.imgRect || this.imgRect.width === 0) return;

      if (e.pointerType === 'touch' && e.cancelable) {
        e.preventDefault();
      }

      this.targetX = e.clientX;
      this.targetY = e.clientY;

      this.requestUpdate();
    }

    requestUpdate() {
      if (!this.ticking) {
        this.ticking = true;
        this.rafId = requestAnimationFrame(this.render.bind(this));
      }
    }

    render() {
      if (!this.isHovered || !this.imgRect || !this.contRect) {
        this.ticking = false;
        return;
      }

      // Calculate coordinates relative to the actual image element
      const relX = Math.max(0, Math.min(this.targetX - this.imgRect.left, this.imgRect.width));
      const relY = Math.max(0, Math.min(this.targetY - this.imgRect.top, this.imgRect.height));

      // Calculate loupe center inside the container coordinate frame
      const imgOffsetX = this.imgRect.left - this.contRect.left;
      const imgOffsetY = this.imgRect.top - this.contRect.top;

      const loupeX = imgOffsetX + relX;
      const loupeY = imgOffsetY + relY;

      // 1. Move optical loupe lens
      this.loupe.style.transform = `translate3d(${(loupeX - this.halfLens).toFixed(1)}px, ${(loupeY - this.halfLens).toFixed(1)}px, 0)`;

      // 2. Adjust background position so center of loupe matches point under reticle exactly
      const bgX = -Math.round(relX * this.zoomFactor - this.halfLens);
      const bgY = -Math.round(relY * this.zoomFactor - this.halfLens);
      this.loupe.style.backgroundPosition = `${bgX}px ${bgY}px`;

      this.ticking = false;
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.celsiorMacroZoom = new MacroZoomInspector();
    });
  } else {
    window.celsiorMacroZoom = new MacroZoomInspector();
  }
})();
