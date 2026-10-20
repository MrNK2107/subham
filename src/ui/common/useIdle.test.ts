import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIdle } from "./useIdle";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useIdle", () => {
  it("waits for an idle callback once the document has loaded", () => {
    let fire: () => void = () => {};
    const ric = vi.fn((cb: () => void) => {
      fire = cb;
      return 7;
    });
    const cic = vi.fn();
    vi.stubGlobal("requestIdleCallback", ric);
    vi.stubGlobal("cancelIdleCallback", cic);
    const { result, unmount } = renderHook(() => useIdle(1500));
    expect(result.current).toBe(false);
    expect(ric).toHaveBeenCalledWith(expect.any(Function), { timeout: 1500 });
    act(() => fire());
    expect(result.current).toBe(true);
    unmount();
    expect(cic).toHaveBeenCalledWith(7);
  });

  it("falls back to a short timer without requestIdleCallback", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    const { result } = renderHook(() => useIdle());
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(250));
    expect(result.current).toBe(true);
  });

  it("waits for the load event while the document is still loading", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    const state = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const { result } = renderHook(() => useIdle());
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe(false);
    state.mockReturnValue("complete");
    act(() => {
      window.dispatchEvent(new Event("load"));
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe(true);
    state.mockRestore();
  });
});
