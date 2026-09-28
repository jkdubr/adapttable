/**
 * The assistant panel's presentation rules, proven without a panel.
 *
 * Each binding draws these with its own components; what is fixed here is
 * what they say and when, which is the part every framework has to agree on.
 */
import { describe, expect, it, vi } from "vitest";

import type { TableLabels } from "../types";
import {
  assistantActionsName,
  assistantBadgeTone,
  assistantComposerState,
  assistantInitials,
  assistantLauncherName,
  assistantProgressText,
  assistantQuestion,
  assistantReceiptDetail,
  assistantReceiptHeadline,
  assistantReceiptNeedsSave,
  assistantReceiptWhere,
  assistantRejoinable,
  assistantShownReceipts,
  assistantUndoReason,
  assistantUndoTurnLabel,
  assistantVoicePlaceholder,
  assistantWithGreeting,
  assistantWorkingText,
} from "./assistantModel";
import {
  assistantIsBusy,
  assistantIsUsable,
  type TableAssistantMessageView,
  type TableAssistantView,
} from "./assistantView";

const labels = (patch: Partial<TableLabels>): TableLabels => patch;

function view(patch: Partial<TableAssistantView> = {}): TableAssistantView {
  return {
    status: "idle",
    messages: [],
    draft: "",
    setDraft: vi.fn(),
    send: vi.fn(),
    stop: vi.fn(),
    suggestions: [],
    runSuggestion: vi.fn(),
    ...patch,
  };
}

const QUESTION = {
  id: "q1",
  question: "Which team?",
  allowFreeText: true,
};

describe("status", () => {
  it("is busy only while sending and usable once connected", () => {
    expect(assistantIsBusy("sending")).toBe(true);
    expect(assistantIsBusy("idle")).toBe(false);
    expect(assistantIsUsable("connecting")).toBe(false);
    expect(assistantIsUsable("disconnected")).toBe(false);
    expect(assistantIsUsable("idle")).toBe(true);
  });

  it("tones the badge by what the reader should feel about it", () => {
    expect(assistantBadgeTone("sending")).toBe("busy");
    expect(assistantBadgeTone("connecting")).toBe("busy");
    expect(assistantBadgeTone("awaiting-approval")).toBe("warning");
    expect(assistantBadgeTone("error")).toBe("danger");
    expect(assistantBadgeTone("disconnected")).toBe("danger");
    expect(assistantBadgeTone("idle")).toBe("neutral");
  });
});

describe("assistantLauncherName", () => {
  it("names the waiting write for a screen reader", () => {
    expect(assistantLauncherName(undefined, false)).toBe("Ask AI");
    expect(assistantLauncherName(undefined, true)).toBe(
      "Ask AI — A change is waiting for your decision."
    );
    expect(
      assistantLauncherName(
        labels({
          assistantOpen: "Assistant",
          approvalWaitingElsewhere: "Wait",
        }),
        true
      )
    ).toBe("Assistant — Wait");
  });
});

describe("the composer", () => {
  const asking: TableAssistantMessageView[] = [
    { id: "1", role: "assistant", text: "Which?", question: QUESTION },
    { id: "2", role: "user", text: "hm" },
  ];

  it("finds the latest question in the conversation", () => {
    expect(assistantQuestion(asking)).toBe(QUESTION);
    expect(assistantQuestion([])).toBeUndefined();
  });

  it("answers a question, idle, and ignores an empty draft", () => {
    const answer = vi.fn();
    const setDraft = vi.fn();
    const empty = assistantComposerState(
      view({ messages: asking, answer, setDraft, draft: "  " })
    );
    expect(empty).toMatchObject({ busy: false, answering: true });
    empty.send();
    expect(answer).not.toHaveBeenCalled();

    assistantComposerState(
      view({ messages: asking, answer, setDraft, draft: " Core " })
    ).send();
    expect(setDraft).toHaveBeenCalledWith("");
    expect(answer).toHaveBeenCalledWith({ text: "Core" });
  });

  it("sends a turn when there is nothing to answer", () => {
    const send = vi.fn();
    const state = assistantComposerState(
      view({ messages: asking, send, busy: true })
    );
    expect(state).toMatchObject({ busy: true, answering: false });
    state.send();
    expect(send).toHaveBeenCalledWith();
  });
});

describe("assistantRejoinable", () => {
  const resumable = { text: "sort by salary" };

  it("offers a rejoin only with work, a way back and nothing in flight", () => {
    expect(assistantRejoinable(view())).toBe(false);
    expect(assistantRejoinable(view({ resumable }))).toBe(false);
    expect(assistantRejoinable(view({ resumable, resume: vi.fn() }))).toBe(
      true
    );
    expect(
      assistantRejoinable(view({ resumable, resume: vi.fn(), busy: true }))
    ).toBe(false);
    expect(
      assistantRejoinable(
        view({ resumable, resume: vi.fn(), status: "sending" })
      )
    ).toBe(false);
  });
});

