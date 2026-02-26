import { useState } from "react";
import type { SyntheticEvent } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

type Props = {
  onLoggedIn: (userId: string) => void;
};

export default function Login({ onLoggedIn }: Props) {
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    const cleaned = userId.trim();
    if (!cleaned) return;

    setBusy(true);
    try {
      const ref = doc(db, "users", cleaned);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("No user found for that ID. Check it and try again.");
        return;
      }

      onLoggedIn(cleaned);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Could not log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>Already have a userID?</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          userID
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Paste your userID"
            style={{ width: "100%", padding: 10, fontSize: 16, marginTop: 6 }}
          />
        </label>
        <button disabled={busy} style={{ padding: 10, fontSize: 16 }}>
          {busy ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}