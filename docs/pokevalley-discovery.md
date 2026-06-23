# Pokevalley — Milestone 1 Discovery

## Decision

Ship the smallest end-to-end playable slice of a cozy creature-collecting farming RPG, then harden the core loop before adding breadth. The discovery outcome is a bounded MVP contract: one farm, one creature partner, one crop chain, one encounter, one day cycle, and one save/load path.

## Player promise

Pokevalley lets players build a tiny farm while befriending fantastical creatures that help with chores, exploration, and turn-based encounters. The first playable version should feel like:

- Planting and harvesting crops matters because it funds the next day.
- Meeting a creature matters because it can become a helper, not just a battle unit.
- Each day creates a simple choice: farm, explore, care for creatures, or sell goods.

## Target player

- Enjoys cozy farming games, light collection goals, and approachable RPG battles.
- Wants short sessions with visible progress in under 10 minutes.
- Values charm, clarity, and low-pressure experimentation over difficulty.

## Core loop

1. Wake up at the farm.
2. Tend a small crop plot.
3. Explore a nearby meadow.
4. Encounter a wild creature.
5. Befriend or battle the creature.
6. Return home, sell goods, assign helper chores, and sleep.
7. Persist progress and start the next day stronger.

## MVP playable slice

### Included

- One farm map with a house, shipping bin, and six tilled plots.
- One meadow map with grass patches and one wild creature encounter.
- One starter creature that can water one crop per day.
- One wild creature that can be befriended after a simple encounter.
- One crop with seed, watered, grown, harvested, and sold states.
- One day cycle with morning, afternoon, evening, and sleep transition.
- One local save file containing day, money, crops, inventory, and creatures.

### Excluded for now

- Multiplayer.
- Procedural world generation.
- Large creature roster.
- Deep combat status effects.
- Shops beyond seed buying and crop selling.
- Seasons, festivals, relationships, quests, and crafting.

## Gameplay acceptance criteria

- A new player can start a game, plant a seed, water it, sleep, harvest it, sell it, and see money increase.
- A new player can enter the meadow, trigger an encounter, choose battle or befriend, and resolve the encounter.
- A befriended creature appears in the farm roster and can be assigned to a simple chore.
- Sleeping advances the day and preserves progress after reload.
- The first session communicates controls and current objective without external documentation.

## UX direction

- Camera: top-down 2D tile view.
- Controls: keyboard-first movement and confirm/cancel actions.
- Tone: warm colors, readable silhouettes, playful creature names, low-stress feedback.
- HUD: day/time, money, selected tool/action, inventory count, and current helper.
- Onboarding: contextual prompts for the first seed, first watering, first encounter, and first sleep.

## Technical shape

- Client-owned game loop for responsive movement and interactions.
- Small deterministic state machine for crop growth, day transitions, encounters, and helper chores.
- Local persistence first; server persistence can be added after the loop is fun.
- Data-driven content tables for crops, creatures, maps, tools, and encounter outcomes.
- Keep rendering separate from rules so QA can test rules without a browser.

## Team responsibilities

- zen, CEO: approve scope tradeoffs and keep the slice focused on the first playable loop.
- a, Product Designer: define first-session flow, tile readability, HUD layout, and creature interaction feedback.
- ling long, Software Engineer: build the game state model, map interactions, persistence, and playable loop.
- QA, QA Engineer: own smoke tests for crop lifecycle, encounter resolution, helper assignment, and save/load.
- Research, AI Research Agent: validate whether farming-helper creatures are the differentiator players understand fastest.
- Do, DevOps Engineer: keep one-command local run, lint, typecheck, build, and release packaging healthy.

## Key risks

- Scope creep from trying to satisfy both farming and creature-collection genres at full depth.
- Combat complexity delaying the farming loop.
- Unclear creature helper value if helpers feel cosmetic.
- Save/load bugs corrupting early progress.
- Art needs expanding faster than gameplay if content is not data-driven.

## Milestone 1 done checklist

- Problem, player, promise, and MVP scope are documented.
- First playable loop is constrained to one crop, one farm, one meadow, and two creatures.
- Acceptance criteria are testable by engineering and QA.
- Non-goals are explicit enough to reject distracting additions.
- Next milestone can start implementation without reopening product scope.

## Next action

Build the MVP slice: a browser-playable prototype where the player completes one full farm-and-creature day, saves, reloads, and sees persistent progress.