describe("messages", () => {
  it("opens with a greeting unless the host asked for silence", () => {
    expect(assistantWithGreeting([], undefined, undefined)[0]?.text).toBe(
      "What would you like to do?"
    );
    expect(
      assistantWithGreeting([], undefined, labels({ assistantEmpty: "Hi" }))[0]
        ?.text
    ).toBe("Hi");
    expect(assistantWithGreeting([], " ", undefined)).toEqual([]);
  });

  it("stands a placeholder in for a clip still being transcribed", () => {
    const clip: TableAssistantMessageView = {
      id: "1",
      role: "user",
      text: "",
      transcribing: true,
    };
    expect(assistantVoicePlaceholder(clip, undefined).text).toBe(
      "Voice message"
    );
    expect(
      assistantVoicePlaceholder(clip, labels({ assistantVoiceMessage: "Clip" }))
        .text
    ).toBe("Clip");
    const heard = { ...clip, text: "hello" };
    expect(assistantVoicePlaceholder(heard, undefined)).toBe(heard);
  });

  it("reduces a name to its initials", () => {
    expect(assistantInitials(" ada  lovelace byron ")).toBe("AL");
    expect(assistantInitials("grace")).toBe("G");
    expect(assistantInitials("   ")).toBe("");
  });
});

describe("receipts", () => {
  const edit = {
    status: "staged",
    idempotencyKey: "k1",
    subject: {
      kind: "edit",
      row: "Ada",
      column: "Name",
      terms: [{ column: "Team", value: "Core" }],
      direction: "asc" as const,
      cleared: false,
    },
  };

  it("shows only what changed the table", () => {
    const read = {
      status: "applied",
      idempotencyKey: "r",
      subject: { kind: "read" },
    };
    expect(assistantShownReceipts([read, edit])).toEqual([edit]);
    expect(assistantShownReceipts(undefined)).toEqual([]);
  });

  it("heads a card from the labels, then the status, never the key", () => {
    const action = vi.fn(() => "Edit staged");
    expect(
      assistantReceiptHeadline(edit, labels({ assistantReceiptAction: action }))
    ).toBe("Edit staged");
    expect(action).toHaveBeenCalledWith({
      kind: "edit",
      status: "staged",
      cleared: false,
    });
    expect(
      assistantReceiptHeadline(
        { status: "applied", idempotencyKey: "x" },
        labels({ assistantReceiptStatus: () => "Done" })
      )
    ).toBe("Done");
    expect(
      assistantReceiptHeadline(
        { status: "applied", idempotencyKey: "x" },
        undefined
      )
    ).toBe("applied");
  });

  it("describes what it acted on, the host's words first", () => {
    const terms = vi.fn(() => "Team is Core");
    expect(
      assistantReceiptDetail(edit, labels({ assistantReceiptTerms: terms }))
    ).toBe("Team is Core");
    expect(terms).toHaveBeenCalledWith({
      kind: "edit",
      terms: edit.subject.terms,
      direction: "asc",
    });
    expect(
      assistantReceiptDetail(
        { ...edit, subject: { detail: "Given" } },
        undefined
      )
    ).toBe("Given");
    expect(
      assistantReceiptDetail(
        { status: "applied", idempotencyKey: "x" },
        undefined
      )
    ).toBeUndefined();
    expect(
      assistantReceiptDetail(
        { status: "applied", idempotencyKey: "x", subject: { kind: "sort" } },
        undefined
      )
    ).toBeUndefined();
  });

  it("says where an edit landed and whether it still needs saving", () => {
    expect(assistantReceiptWhere(edit)).toBe("Ada · Name");
    expect(
      assistantReceiptWhere({ status: "applied", idempotencyKey: "x" })
    ).toBe("");
    expect(assistantReceiptNeedsSave(edit)).toBe(true);
    expect(
      assistantReceiptNeedsSave({ status: "applied", idempotencyKey: "x" })
    ).toBe(false);
  });

  it("names the turn's undo and the actions it took", () => {
    expect(assistantUndoTurnLabel(2, undefined)).toBe("Undo all");
    expect(assistantUndoTurnLabel(1, undefined)).toBe("Undo");
    expect(
      assistantUndoTurnLabel(
        3,
        labels({ assistantUndoAll: "All", assistantUndo: "One" })
      )
    ).toBe("All");
    expect(assistantActionsName(1, undefined)).toBe("1 action");
    expect(assistantActionsName(3, undefined)).toBe("3 actions");
    expect(
      assistantActionsName(
        2,
        labels({ assistantActions: (n) => `${String(n)}!` })
      )
    ).toBe("2!");
    expect(assistantUndoReason(undefined, undefined)).toBe(
      "The table has changed since this ran."
    );
    expect(
      assistantUndoReason(
        "moved",
        labels({ assistantUndoBlocked: (code) => `blocked: ${code}` })
      )
    ).toBe("blocked: moved");
  });
});

describe("progress", () => {
  it("counts against a total, or alone, or in the labels' words", () => {
    expect(assistantProgressText({ done: 3, total: 10 }, undefined)).toBe(
      "3 of 10"
    );
    expect(assistantProgressText({ done: 3 }, undefined)).toBe("3 done");
    expect(
      assistantProgressText(
        { done: 3, total: 10 },
        labels({ assistantProgress: (done) => `${String(done)} ok` })
      )
    ).toBe("3 ok");
  });

  it("leads with the capability's noun, or says it is working", () => {
    expect(assistantWorkingText(null, undefined)).toBe("Working…");
    expect(
      assistantWorkingText(
        undefined,
        labels({ assistantConnection: () => "Busy" })
      )
    ).toBe("Busy");
    expect(
      assistantWorkingText({ done: 1, total: 2, label: "Rows" }, undefined)
    ).toBe("Rows — 1 of 2");
    expect(assistantWorkingText({ done: 1 }, undefined)).toBe("1 done");
  });
});
