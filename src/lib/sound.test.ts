import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The module caches one AudioContext, so each test needs a fresh module instance.
beforeEach(() => { vi.resetModules(); });
afterEach(() => { vi.unstubAllGlobals(); });

function stubAudioContext() {
  const oscillator = { connect: vi.fn(), frequency: { setValueAtTime: vi.fn() }, start: vi.fn(), stop: vi.fn(), type: "" };
  const gain = { connect: vi.fn(), gain: { exponentialRampToValueAtTime: vi.fn(), setValueAtTime: vi.fn() } };
  const context = { createGain: () => gain, createOscillator: () => oscillator, currentTime: 0, destination: {}, resume: vi.fn() };
  vi.stubGlobal("AudioContext", function AudioContextStub() { return context; });
  return { context, oscillator };
}

describe("playSuccessCue", () => {
  it("resumes the context and plays one tone when Web Audio is available", async () => {
    const { context, oscillator } = stubAudioContext();
    const { playSuccessCue } = await import("./sound");

    playSuccessCue();

    expect(context.resume).toHaveBeenCalledOnce();
    expect(oscillator.start).toHaveBeenCalledOnce();
    expect(oscillator.stop).toHaveBeenCalledOnce();
  });

  it("stays silent instead of throwing when the AudioContext constructor throws", async () => {
    vi.stubGlobal("AudioContext", function AudioContextStub() { throw new Error("too many contexts"); });
    const { playSuccessCue } = await import("./sound");

    expect(() => playSuccessCue()).not.toThrow();
  });

  it("stays silent instead of throwing when Web Audio is missing", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);
    const { playSuccessCue } = await import("./sound");

    expect(() => playSuccessCue()).not.toThrow();
  });
});
