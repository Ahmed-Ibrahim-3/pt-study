import "./Diary.css"
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

type Props = {
  userId: string;
  onLogout: () => void;
};

type Entry = {
  id: string; 
  text: string;
  rating: number;
  updatedAt?: any;
};

function todayId(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Diary({ userId, onLogout }: Props) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number>(3);
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);

  const entryId = useMemo(() => todayId(), []);

  async function loadToday() {
    const ref = doc(db, "users", userId, "entries", entryId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const d = snap.data() as any;
      setText(d.text ?? "");
      setRating(Number(d.rating ?? 3));
    } else {
      setText("");
      setRating(3);
    }
  }

  async function loadList() {
    const col = collection(db, "users", userId, "entries");
    const q = query(col, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    setEntries(
      snap.docs.map((d) => ({
        id: d.id,
        text: d.data().text ?? "",
        rating: Number(d.data().rating ?? 3),
        updatedAt: d.data().updatedAt,
      }))
    );
  }

  useEffect(() => {
    loadToday().catch(console.error);
    loadList().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function save() {
    const u = auth.currentUser;
    if (!u) return alert("Session not ready yet.");

    setBusy(true);
    try {
      const ref = doc(db, "users", userId, "entries", entryId);
      await setDoc(
        ref,
        {
          text,
          rating,
          uid: u.uid,
          date: entryId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await loadList();
      alert("Saved!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Save failed.");
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="diaryGrid">
      {/* LEFT: Today's entry */}
      <section className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Today: {entryId}</div>
            <div style={{ color: "#666", fontSize: 14 }}>User: {userId}</div>
          </div>
          <button onClick={onLogout} style={{ padding: 10 }}>
            Log out
          </button>
        </div>

        <label>
          Overall rating (1–5)
          <input
            type="range"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div>{rating}/5</div>
        </label>

        <div style={{ height: 12 }} />

        <label>
          Diary entry
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="What went well today? What was frustrating? Any bugs? Any confusing wording?"
            style={{ width: "100%", padding: 10, fontSize: 16 }}
          />
        </label>

        <div style={{ height: 12 }} />

        <button disabled={busy} onClick={save} style={{ padding: 12, fontSize: 16, width: "100%" }}>
          {busy ? "Saving…" : "Save today’s entry"}
        </button>
      </section>

      {/* RIGHT: Previous entries */}
      <aside className="panel stickySide">
        <h2 style={{ marginTop: 0 }}>Previous entries</h2>

        {entries.length === 0 ? (
          <p style={{ color: "#666" }}>No entries yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {entries.map((e) => (
              <div key={e.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 600 }}>
                  {e.id} — {e.rating}/5
                </div>
                <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{e.text}</div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}