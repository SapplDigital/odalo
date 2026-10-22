# odalo: exact mosaic animation

This folder is ready to give to Claude Code or copy into your website repository.

## Intended sequence

**odalo → fish → odalo → bird → odalo → sailboat → odalo → fox → odalo → hexagon → repeat**

The internal name for the word is `word`.

Every arrangement uses the same 29 polygon pieces exactly once. Piece shape, dimensions, ID, and colour remain fixed. Animation changes only translation and rotation. Pieces may cross over one another while moving; they fit without overlaps at the completed arrangements.

## Files

- `preview.html`: open in a browser to see the website-ready animation. Works directly from this folder without a server.
- `odalo-mosaic.js`: dependency-free browser script exposing `window.OdaloMosaic`.
- `odalo-mosaic.mjs`: the same animation as an ES module; suitable for framework integration.
- `odalo-mosaic.css`: scoped, responsive artwork styles.
- `odalo-data.json`: canonical piece geometry, colours, arrangements, sequence, and timings.
- `validation.json`: verification of the six completed arrangements.
- `reference-preview.html`: standalone copy of the original interactive design preview.
- `reference-fragment.html`: source of that reference preview, for comparison; not needed on the website.

Use either the browser script or the ES module, not both. The runtime embeds the same canonical data and needs no network requests or libraries.

## Plain HTML

Copy the runtime and stylesheet into your site's public assets directory. Adjust these example URLs to match that location:

```html
<link rel="stylesheet" href="/assets/odalo/odalo-mosaic.css">
<div id="odalo-animation"></div>
<script src="/assets/odalo/odalo-mosaic.js"></script>
<script>
  const animation = OdaloMosaic.mount('#odalo-animation');
</script>
```

Mount after the target element exists. No visible controls are required. `preview.html` adds controls only to make reviewing the animation easier.

## React or another framework

Import the ES module and stylesheet, then call `mount` after the element is mounted. Destroy the instance when the component unmounts. For example, in a client component:

```jsx
import { useEffect, useRef } from 'react';
import { mount } from './odalo-mosaic.mjs';
import './odalo-mosaic.css';

export function OdaloAnimation() {
  const target = useRef(null);
  useEffect(() => {
    const animation = mount(target.current);
    return () => animation.destroy();
  }, []);
  return <div ref={target} />;
}
```

If the project requires a client-component directive, add it according to the project's existing conventions. Importing the module does not touch the DOM; only `mount` does.

## Timing and controls

```js
const animation = mount(element, {
  autoplay: true,
  transitionMs: 1900,
  wordHoldMs: 1800,
  shapeHoldMs: 1400,
});

animation.pause();
animation.play();
await animation.show('fox');              // Pauses the loop and animates to fox.
await animation.show('word', { animate: false });
animation.getState();
animation.destroy();
```

Automatic animation pauses while the page is hidden or the artwork is off screen. With reduced-motion enabled, it stays on the initial word and manual state changes happen instantly. Supply a visible pause control if the animation appears in a persistent part of the website.

The element dispatches `odalo:statechange` on a completed arrangement, with `event.detail.state` and `event.detail.sequenceIndex`.

## Appearance

The artwork has a transparent background and preserves its proportions. Give the wrapper the width appropriate for your page. All arrangements use one common scale, so pieces stay the same size during transitions.

Match the seam colour to your website background if needed:

```css
#odalo-animation { --odalo-gap: #f7f2e8; }
```

The illustrated tile colours remain unchanged. Do not stretch the SVG with nonuniform scaling.

## Instructions for Claude Code

Integrate the supplied runtime in the existing website's framework and layout. Preserve the exact polygon points, piece IDs, colours, arrangement coordinates, shared scale, and sequence from `odalo-data.json`. Do not redraw, simplify, cut, resize, or morph individual pieces. Reuse the module where possible rather than rebuilding the artwork. Keep the word between every shape, preserve cleanup and reduced-motion behavior, and verify the result at desktop and mobile widths. Use `preview.html` and `reference-preview.html` as the visual references.
