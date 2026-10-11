---
name: gsap-skills
description: >-
  Official GreenSock GSAP best practices for animation, timeline orchestration,
  ScrollTrigger, performant GPU transforms, and lifecycle cleanup.
---

# GSAP Skills & Animation Guidelines

## 1. Core Principles
* **Transforms Over Layout:** Always animate GPU-accelerated properties (`x`, `y`, `scale`, `rotation`, `opacity`) instead of layout properties (`top`, `left`, `width`, `height`, `margin`).
* **Timeline Orchestration:** Use `gsap.timeline()` for sequencing rather than standalone `gsap.to()` calls with manual delays. Use position parameters (`"-=0.3"`, `"<"`) for responsive choreography.
* **Easing Discipline:** Never default to linear or harsh easing. Use natural decelerations:
  * Entrances: `power3.out`, `power4.out`, `expo.out`
  * Exits: `power2.in`
  * Elastic / Tactile: `back.out(1.4)`, `elastic.out(1, 0.4)`

## 2. ScrollTrigger Integration
* **Update Synchronization:** When pairing with smooth scroll engines (Lenis), always bind `lenis.on('scroll', ScrollTrigger.update)` and drive Lenis via `gsap.ticker.add((time) => lenis.raf(time * 1000))`.
* **Clean Triggers:** Define explicit `start` and `end` values (e.g. `start: "top 80%"`, `toggleActions: "play none none none"`).
* **Pinning & Scrollers:** Avoid nesting pinned elements without dedicated spacer wrappers.

## 3. Performance & Memory Safety
* Call `gsap.context()` in modern reactive components or cleanly dispose timelines on component unmount.
* Avoid layout thrashing: compute bounding boxes and measurements before initializing timelines.
* Use `will-change: transform` sparingly on active animating layers only.
