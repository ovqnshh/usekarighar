import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/project')({
  head: () => ({
    meta: [
      { title: 'Your Projects & Active Jobs — Karighar' },
      { name: 'description', content: 'Karighar verified home services platform.' },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: '/my-projects' });
  },
  component: () => null,
});