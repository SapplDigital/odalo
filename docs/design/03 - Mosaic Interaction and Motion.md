# Odalo — Mosaic Interaction and Motion

## Governing rule

**Movement should explain connection and respond to interest.**

The website should feel alive while preserving readable text, reliable controls, and predictable navigation.

## Desktop service mosaic

Use a twelve-column conceptual grid with two rows of panels.

| State | Top row: A / B | Bottom row: C / D |
|---|---|---|
| Rest | 7 / 5 | 5 / 7 |
| A highlighted | 8 / 4 | 5 / 7 |
| B highlighted | 5 / 7 | 5 / 7 |
| C highlighted | 7 / 5 | 7 / 5 |
| D highlighted | 7 / 5 | 4 / 8 |

The shared edge moves. The highlighted panel gains space while its neighbor contracts.

Suggested initial height at desktop: approximately 560 px, divided equally between the two rows. Treat this as a visual target; allow more height when text size or content requires it.

## Hover behavior

After approximately 120 ms of intentional hover:

- Expand the hovered tile’s width.
- Brighten or reposition its decorative artwork slightly.
- Emphasize its exploration control.
- Keep neighboring service names and links visible.

Transition duration: 320–420 ms, smooth ease-out, no bounce.

Keep all titles, descriptions, and links visible in the resting state. Hover adds emphasis rather than access to essential information.

Prevent rapid oscillation near moving edges through a small boundary tolerance and delayed reset.

Return to the resting composition after the pointer leaves the mosaic, unless keyboard focus remains inside a tile.

## Exploring a service

The exploration button opens a shared detail region directly below the mosaic.

It contains:

- Service heading.
- Short explanation.
- Three to five deliverables.
- Related plan.
- Link to the complete service page.
- Close control.

Only one detail region is open at a time.

This region appears only after deliberate activation. Hover alone does not insert content or move the following page sections.

Buttons expose their expanded state to assistive technology.

## Keyboard behavior

- Logical focus order: A, B, C, D.
- Focused tiles receive equivalent visual emphasis.
- Focus stays on the original control while the mosaic changes.
- Enter or Space activates the exploration button.
- Closing details returns focus to the relevant exploration control.
- Escape closes the detail region when focus is inside it.
- Full service links work independently.

## Touch behavior

Touch interaction uses explicit controls.

- Tapping “Explore” reveals details.
- Tapping the full service link opens the service page.
- Essential content is visible before any tap.
- Scrolling across a tile does not select it.

On narrow screens, expand the selected tile vertically. Keep surrounding tiles in document order.

## Other motion

| Element | Behavior |
|---|---|
| Hero visuals | Assemble once over 700–1000 ms, then settle |
| Service panels | Expand on hover, focus, or selection |
| Images | Subtle internal zoom up to 1.025 |
| Process connector | Draw once as the section enters view |
| Decorative pieces | Occasional short position or rotation transition |
| Buttons | 120–180 ms color or border response |
| Accordions | 180–240 ms opening transition |

Avoid continuous movement by default. If sustained animation is added, provide a visible pause control.

Use natural scrolling. Do not lock scrolling or require visitors to complete an animation.

## Reduced motion

With reduced motion enabled:

- Render hero visuals in their final positions.
- Disable decorative travel, rotation, and image zoom.
- Replace tile transitions with immediate state changes.
- Preserve every action and piece of content.
