# One More Drink (OMD) - Product Spec

## Purpose

One More Drink (OMD) is a harm-reduction mobile app that helps users stick to a sober pre-commitment when drinking.

The name is intentionally cheeky, but the app is not designed to encourage drinking. It is designed to help users pace themselves, avoid blackouts, respect a drink maximum, control spending, and end the night while still in control.

## Core Philosophy

The user makes the plan while sober. OMD helps protect that plan once drinking has started.

Tone should be calm, non-judgmental, practical, and direct.

## MVP Goals

The MVP should allow a user to:

1. Start a drinking session.
2. Set a drink interval, defaulting to 60 minutes.
3. Set a maximum drink count.
4. Set an optional spending cap.
5. Log drinks during the session.
6. See when the next drink is allowed.
7. Receive warnings as they approach their drink limit.
8. End the session.
9. Review a simple session summary.

## MVP Screens

### Home

- App name: One More Drink
- Short tagline: Make a sober plan. Stick to it.
- Button to start a new session
- Button to view past sessions, if implemented

### New Session

User can configure:

- Session name or context
- Drink interval in minutes
- Maximum drinks
- Spending cap
- Planned end time, optional

### Active Session

Shows:

- Drink count
- Maximum drink count
- Time until next allowed drink
- Money spent
- Spending cap
- Button to log a drink
- Button to log spending
- Button to end session

Guardrails:

- Warn at 50%, 75%, and 100% of drink maximum
- Warn when spending cap is near
- Discourage overrides but allow them with confirmation

### Session Summary

Shows:

- Total drinks
- Total spending
- Whether the user stayed within their plan
- Duration of session
- Optional notes

## Technical Direction

- React Native
- Expo
- TypeScript
- Expo Router
- Local-first storage
- No account system for MVP
- No cloud backend for MVP
- No tracking or selling user data

## Privacy

Drinking data is sensitive. For MVP, all session data should stay local on the device.

## Out of Scope for MVP

- User accounts
- Cloud sync
- Social sharing
- Location tracking
- Medical advice
- Payment integrations
- Complex analytics
