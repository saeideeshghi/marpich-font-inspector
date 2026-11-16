# Marpich Font Inspector

A separate GitHub Pages build of the Marpich Sanat v4.1.7 website with an automatic typography overlay. The source website repository remains unchanged.

## What appears on the site

- Colored outlines identify text elements directly on each page.
- Each label shows the element role and its computed font size.
- The floating inspector panel shows font family and fallback, weight, line-height, alignment, selector, and viewport size.
- Persian, English, and Arabic pages are built from the pinned source commit.

## Deployment

GitHub Actions checks out upstream commit `b69bdfe`, builds all Pages routes for this repository, injects the inspector into every page, and deploys the generated site. The overlay opens automatically; its checkbox can hide or show the outlines. Measurements use the browser's computed styles at the current viewport.

The deployment URL is https://saeideeshghi.github.io/marpich-font-inspector/.