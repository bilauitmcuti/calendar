import { describe, expect, it } from "vitest";
import {
  GROUP_B_DEFAULT_SESSION_ID,
  GROUP_B_SESSION_IDS,
  isGroupBSessionId,
} from "./group-b-sessions";

describe("group-b-sessions", () => {
  it("defines only B-20264 and B-20272 (excludes B-20262)", () => {
    expect(GROUP_B_SESSION_IDS).toEqual(["B-20264", "B-20272"]);
    expect(isGroupBSessionId("B-20264")).toBe(true);
    expect(isGroupBSessionId("B-20272")).toBe(true);
    expect(isGroupBSessionId("B-20262")).toBe(false);
    expect(isGroupBSessionId("B-20263")).toBe(false);
  });

  it("uses B-20264 as default", () => {
    expect(GROUP_B_DEFAULT_SESSION_ID).toBe("B-20264");
  });
});
