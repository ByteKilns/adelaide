import { describe, expect, it } from "vitest";

import { sanitizeVoiceExpense } from "./sanitize-voice-expense";

const CATEGORY_ID = "cat-groceries";
const OTHER_CATEGORY_ID = "cat-transport";
const ME = "member-me";
const PARTNER = "member-partner";

const CONTEXT = {
  categories: [{ id: CATEGORY_ID }, { id: OTHER_CATEGORY_ID }],
  currentMemberId: ME,
  members: [{ id: ME }, { id: PARTNER }],
};

function raw(overrides: Partial<Parameters<typeof sanitizeVoiceExpense>[0]> = {}) {
  return {
    amount: 500,
    categoryId: CATEGORY_ID,
    date: "2026-08-15",
    note: "milk and eggs",
    ownerMemberId: ME,
    paidByMemberId: ME,
    understood: true,
    ...overrides,
  };
}

describe("sanitizeVoiceExpense", () => {
  it("passes through a fully valid draft unchanged", () => {
    const result = sanitizeVoiceExpense(raw(), CONTEXT);
    expect(result).toEqual({
      draft: {
        amount: 500,
        categoryId: CATEGORY_ID,
        date: "2026-08-15",
        note: "milk and eggs",
        ownerMemberId: ME,
        paidByMemberId: ME,
      },
      ok: true,
    });
  });

  it("fails with not_understood when Gemini set understood: false", () => {
    const result = sanitizeVoiceExpense(raw({ understood: false }), CONTEXT);
    expect(result).toEqual({ ok: false, reason: "not_understood" });
  });

  it("fails with not_understood when amount is missing or non-positive", () => {
    expect(sanitizeVoiceExpense(raw({ amount: 0 }), CONTEXT)).toEqual({
      ok: false,
      reason: "not_understood",
    });
    expect(sanitizeVoiceExpense(raw({ amount: -5 }), CONTEXT)).toEqual({
      ok: false,
      reason: "not_understood",
    });
  });

  it("falls back to the first category when categoryId isn't a real household category", () => {
    const result = sanitizeVoiceExpense(raw({ categoryId: "not-a-real-id" }), CONTEXT);
    expect(result).toEqual({
      draft: expect.objectContaining({ categoryId: CATEGORY_ID }),
      ok: true,
    });
  });

  it("treats the literal string 'shared' as a shared expense (null owner)", () => {
    const result = sanitizeVoiceExpense(raw({ ownerMemberId: "shared" }), CONTEXT);
    expect(result).toEqual({
      draft: expect.objectContaining({ ownerMemberId: null }),
      ok: true,
    });
  });

  it("falls back to the current member when ownerMemberId isn't a real household member", () => {
    const result = sanitizeVoiceExpense(raw({ ownerMemberId: "not-a-real-id" }), CONTEXT);
    expect(result).toEqual({
      draft: expect.objectContaining({ ownerMemberId: ME }),
      ok: true,
    });
  });

  it("falls back to the current member when paidByMemberId isn't a real household member", () => {
    const result = sanitizeVoiceExpense(raw({ paidByMemberId: "not-a-real-id" }), CONTEXT);
    expect(result).toEqual({
      draft: expect.objectContaining({ paidByMemberId: ME }),
      ok: true,
    });
  });

  it("keeps a valid non-current paidByMemberId (e.g. the partner paid)", () => {
    const result = sanitizeVoiceExpense(raw({ paidByMemberId: PARTNER }), CONTEXT);
    expect(result).toEqual({
      draft: expect.objectContaining({ paidByMemberId: PARTNER }),
      ok: true,
    });
  });

  it("falls back to today's date when date isn't in YYYY-MM-DD shape", () => {
    const result = sanitizeVoiceExpense(raw({ date: "not a date" }), CONTEXT);
    const today = new Date().toISOString().slice(0, 10);
    expect(result).toEqual({
      draft: expect.objectContaining({ date: today }),
      ok: true,
    });
  });

  it("trims whitespace-only notes down to null", () => {
    const result = sanitizeVoiceExpense(raw({ note: "   " }), CONTEXT);
    expect(result).toEqual({
      draft: expect.objectContaining({ note: null }),
      ok: true,
    });
  });
});
