---
name: liquid-glass-js
description: Apple-style frosted glass panels and UI components with real-time WebGL refraction, blur, specular highlights, and chromatic aberration. Vanilla JS, zero build step.
---

# Liquid Glass JS Skill

Liquid Glass JS provides Apple-inspired real-time frosted glass effects for the web using vanilla JavaScript and WebGL shaders without any build step.

## Source & Assets
- Local Vendor Location: `vendor/liquid-glass-js/`
- Core Modules:
  - `vendor/liquid-glass-js/container.js`: `LiquidGlass.Container` for glass panel surfaces and wrappers.
  - `vendor/liquid-glass-js/button.js`: `LiquidGlass.Button` for interactive frosted buttons.
  - `vendor/liquid-glass-js/glass.css`: Core glass base styling and layout utilities.
  - `vendor/liquid-glass-js/controls.js`: Live inspector parameters tuning.

## Key Features & Shapes
1. **Three Shape Modes**:
   - `rounded-rect`: Classic rounded rectangles with configurable border radius.
   - `circle`: Circular buttons and avatar lenses.
   - `pill`: Capsule/pill buttons and badges.
2. **Real-time WebGL Shaders**:
   - Multi-layer optical refraction
   - Realistic background blur and chromatic aberration
   - Dynamic specular lighting following pointer motion
   - Child/nested glass container support

## Quick Implementation (Vanilla JS)

```html
<link rel="stylesheet" href="vendor/liquid-glass-js/glass.css">
<script src="vendor/liquid-glass-js/container.js"></script>
<script src="vendor/liquid-glass-js/button.js"></script>

<div id="glass-card" class="liquid-glass-panel">
  <h2>Handcrafted Glass Experience</h2>
</div>

<script>
  const glassPanel = new LiquidGlass.Container(document.getElementById('glass-card'), {
    shape: 'rounded-rect',
    radius: 24,
    blur: 20,
    refraction: 0.15,
    specular: 0.8,
    tint: 'rgba(255, 255, 255, 0.12)'
  });
</script>
```

## Best Practices
- **Layering**: Ensure the element behind the liquid glass panel has high-contrast visual texture (e.g., imagery, rich gradients) to maximize refraction aesthetics.
- **Performance**: Dispose instances when elements are removed from DOM. Keep render canvas pixel ratio clamped to `Math.min(window.devicePixelRatio, 2)`.
