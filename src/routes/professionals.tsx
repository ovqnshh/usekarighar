import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/professionals")({
  head: () => ({
    meta: [
      { title: 'Find Local Home Professionals — Karighar' },
      { name: 'description', content: 'Karighar verified home services platform.' },
    ],
  }), component: () => <Outlet /> });