/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, increment, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";

export default function PollPage() {
  const { id } = useParams();
  const pollId = Array.isArray(id) ? id[0] : id; // ensure string

  const [poll, setPoll] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!pollId) return;

    const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");

    if (votedPolls.includes(pollId)) {
      // Wrap in timeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setHasVoted(true);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [pollId]);

  // Realtime poll updates
  useEffect(() => {
    if (!pollId) return;
    const unsub = onSnapshot(doc(db, "polls", pollId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (!Array.isArray(data.options)) data.options = [];
        setPoll(data);
      }
    });
    return () => unsub();
  }, [pollId]);

 
const handleVote = async (index: number) => {
  if (!poll || hasVoted || !pollId) return;

  try {
    const docRef = doc(db, "polls", pollId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return;

    const data = snapshot.data();
    const options = Array.isArray(data.options) ? data.options : [];

    const updatedOptions = options.map((opt: any, i: number) =>
      i === index ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );

    await updateDoc(docRef, { options: updatedOptions });

    const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
    votedPolls.push(pollId);
    localStorage.setItem("votedPolls", JSON.stringify(votedPolls));

    setHasVoted(true);
  } catch (error) {
    console.error("Vote failed:", error);
  }
};


  if (!poll) return <p className="text-center mt-10">Loading...</p>;

  const options = Array.isArray(poll.options) ? poll.options : [];

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">{poll.question}</h1>

      {options.length > 0 ? (
        options.map((opt: any, i: number) => (
          <button
            key={i}
            onClick={() => handleVote(i)}
            className="w-full text-left border p-2 rounded mb-2 hover:bg-gray-100 disabled:opacity-50"
            disabled={hasVoted}
          >
            {opt.text} — <b>{opt.votes}</b> votes
          </button>
        ))
      ) : (
        <p>No options available.</p>
      )}

      {hasVoted && <p className="mt-4 text-green-600">Thanks for voting!</p>}
    </div>
  );
}
