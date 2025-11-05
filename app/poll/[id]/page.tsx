/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";

export default function PollPage() {
  const { id } = useParams();
  const pollId = Array.isArray(id) ? id[0] : id;

  const [poll, setPoll] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false); // 🔥 new state to block double-clicks

  // Load vote status from localStorage
  useEffect(() => {
    if (!pollId) return;

    const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
    if (votedPolls.includes(pollId)) {
      // Wrap in timeout to avoid React warning
      const timer = setTimeout(() => setHasVoted(true), 0);
      return () => clearTimeout(timer);
    }
  }, [pollId]);

  // Realtime listener for poll data
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
    if (!poll || hasVoted || isVoting || !pollId) return; // prevent spam clicks
    setIsVoting(true); // 🔥 disable immediately

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

      // Save locally that this user has voted
      const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
      votedPolls.push(pollId);
      localStorage.setItem("votedPolls", JSON.stringify(votedPolls));

      setHasVoted(true);
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setIsVoting(false);
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
            className={`w-full text-left border p-2 rounded mb-2 hover:bg-gray-100 disabled:opacity-50 ${
              isVoting ? "cursor-not-allowed" : ""
            }`}
            disabled={hasVoted || isVoting} // disable during and after voting
          >
            {opt.text} — <b>{opt.votes}</b> votes
          </button>
        ))
      ) : (
        <p>No options available.</p>
      )}

      {hasVoted && <p className="mt-4 text-green-600">✅ Thanks for voting!</p>}
    </div>
  );
}
