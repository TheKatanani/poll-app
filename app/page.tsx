"use client";
import { useState } from "react"; 
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const router = useRouter();

  const handleAddOption = () => setOptions([...options, ""]);

  const handleCreatePoll = async () => {
    const formattedOptions = options
      .filter(opt => opt.trim() !== "")
      .map(opt => ({ text: opt, votes: 0 }));
    const docRef = await addDoc(collection(db, "polls"), {
      question,
      options: formattedOptions,
      voters: [],
      createdAt: Timestamp.now(),
    });
    router.push(`/poll/${docRef.id}`);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Create a Poll</h1>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Poll question"
        className="w-full p-2 border rounded"
      />
      {options.map((opt, i) => (
        <input
          key={i}
          value={opt}
          onChange={(e) =>
            setOptions(options.map((o, idx) => (idx === i ? e.target.value : o)))
          }
          placeholder={`Option ${i + 1}`}
          className="w-full p-2 border rounded"
        />
      ))}
      <button onClick={handleAddOption} className="w-full bg-gray-200 p-2 rounded">
        + Add Option
      </button>
      <button
        onClick={handleCreatePoll}
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        Create Poll
      </button>
    </div>
  );
}
