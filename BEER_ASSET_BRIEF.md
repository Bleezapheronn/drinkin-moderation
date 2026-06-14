# Beer Asset Refinement Brief

We are refining the Beer visual in One More Drink using a new master source image.

Context:
The current layered beer visual proved the concept, but the production assets are still too detailed and not ideal for animation.

We now have a better source image that represents the target design:

- a simplified empty beer mug
- a simplified liquid fill
- a simplified foam top

This source image should become the new master reference for the Beer visual.

Source image:
`assets/illustrations/source/beer_mug_animation_asset_guide.png`

If that exact file does not exist, search the repo for the equivalent new beer asset guide image and use it instead.

Goal:
Replace the existing beer animation assets with simplified illustrated assets derived from the new source image, preserving transparency and improving the beer-emptying animation.

Important design intent:

1. The empty mug should be a clean neutral outline/container.
   - No distracting reflections inside the main liquid area.
   - It should clearly show the mug shape even when empty.
   - It should not obscure the liquid or foam layers.
2. The liquid fill should be completely separate from the foam.
   - It should be simple and clean.
   - No details that will look distorted when clipped vertically.
   - A subtle amber gradient and fine bubbles are okay, but no strong reflections/highlights that break animation.
3. The foam should be a more uniform rectangular cap shape.
   - It should sit cleanly on top of the liquid.
   - It should remain visually consistent through animation.
   - It should not have irregular lumpy geometry that makes movement look awkward.

Before editing:

1. Confirm current directory is:
   `C:\dev\one-more-drink`
2. Inspect:
   - `assets/illustrations/source/beer_mug_animation_asset_guide.png`
   - `components/DrinkProgressVisual.tsx`
   - `current files in assets/illustrations/`

Tasks:

1.  Inspect and isolate the new source image
    - Confirm the source image exists.
    - Inspect whether it has transparency.
    - Determine whether the background, labels, and descriptive text are baked into the image.
    - Identify crop regions for:
      - Empty Mug
      - Liquid Fill
      - Foam Top
2.  Create replacement production assets
    Create or replace:
    - `assets/illustrations/beer-mug-empty.png`
    - `assets/illustrations/beer-liquid-fill.png`
    - `assets/illustrations/beer-foam-top.png`

      Requirements:

    - These must be production-ready runtime assets.
    - Remove all labels, decorative text, and surrounding poster layout.
    - Preserve or create true transparency (alpha) around the asset.
    - Do not leave a cream, white, checkerboard, or other opaque background.
    - Crop tightly but keep enough padding that the asset is not clipped.
    - Keep the three assets visually consistent in style and scale.

      Specific asset requirements:

    - Empty mug
      - Transparent background.
      - Clean outline of the mug only.
      - Rim, outer shape, handle, and base should remain.
      - Remove or reduce interior reflection lines in the liquid area so they do not obscure the animated fill.
      - Keep it elegant and readable.

    - Liquid fill
      - Transparent background.
      - A clean amber beer fill shape designed to sit inside the mug.
      - Separate from foam.
      - The bottom edge can be rounded if needed, but it must animate/clamp cleanly.
      - Avoid strong reflections or shapes that look wrong when clipped during height animation.

    - Foam top
      - Transparent background.
      - A clean, mostly rectangular foam cap with a soft top silhouette and flatter bottom edge.
      - Designed to sit on top of the liquid fill.
      - Keep it consistent and suitable for animation.

3.  Update DrinkProgressVisual to use the new simplified assets
    Update components/DrinkProgressVisual.tsx so the Beer visual uses these replacement assets.

    Desired layer order:
    1. Gold progress halo behind the mug
    2. Animated clipped liquid fill layer
    3. Foam top positioned at the top of the animated fill
    4. Empty mug overlay above the liquid and foam
    5. Base shadow / subtle support styling if needed

    Behavior requirements:
    - Preserve the existing progress logic.
    - The beer should visually empty during countdown.
    - Ready state should look empty or near-empty.
    - Final interval should still drain correctly.
    - Plan complete should not break.
    - Do not reintroduce checkerboard or opaque rectangles.

    Implementation guidance:
    - Use simple clipping with overflow: hidden.
    - Keep the native fallback if an asset is missing.
    - Keep the current layout dimensions stable unless a small adjustment is needed for proper alignment.
    - Align the liquid and foam cleanly inside the mug outline.

4.  Clean up old asset usage
    - Remove references to outdated beer assets if they are no longer used.
    - Do not delete useful source files unless they are clearly obsolete.
    - Keep the new source guide image in the repo as a source/reference asset.

5.  Preserve all other behavior
    Do not break:
    - Active Session screen layout
    - countdown / Ready / final interval / plan complete states
    - drink logging
    - undo drink
    - spending logging
    - estimated end / completed-at strip
    - reminder behavior
    - active session restore
6.  Verification
    Run:
    - npm ci
    - npx expo-doctor
    - npx tsc --noEmit
    - npm run lint

    After implementing:
    1. Summarize changed files.
    2. Explain how the source guide image was cropped or isolated.
    3. Explain how transparency/alpha was preserved or created for each output asset.
    4. Explain how the new mug asset avoids obscuring the liquid.
    5. Explain how the liquid and foam assets are now separated for cleaner animation.
    6. Tell me exactly how to test:
       - Ready state
       - normal countdown
       - final drink interval
       - plan complete
    7. Commit with:
       Replace beer assets with simplified animated layers
    8. Push to origin.
