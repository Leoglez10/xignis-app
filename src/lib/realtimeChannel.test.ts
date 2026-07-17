import { beforeEach, describe, expect, it, vi } from "vitest";

const fakeChannel = { on: vi.fn(() => fakeChannel), subscribe: vi.fn(() => fakeChannel) };
const client = { channel: vi.fn(() => fakeChannel), removeChannel: vi.fn() };

vi.mock("./supabase", () => ({ getSupabaseClient: () => client }));

import { subscribeShared } from "./realtimeChannel";

beforeEach(() => {
  fakeChannel.on.mockClear();
  fakeChannel.subscribe.mockClear();
  client.channel.mockClear();
  client.removeChannel.mockClear();
});

describe("subscribeShared", () => {
  it("comparte un solo canal entre suscriptores del mismo topic", () => {
    let fire!: (p: number) => void;
    const build = (_c: unknown, f: (p: number) => void) => {
      fire = f;
    };
    const a = vi.fn();
    const b = vi.fn();

    const offA = subscribeShared<number>("t", build as never, a);
    const offB = subscribeShared<number>("t", build as never, b);

    // Un canal + una suscripción, no dos.
    expect(client.channel).toHaveBeenCalledTimes(1);
    expect(fakeChannel.subscribe).toHaveBeenCalledTimes(1);

    // fire reparte a todos.
    fire(7);
    expect(a).toHaveBeenCalledWith(7);
    expect(b).toHaveBeenCalledWith(7);

    // El canal solo se elimina al soltar el último suscriptor.
    offA();
    expect(client.removeChannel).not.toHaveBeenCalled();
    offB();
    expect(client.removeChannel).toHaveBeenCalledTimes(1);
  });
});
