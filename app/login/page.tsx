/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setError(""); // Clear previous errors
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/"); // Redirect to home on successful login
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("Failed to log in. Please check your email and password.");
    }
  };
 
  return (
    <div className="max-w-md mx-auto p-6 space-y-4 mt-20">
      <h1 className="text-2xl font-bold text-center">Poll App Login</h1>
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="space-y-2">
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Log In
        </button> 
      </div>
    </div>
  );
}