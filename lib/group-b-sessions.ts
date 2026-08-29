/** Group B sessions served by this app (excludes retired B-20262). */
export const GROUP_B_SESSION_IDS = ["B-20264", "B-20272"] as const;

export type GroupBSessionId = (typeof GROUP_B_SESSION_IDS)[number];

export const GROUP_B_DEFAULT_SESSION_ID: GroupBSessionId = "B-20264";

const GROUP_B_SESSION_ID_SET = new Set<string>(GROUP_B_SESSION_IDS);

export function isGroupBSessionId(sessionId: string): sessionId is GroupBSessionId {
  return GROUP_B_SESSION_ID_SET.has(sessionId);
}
