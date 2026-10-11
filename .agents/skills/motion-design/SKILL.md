---
name: motion-design
description: >-
  LottieFiles motion design principles for UI: Disney animation principles adapted
  to digital products, choreography, easing physics, and spatial storytelling.
---

# Motion Design Principles for Digital Products

## 1. The Core Motion Laws
* **Purpose First:** Every animation must answer: *Where did this come from? Where is it going? What does it want me to do?* Never animate purely for decoration.
* **Physics & Easing:**
  * Entering the stage: Decelerate with high inertia (`cubic-bezier(0.16, 1, 0.3, 1)` or `power3.out`).
  * Leaving the stage: Accelerate briskly (`cubic-bezier(0.7, 0, 0.84, 0)`).
  * Tactile interactions (toggles, buttons): Soft elastic rebound (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

## 2. Choreography & Hierarchy
* **Cascading Entrances:** When displaying lists or grids, stagger items by 50ms–100ms. Never pop everything onto the screen at once.
* **Shared Axis Transitions:** Modals, drawers, and panels should move along clear axes (e.g., drawers slide in from the right edge, modals expand from origin).
* **Speed Economy:**
  * Micro-interactions (hover, click, toggle): 150ms – 250ms
  * Macro transitions (drawers, modal reveals): 350ms – 500ms
  * Full-page choreography: 600ms – 900ms
