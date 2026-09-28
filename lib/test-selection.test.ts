import { describe, expect, it, vi } from "vitest";
import { selectApprovedQuestions } from "./test-selection";

function mockDb(ids: Array<{ id: string; difficulty?: string }>) {
  return {
    from() {
      const state = { filters: new Map<string, string>() };
      const query = {
        select() { return query; },
        eq(key: string, value: string) { state.filters.set(key, value); return query; },
        limit() {
          const rows = ids.filter((row) => {
            for (const [key, value] of state.filters) {
              if (key === "exam_stage_id" && value !== "stage") return false;
              if (key === "language" && value !== "en") return false;
              if (key === "status" && value !== "approved") return false;
              if (key === "difficulty" && row.difficulty !== value) return false;
            }
            return true;
          }).map(({ id }) => ({ id }));
          return Promise.resolve({ data: rows, error: null });
        },
      };
      return query;
    },
  } as never;
}

describe("selectApprovedQuestions", () => {
  it("selects exactly the configured count", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = await selectApprovedQuestions(mockDb(
      Array.from({ length: 20 }, (_, index) => ({ id: String(index) })),
    ), {
      examStageId: "stage",
      language: "en",
      count: 10,
      rules: {},
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.questionIds).toHaveLength(10);
  });

  it("rejects a blueprint that exceeds the requested test size", async () => {
    const result = await selectApprovedQuestions(mockDb(
      Array.from({ length: 20 }, (_, index) => ({ id: String(index) })),
    ), {
      examStageId: "stage",
      language: "en",
      count: 10,
      rules: { buckets: [{ count: 11 }] },
    });
    expect(result.ok).toBe(false);
  });
});
