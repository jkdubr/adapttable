import { describe, expect, it } from "vitest";

import {
  createResponseAggregateOps,
  type ResponseAggregateOpsInput,
} from "./responseAggregateOps";

const SUM = { amount: "sum" } as const;
const AVG = { amount: "avg" } as const;

function input(
  overrides: Partial<ResponseAggregateOpsInput>
): ResponseAggregateOpsInput {
  return {
    requestKey: "q1",
    requested: SUM,
    hasData: true,
    fetching: false,
    failed: false,
    ...overrides,
  };
}

describe("createResponseAggregateOps", () => {
  it("starts from the first request and follows it while nothing is shown", () => {
    const ops = createResponseAggregateOps();
    expect(ops.current()).toBeUndefined();
    ops.remember("q1", SUM);
    expect(ops.current()).toBe(SUM);
    ops.remember("q2", AVG);
    expect(
      ops.settle(input({ requestKey: "q2", requested: AVG, hasData: false }))
    ).toBe(true);
    expect(ops.current()).toBe(AVG);
    // The same operations again change nothing.
    expect(
      ops.settle(
        input({ requestKey: "q2", requested: { ...AVG }, hasData: false })
      )
    ).toBe(false);
  });

  it("publishes a named response's operations, and unknown for a forgotten one", () => {
    const ops = createResponseAggregateOps();
    ops.remember("q1", SUM);
    ops.remember("q2", AVG);
    expect(ops.settle(input({ requestKey: "q2", responseKey: "q2" }))).toBe(
      true
    );
    expect(ops.current()).toBe(AVG);
    expect(ops.settle(input({ requestKey: "q2", responseKey: "q2" }))).toBe(
      false
    );
    expect(ops.settle(input({ requestKey: "q9", responseKey: "gone" }))).toBe(
      true
    );
    expect(ops.current()).toBeUndefined();
  });

  it("remembers a bounded number of requests", () => {
    const ops = createResponseAggregateOps();
    for (let index = 0; index < 10; index++)
      ops.remember(`q${String(index)}`, SUM);
    ops.remember("q0", AVG);
    ops.settle(input({ requestKey: "q9", responseKey: "q9" }));
    expect(ops.current()).toBe(SUM);
    // q0 was evicted and re-remembered with its new operations.
    ops.settle(input({ requestKey: "q0", responseKey: "q0" }));
    expect(ops.current()).toBe(AVG);
  });

  it("reads a response marker against the request it belongs to", () => {
    const ops = createResponseAggregateOps();
    ops.remember("q1", SUM);
    ops.remember("q2", AVG);
    // Zero: this request has no answer of its own yet.
    expect(ops.settle(input({ requestKey: "q2", respondedAt: 0 }))).toBe(false);
    expect(ops.current()).toBe(SUM);
    expect(ops.settle(input({ requestKey: "q2", respondedAt: 5 }))).toBe(true);
    expect(ops.current()).toBe(AVG);
    expect(ops.settle(input({ requestKey: "q2", respondedAt: 5 }))).toBe(false);
  });

  it("marks the rows unknown once an untraceable request concludes", () => {
    const ops = createResponseAggregateOps();
    ops.remember("q1", SUM);
    ops.settle(input({ requestKey: "q1", responseKey: "q1" }));
    // Same request as shown: nothing to decide.
    expect(ops.settle(input({ requestKey: "q1" }))).toBe(false);

    ops.remember("q2", AVG);
    expect(ops.settle(input({ requestKey: "q2", requested: AVG }))).toBe(false);
    // Stopped without being seen to start: not an answer.
    expect(ops.settle(input({ requestKey: "q2", requested: AVG }))).toBe(false);
    expect(ops.current()).toBe(SUM);

    ops.remember("q3", AVG);
    ops.settle(input({ requestKey: "q3", requested: AVG, fetching: true }));
    ops.settle(input({ requestKey: "q3", requested: AVG, fetching: true }));
    // A failure concludes nothing.
    expect(
      ops.settle(input({ requestKey: "q3", requested: AVG, failed: true }))
    ).toBe(false);
    expect(ops.settle(input({ requestKey: "q3", requested: AVG }))).toBe(true);
    expect(ops.current()).toBeUndefined();
  });
});
