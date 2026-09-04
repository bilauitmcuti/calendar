import type { MetaResponse } from "./calendar-api";
import { isGroupBSessionId, GROUP_B_DEFAULT_SESSION_ID } from "./group-b-sessions";

/** Group A (Foundation/Professional) sessions served by this app. */
export const GROUP_A_SESSION_IDS = ["A-20264", "A-20272"] as const;

export type GroupASessionId = (typeof GROUP_A_SESSION_IDS)[number];

export const GROUP_A_DEFAULT_SESSION_ID: GroupASessionId = "A-20264";

const GROUP_A_SESSION_ID_SET = new Set<string>(GROUP_A_SESSION_IDS);

export function isGroupASessionId(sessionId: string): sessionId is GroupASessionId {
  return GROUP_A_SESSION_ID_SET.has(sessionId);
}

/** Keep only configured Group A/B sessions from API meta. */
export function applyGroupASessionsToMeta(meta: MetaResponse): MetaResponse {
  const sessionOptions = meta.sessionOptions.filter(
    (s) =>
      (s.group !== "A" || isGroupASessionId(s.id)) &&
      (s.group !== "B" || isGroupBSessionId(s.id))
  );

  const defaultSession = { ...meta.defaultSession };
  if (!isGroupASessionId(defaultSession.A)) {
    defaultSession.A = GROUP_A_DEFAULT_SESSION_ID;
  }
  if (!isGroupBSessionId(defaultSession.B)) {
    defaultSession.B = GROUP_B_DEFAULT_SESSION_ID;
  }

  return { ...meta, sessionOptions, defaultSession };
}
