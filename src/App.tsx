import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { auth } from "./firebase";

import Register from "./components/Register";
import Login from "./components/Login";
import Diary from "./components/Diary";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string>(() => localStorage.getItem("userId") ?? "");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      signInAnonymously(auth).catch((e: any) => {
        console.error("signInAnonymously failed:", e);
        alert(`Could not start session: ${e?.code ?? ""} ${e?.message ?? e}`);
      });
    }
  }, [user]);

  const ready = useMemo(() => Boolean(user), [user]);

  if (!ready) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
        <h1>App Feedback Diary</h1>
        <p>Starting session…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui",
      }}
    >
      <h1>App Feedback Diary</h1>

      {!userId ? (
        <div style={{ display: "grid", gap: 24 }}>
          <Register
            onRegistered={(newUserId) => {
              localStorage.setItem("userId", newUserId);
              setUserId(newUserId);
            }}
          />
          <hr />
          <Login
            onLoggedIn={(existingUserId) => {
              localStorage.setItem("userId", existingUserId);
              setUserId(existingUserId);
            }}
          />
        </div>
      ) : (
        <Diary
          userId={userId}
          onLogout={() => {
            localStorage.removeItem("userId");
            setUserId("");
          }}
        />
      )}
    </div>
  );
}