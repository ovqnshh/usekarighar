import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/pro-dashboard')({
  head: () => ({
    meta: [
      { title: 'Partner Dashboard — Karighar' },
      { name: 'description', content: 'Karighar verified home services platform.' },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});
