We are starting a visual redesign pass for One More Drink.

Goal:
Create a cohesive premium visual design system for the app, then redesign the Active Session screen to match the attached mockup as closely as practical while preserving current functionality.

Context:
One More Drink is a harm-reduction app that helps users pace drinking, respect limits, track spending, and avoid going too far.

We now want the app to have a stronger brand identity built around:

- deep wine / burgundy tones
- rich gold / amber accents
- warm cream / ivory surfaces
- a refined, premium, slightly editorial feel
- elegant but still usable mobile UI
- an identity that feels distinct from a generic prototype

Important approach:
Do NOT redesign the whole app at once.
Do this in two steps:

1. Create a small reusable design system / theme foundation.
2. Apply it first to the Active Session screen only.

Reference:
There is a mockup image for the desired Active Session redesign. Use that mockup as the visual target for layout, tone, hierarchy, and styling.

Before starting:

1. Confirm current working directory is:
   C:\dev\one-more-drink
2. Run:
   git status
3. If the working tree is not clean, stop and summarize.
4. Read:
   SPEC.md
   CODEX.md

Part 1: Create a small design system foundation

Create or update a lightweight theming/design foundation for the app.

Requirements:

1. Define reusable design tokens for:
   - colors
   - spacing
   - border radius
   - shadows/elevation
   - typography roles

2. Keep it lightweight and practical. Do not overengineer.
3. Use names that will be reusable on other screens later.

Suggested color direction:

- wine / burgundy primary
- gold / amber accent
- warm cream / ivory card backgrounds
- dark ink / charcoal text
- muted secondary text tones
- gentle success/warning/destructive tones that still fit the new palette

Suggested typography roles:

- screenTitle
- heroTitle
- sectionTitle
- body
- caption
- numericTimer
- buttonLabel

If the project already has a theme/constants structure, extend it.
If not, create a simple one, such as:

- theme/colors.ts
- theme/spacing.ts
- theme/typography.ts
  or a similarly small structure.

Part 2: Create reusable styled UI building blocks

Create a small set of reusable components or style helpers that can support the redesign.

Suggested reusable pieces:

- AppScreen or screen container styling
- HeroCard or primary card
- StatCard
- PrimaryButton
- InfoStrip
- ReminderCard
- SectionHeader or screen header styles

Keep these practical.
Do not create a huge component library.
Only create what is useful for the Active Session screen and likely reusable later.

Part 3: Redesign the Active Session screen

Redesign the Active Session screen to match the mockup as closely as practical while preserving current behavior.

Visual goals:

- Strong branded background with wine/burgundy tone and subtle richness
- Cream/ivory hero card with gold border or accent
- Premium-feeling typography hierarchy
- Gold primary CTA button
- Burgundy/gold quick stat cards
- Branded estimated-end strip
- Reminder card styling that matches the new visual identity
- Use the beer/wine/gold palette consistently without hurting readability

Important:
This is a React Native / Expo app, so implement a practical approximation of the mockup.
Do not chase photorealistic illustration if that will destabilize the app.
Prioritize:

- layout
- palette
- typography
- spacing
- hierarchy
- component styling
- brand feel

Do not let the screen become visually cluttered.

Active Session redesign scope:

1. Screen header
   - Improve title styling to match the premium feel.
   - Keep navigation/back behavior unchanged.

2. Main hero card
   - Redesign the top session card with:
     - preset title
     - drink type subtitle
     - drink visual
     - countdown / ready / plan-complete state
     - primary Log drink button

   - Keep all existing state logic functional.
   - Preserve the current behavior across:
     - normal interval active
     - ready state with drinks left
     - final drink interval active
     - plan complete state

3. Drink visual
   - Keep the existing functional drink visual logic if possible.
   - Restyle it so it fits the new look and feels more polished.
   - Do not put extra redundant text inside the drink visual.
   - A stylized premium illustration feel is welcome, but keep implementation maintainable.

4. Timer / main state text
   - Preserve the state logic we already established:
     - normal interval active:
       countdown + “until next drink window”
     - ready with drinks left:
       “Ready” + “Check in before deciding on another drink.”
     - final drink interval active:
       countdown + “until closing time”
     - session complete:
       “Plan complete.” + “No more drinks in this session.”

   - Style these states to match the premium design.

5. Primary CTA
   - Restyle the Log drink button to fit the gold accent palette.
   - Keep behavior unchanged.

6. Quick stat cards
   - Restyle:
     - Drinks left card with undo action
     - Spending card with log spending action

   - Keep existing behavior unchanged.
   - Preserve accessibility and tap targets.

7. Estimated end / completed strip
   - Restyle the strip to fit the new design.
   - Preserve logic:
     - before completion: “Estimated end: …”
     - after completion: “Completed at: …” if available, otherwise hide

   - Keep this subtle and elegant.

8. Reminder / guidance card
   - Restyle the primary reminder card to fit the theme.
   - Preserve the priority behavior:
     1. Closing time / session complete
     2. Last call / final drink active
     3. Food check
     4. Water check

   - Keep dismissibility rules unchanged:
     - food and water dismissible
     - maximum reached and session complete not dismissible

Part 4: Preserve functionality

Do not break:

- active session state logic
- drink logging
- undo last drink
- log spending
- spending cap behavior
- estimated end calculations
- session complete / completion time behavior
- reminder logic
- active session restore
- notification behavior
- accessibility
- local persistence

Part 5: Keep implementation practical

Technical constraints:

- TypeScript
- Expo / React Native
- No backend
- No analytics
- No unnecessary new dependencies
- If a font/styling library is already present, use it carefully
- If a custom font would materially improve the look, propose it first before adding it
- Prefer maintainable code over overly complex styling tricks

If you need to approximate some visual aspects of the mockup rather than reproduce them literally, do so in a way that preserves the same overall tone and hierarchy.

Part 6: Verification

After implementation:

1. Run:
   npm ci
   npx expo-doctor
2. Summarize changed files.
3. Explain the design system files or theme structure you added/updated.
4. Explain the reusable components created.
5. Explain how the Active Session screen was redesigned.
6. Tell me exactly how to test the redesign in the development build.
7. Mention any visual compromises or follow-up polish ideas.

Commit:
If everything is complete and verified, commit with:
Create design system and redesign active session

Then push to origin.
