We are doing an icon polish pass for One More Drink.

Goal:
Make the Active Session iconography look much closer to the design reference, without changing app behavior and without touching the beer mug animation.

Important:

- Do NOT change the beer mug animation.
- Do NOT redesign the screen layout broadly.
- Do NOT change app logic or behavior.
- Focus on icon styling, icon choice, and the icon containers/badges/buttons.

Reference:
Use the app’s Active Session redesign reference as the visual target.
Inspect:

- assets/design/active-session-redesign-reference.png
  If that exact file does not exist, inspect the equivalent active session reference image in the repo.

Before editing:

1. Confirm current directory is `C:\dev\one-more-drink`.
2. Inspect:
   - `app/active-session.tsx`
   - `assets/design/active-session-redesign-reference.png`
   - `components/design-system.tsx`
   - `theme/index.ts`
   - any shared icon/button/card components used by Active Session
   - the active session reference image

Goal of this pass:
There are 6 main icons/elements to improve.

## 1. Drinks Left icon

Current issue:

- It does not match the reference well.
- The gold outline/background treatment looks rough.
- The icon should be drink-agnostic.

Target:

- Use a generic filled glass icon, not something that reads like a door/window.
- Put it inside a smooth wine-colored circular badge.
- The icon itself should be gold.
- The badge should feel smooth, clean, and premium like the reference.

## 2. Spending Left icon

Target:

- Replicate the stacked-coins icon from the reference as closely as practical.
- Same badge treatment as Drinks Left:
  - smooth wine-colored circular badge
  - gold icon
- Remove the rough outer-edge look.

## 3. Undo button

Target:

- Match the reference as closely as practical.
- It should be a small cream rounded-square action button with subtle border/shadow.
- Use the undo glyph style from the reference as closely as practical.
- The glyph should feel clean and premium, not generic or oversized.

## 4. Plus button

Target:

- Same styling language as Undo.
- Small cream rounded-square action button with subtle border/shadow.
- Use a clean plus glyph matching the reference tone.

## 5. Estimated End clock icon

Target:

- Replicate the reference style:
  - clock icon in gold
  - clean circular treatment / subtle outlined badge treatment as appropriate
  - elegant and lightweight
- It should feel closer to the reference than the current implementation.

## 6. Reminder card primary icon(s)

Target:

- For the “Close to your planned maximum” reminder, make the star icon match the reference as closely as practical:
  - wine-colored circular badge
  - gold star
  - clean gold outline treatment

Recommendation for the other reminder icons:
Please normalize the reminder-card icon system so all reminder cards share the same badge style language, while using different glyphs by reminder type where appropriate.

Recommended mapping:

- default pacing / generic guidance: info icon
- water check: water droplet icon
- food check: fork-and-knife or utensils icon
- close to planned maximum: star icon
- last call / planned maximum reached / closing-time style warning: exclamation mark icon

Use best judgment if some of these states are already consolidated differently in code, but keep a consistent badge system.

## Styling requirements

Across all of the above:

- Prefer existing Expo/vector icon packages already in the project.
- Do not add a heavy new dependency just for icons.
- Use the wine/gold/cream color system already established in the app.
- The icon badges should feel smooth and polished.
- Eliminate the rough-looking gold edge treatment where it currently feels messy.
- Keep icon sizes visually balanced across the screen.
- Keep spacing/padding inside the badges and action buttons clean.

## Scope / behavior constraints

Do not break:

- Active Session layout
- countdown / Ready / final interval / plan complete states
- drinks left / spending left values
- undo drink behavior
- add spending behavior
- estimated end strip behavior
- reminder card behavior and priority
- active session restore
- beer mug animation

## Implementation guidance

- If there is duplicated icon styling in multiple places, create or improve a shared icon badge / action button style so the treatment is consistent.
- If the reminder card icon system is scattered, clean it up modestly so icon selection is easier to maintain.
- Keep this pass focused on polish, not architecture overhaul.

## Verification

Run:

- `npm ci`
- `npx expo-doctor`
- `npx tsc --noEmit`
- `npm run lint`

After implementing:

1. Summarize changed files.
2. Explain which icon set(s) you used.
3. Explain how the Drinks Left, Spending Left, Undo, Plus, Clock, and Star icons were updated.
4. Explain the badge/action-button styling changes.
5. Explain the reminder icon mapping used.
6. Confirm the beer mug animation was not changed.
7. Tell me exactly how to test:
   - normal active countdown
   - estimated end card
   - undo button
   - add spending button
   - close-to-planned-maximum reminder
   - default pacing guidance reminder
   - any other reminder cards affected

Commit with:
`Polish active session iconography`

Push to origin.
