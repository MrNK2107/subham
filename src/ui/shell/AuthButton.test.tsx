import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthButton } from "./AuthButton";

const auth = { name: "auth" };
let listener: ((user: unknown) => void) | null = null;
const signInWithPopup = vi.fn();
const signOut = vi.fn();
const startSync = vi.fn();
const stopSync = vi.fn();
const unsubscribe = vi.fn();

vi.mock("@/store/firebase", () => ({
  firebaseEnabled: true,
  getFirebase: () => Promise.resolve({ auth }),
}));
vi.mock("@/store/cloud", () => ({
  startSync: (...a: unknown[]) => startSync(...a),
  stopSync: () => stopSync(),
}));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: unknown) => void) => {
    listener = cb;
    return unsubscribe;
  },
  GoogleAuthProvider: class {},
  signInWithPopup: (...a: unknown[]) => signInWithPopup(...a),
  signOut: (...a: unknown[]) => signOut(...a),
}));

beforeEach(() => {
  vi.clearAllMocks();
  startSync.mockResolvedValue(undefined);
  listener = null;
});

async function mounted() {
  const view = render(<AuthButton />);
  // Let the dynamic imports inside the effect settle and register the auth listener.
  await vi.waitFor(() => expect(listener).not.toBeNull());
  return view;
}

describe("AuthButton", () => {
  it("signs in with a Google popup", async () => {
    signInWithPopup.mockResolvedValue({});
    const user = userEvent.setup();
    await mounted();
    await user.click(screen.getByRole("button", { name: "Sign in with Google" }));
    expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.anything());
  });

  it("announces a failed sign-in", async () => {
    signInWithPopup.mockRejectedValue(new Error("popup closed"));
    const user = userEvent.setup();
    await mounted();
    await user.click(screen.getByRole("button", { name: "Sign in with Google" }));
    expect(await screen.findByText("Sign-in didn't work. Please try again.")).toBeInTheDocument();
  });

  it("starts syncing when signed in, and signs out again", async () => {
    const user = userEvent.setup();
    const view = await mounted();
    act(() => listener!({ uid: "u1" }));
    expect(startSync).toHaveBeenCalledWith({ uid: "u1" });
    expect(screen.getByRole("status")).toHaveTextContent("Synced to your account");
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledWith(auth);
    act(() => listener!(null));
    expect(stopSync).toHaveBeenCalled();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
