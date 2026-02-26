import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import "./Diary.css";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

type Props = {
  userId: string;
  onLogout: () => void;
};

type Entry = {
  id: string;
  dateKey: string;
  text: string;
  rating: number;
  createdAt?: any;
};

function todayKey(): string {
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

  // null = creating a new entry; otherwise editing an existing entry doc id
  const [editingId, setEditingId] = useState<string | null>(null);

  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);

  const entriesCol = useMemo(() => collection(db, "users", userId, "entries"), [userId]);

  async function load() {
    // Today’s entries
    const qToday = query(
      entriesCol,
      where("dateKey", "==", todayKey()),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    // Recent entries (across days)
    const qRecent = query(entriesCol, orderBy("createdAt", "desc"), limit(100));

    const [sToday, sRecent] = await Promise.all([getDocs(qToday), getDocs(qRecent)]);

    setTodayEntries(
      sToday.docs.map((d) => ({
        id: d.id,
        dateKey: d.data().dateKey ?? "",
        text: d.data().text ?? "",
        rating: Number(d.data().rating ?? 3),
        createdAt: d.data().createdAt,
      }))
    );

    setRecentEntries(
      sRecent.docs.map((d) => ({
        id: d.id,
        dateKey: d.data().dateKey ?? "",
        text: d.data().text ?? "",
        rating: Number(d.data().rating ?? 3),
        createdAt: d.data().createdAt,
      }))
    );
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function startNewEntry() {
    setEditingId(null);
    setText("");
    setRating(3);
  }

  function editEntry(e: Entry) {
    setEditingId(e.id);
    setText(e.text);
    setRating(e.rating);
  }

  async function save() {
    const u = auth.currentUser;
    if (!u) return alert("Session not ready yet.");

    setBusy(true);
    try {
      if (editingId) {
        // update existing
        const ref = doc(db, "users", userId, "entries", editingId);
        await updateDoc(ref, {
          text,
          rating,
          updatedAt: serverTimestamp(),
        });
      } else {
        // create new (multiple per day works because this is a new doc each time)
        await addDoc(entriesCol, {
          uid: u.uid,
          dateKey: todayKey(),
          text,
          rating,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await load();
      startNewEntry();
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
      {/* LEFT: Today */}
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Today: {todayKey()}</div>
            <div style={{ color: "#666", fontSize: 14 }}>User: {userId}</div>
          </div>
          <button onClick={onLogout} style={{ padding: 10 }}>
            Log out
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={startNewEntry} style={{ padding: 10 }}>
            New entry
          </button>
          <button disabled={busy} onClick={save} style={{ padding: 10, flex: 1 }}>
            {busy ? "Saving…" : editingId ? "Update entry" : "Save new entry"}
          </button>
        </div>

        <div style={{ height: 12 }} />

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
            rows={10}
            placeholder="What went well today? What was frustrating? Any bugs?"
            style={{ width: "100%", padding: 10, fontSize: 16 }}
          />
        </label>

        <hr style={{ margin: "16px 0" }} />

        <h2 style={{ marginTop: 0 }}>Today’s entries</h2>
        {todayEntries.length === 0 ? (
          <p style={{ color: "#666" }}>No entries yet today.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {todayEntries.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => editEntry(e)}
                className={`entryBtn ${editingId === e.id ? "entryBtnActive" : ""}`}
              >
                <div style={{ fontWeight: 600 }}>
                  {e.dateKey} — {e.rating}/5
                </div>
                <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{e.text}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* RIGHT: Recent */}
      <aside className="panel stickySide">
        <h2 style={{ marginTop: 0 }}>Recent entries</h2>
        {recentEntries.length === 0 ? (
          <p style={{ color: "#666" }}>No entries yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {recentEntries.map((e) => (
              <div key={e.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 600 }}>
                  {e.dateKey} — {e.rating}/5
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