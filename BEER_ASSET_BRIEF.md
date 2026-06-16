Use the mug overlay source asset at:

`C:\dev\one-more-drink\assets\illustrations\source\beer-mug-overlay-source.png`

We are implementing the Beer visual in **One More Drink** using the **engineering route**:

- static mug overlay image
- code-native liquid
- code-native foam

## Goal

Replace the current beer mug overlay and refine the Beer visual so it looks clean, aligned, and reliable in motion.

## Context

The current engineered version proved that alignment is workable, but it still has visual problems:

1. The mug interior is still slightly tapered, while the code-native liquid is rectangular.
2. There is an inner arc at the base that makes the liquid look like it is not sitting properly.
3. The foam needs better fit at the top of the liquid.
4. The mug and contents should sit more cleanly within the halo.

The new source image is the approved direction:

- good mug shape
- good handle
- good base
- simple overlay
- better fit for code-native liquid/foam

## Files to inspect first

- `components/DrinkProgressVisual.tsx`
- `assets/illustrations/`
- `assets/illustrations/source/beer-mug-overlay-source.png`

## Task 1: prepare the production mug overlay asset

Create or replace:

`assets/illustrations/beer-mug-overlay.png`

Requirements:

- Use `beer-mug-overlay-source.png` as the basis.
- Preserve transparency if present. If a checkerboard or baked background exists, remove it cleanly.
- Keep only the mug overlay:
  - outer mug outline
  - believable right-side handle
  - top rim
  - flat base

- Do not include liquid, foam, bubbles, or decorative effects.
- Avoid strong interior reflections.
- Most important:
  - remove the unsightly inner base arc
  - make the mug interior feel like a more uniform rectangular container
  - the code-native liquid should be able to sit snugly inside it

- Crop/resize only if needed for runtime usability, but do not distort the mug.

## Task 2: refactor Beer visual in DrinkProgressVisual

For Beer:

- use `beer-mug-overlay.png` as the static overlay
- do not rely on image-based liquid/foam assets
- render liquid natively in React Native
- render foam natively in React Native
- keep the gold halo behind the mug

Desired layer order:

1. halo
2. native liquid
3. native foam
4. mug overlay
5. subtle base shadow

## Task 3: refine the geometry/alignment

Define explicit constants for Beer, such as:

- stage size
- halo size
- mug image size
- mug position
- liquid inner x
- liquid inner y
- liquid inner width
- liquid inner height
- foam height

Refinement requirements:

### Mug interior

- The liquid container should feel rectangular, not tapered.
- The liquid should sit closer to the inner walls.
- Remove the visual impression that the mug narrows toward the bottom.

### Base

- Remove the inner bottom arc effect that makes the liquid look unsupported.
- The liquid should appear to sit on a flat base.

### Foam

- Foam should be wider and/or slightly taller so it fits the top of the liquid cleanly.
- It should not look undersized or floating awkwardly.
- It should stay attached to the liquid top during animation.

### Halo / centering

- Enlarge the halo if needed.
- Center the composition based on the visible drink body, not the full mug-plus-handle footprint.
- The mug and liquid should sit comfortably inside the halo.

## Task 4: preserve behavior

Do not break:

- Ready state
- normal countdown
- final drink interval
- plan complete
- drink logging
- undo drink
- spending logging
- reminder cards
- estimated end strip
- active session restore
- other drink types

## Task 5: verification

Run:

- `npm ci`
- `npx expo-doctor`
- `npx tsc --noEmit`
- `npm run lint`

## After implementing

Please report:

1. changed files
2. how the mug overlay asset was prepared
3. whether transparency/background cleanup was needed
4. the interior alignment constants used
5. how you tightened the liquid fit
6. how you removed the inner base arc problem
7. how you adjusted the foam
8. how you adjusted the halo/centering
9. exact testing steps for:
   - Ready
   - normal countdown
   - final drink interval
   - plan complete

Commit with:

`Refine beer mug overlay and native fill alignment`

Push to origin.
