// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11658 — the arrival posture a navigation into the Interfaces pillar
 * can ask for, carried as router `state` beside the URL.
 *
 * After the first AI build the conversation moves into the Studio workbench
 * (objectui#5799), and it used to land on the 「设计」 canvas with the properties
 * panel open — the designer, squeezed beside the chat, when the user had just
 * asked for an app. ADR-0080 is preview-first, so that one arrival lands on the
 * RUNNING app instead: the 「运行」 canvas mode, properties collapsed, 「设计」 one
 * click away.
 *
 * Router state, not a URL param, on purpose: it is a one-shot arrival intent,
 * not addressable state (Commandment #8). The pillar reads it once, at mount;
 * the `?surface=` mirror's replace drops it right after, so a reload or a
 * shared link opens the designer exactly as any other Studio entry does, and
 * the explicit "Design in Studio" door (which passes no state) keeps landing on
 * 「设计」.
 */

/** The router state that asks the Interfaces pillar to open in run mode. */
export interface StudioRunLandingState {
  studioLanding: 'run';
}

/** Pass as `navigate(path, { state: STUDIO_RUN_LANDING })`. */
export const STUDIO_RUN_LANDING: StudioRunLandingState = { studioLanding: 'run' };

/** True when a location's `state` asks for the run-mode landing. */
export function isStudioRunLanding(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { studioLanding?: unknown }).studioLanding === 'run'
  );
}
