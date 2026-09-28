import { useState, useEffect } from "react";

export function useShortlist() {
  const [shortlist, setShortlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("karighar-shortlist");
      if (stored) {
        setShortlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load shortlist", e);
    }
  }, []);

  const toggle = (id: string) => {
    setShortlist((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      localStorage.setItem("karighar-shortlist", JSON.stringify(next));
      return next;
    });
  };

  const isSaved = (id: string) => shortlist.includes(id);

  return { shortlist, toggle, isSaved };
}
