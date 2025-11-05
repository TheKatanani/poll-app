/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [polls, setPolls] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Load all polls (for admin view)
  useEffect(() => {
    const fetchPolls = async () => {
      const q = query(collection(db, "polls"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setPolls(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchPolls();
  }, []);

  const handleAddQuestion = async () => {
    if (!user) {
      alert("Please log in before adding a question.");
      router.push("/login");
      return;
    }

    const allowedEmail = "thekatanani@gmail.com"; // ✅ your admin email
    if (user.email !== allowedEmail) {
      alert("You are not authorized to add questions.");
      return;
    }

    if (!question.trim()) return alert("Please enter a question.");
    const validOptions = options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2)
      return alert("Please enter at least two options.");

    // ✅ Add to Firestore
    const docRef = await addDoc(collection(db, "polls"), {
      question,
      options: validOptions.map((text) => ({ text, votes: 0 })),
      voters: [],
      createdAt: serverTimestamp(),
    });

    // ✅ Clear form
    setQuestion("");
    setOptions(["", ""]);

    // ✅ Redirect to new poll page
    alert("Question added successfully!");
    router.push(`/poll/${docRef.id}`);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 mt-10">
      <h1 className="text-2xl font-bold text-center">Poll App</h1>

      {user ? (
        <p className="text-center text-sm text-gray-600">
          Logged in as <span className="font-medium">{user.email}</span>
        </p>
      ) : (
        <p className="text-center text-sm text-red-500">
          Not logged in — you can’t add questions.
        </p>
      )}

      {/* --- Create New Poll Form --- */}
      <div className="space-y-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question"
          className="w-full p-2 border rounded"
        />
        {options.map((opt, i) => (
          <input
            key={i}
            type="text"
            value={opt}
            onChange={(e) =>
              setOptions(
                options.map((o, idx) => (idx === i ? e.target.value : o))
              )
            }
            placeholder={`Option ${i + 1}`}
            className="w-full p-2 border rounded"
          />
        ))}
        <button
          onClick={() => setOptions([...options, ""])}
          className="text-blue-600 text-sm underline"
        >
          + Add Option
        </button>
      </div>

      <button
        onClick={handleAddQuestion}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Add Question
      </button>

      {/* --- Admin Polls List --- */}
      {user?.email === "thekatanani@gmail.com" && polls.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Your Polls</h2>
          <ul className="space-y-2">
            {polls.map((poll) => (
              <li
                key={poll.id}
                className="p-2 border rounded flex justify-between items-center"
              >
                <span>{poll.question}</span>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/poll/${poll.id}`;
                    navigator.clipboard.writeText(link);
                    alert("Link copied!");
                  }}
                  className="text-blue-600 text-sm underline"
                >
                  Copy Link
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
