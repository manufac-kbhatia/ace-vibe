"use client";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

export default function Home() {
  const trpc = useTRPC();
  const {mutate} = useMutation(trpc.invoke.mutationOptions());
  
  return (
    <div className="text-3xl">
      <button className="border-2 border-red-900 p-4 text-2xl" onClick={() => {
        mutate({value: "Kunal bhatia"})
      }}>invoke</button>
    </div>
  );
}
