import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

type Props = {
  onRegistered: (userId: string) => void;
};

export default function Register({ onRegistered }: Props) {
  const [busy, setBusy] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string>("");

  async function createAccount() {
    setBusy(true);
    try {
      const ref = await addDoc(collection(db, "users"), {
        createdAt: serverTimestamp(),
        consented: true, 
      });

      setLastCreatedId(ref.id);
      onRegistered(ref.id);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Could not register.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>First time here?</h2>
      <p style={{ color: "#555" }}>
        Create your login ID. Save it somewhere safe — it acts like your password.
      </p>

      <button disabled={busy} onClick={createAccount} style={{ padding: 12, fontSize: 16 }}>
        {busy ? "Creating…" : "Create my ID"}
      </button>

      {lastCreatedId && (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700 }}>Your userID:</div>
          <div style={{ fontFamily: "monospace", fontSize: 16 }}>{lastCreatedId}</div>
          <div style={{ color: "#777", marginTop: 6 }}>
            Keep this private. You’ll use it to log in later.
          </div>
        </div>
      )}
    </div>
  );
}