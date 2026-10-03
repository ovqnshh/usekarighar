import { createServerFn } from '@tanstack/react-start';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const BriefSchema = z.object({
  intent: z.enum(['build', 'renovate', 'fix']).describe('Type of project'),
  summary: z.string().describe('One-sentence summary of the job'),
  location: z.string().describe('Location mentioned, or empty string'),
  budget: z.string().describe('Budget mentioned, or empty string'),
  timing: z.string().describe('When they want it done, or empty string'),
  trades: z.string().describe('Likely trades needed, e.g. Plumber, Electrician'),
  duration: z.string().describe('Estimated job duration, e.g. 1-2 hours'),
  cost: z.string().describe('Rough cost estimate range in INR, e.g. ₹1,200–₹2,400'),
});

export type AskBrief = z.infer<typeof BriefSchema>;

export const parseProjectRequest = createServerFn({ method: 'POST' })
  .validator((data: { text: string; date?: string; location?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: BriefSchema,
        prompt: `You are a home services assistant in India. Parse this customer request and extract a structured project brief.

Customer request: "${data.text}"
${data.date ? `Preferred date: ${data.date}` : ''}
${data.location ? `Preferred location: ${data.location}` : ''}

Rules:
- intent: if they want something NEW built → build, if they want something improved/redone → renovate, if something is broken/not working → fix
- summary: one clear sentence describing the job
- location: use the preferred location if provided, otherwise extract city/area mentioned, or output 'Location not specified'
- budget: extract any budget mentioned (format as ₹X,XXX), or output 'To be discussed'
- timing: use the preferred date if given, otherwise extract timing words (tomorrow, next week etc), or output 'Flexible'
- trades: which type of professional is needed (Plumber, Electrician, Carpenter, Painter, Renovation contractor, etc.)
- duration: estimate job duration (1-2 hours, half day, 2-3 days etc)
- cost: estimate cost range in INR based on the job type and Indian market rates`,
      });
      return { ok: true as const, brief: object };
    } catch (e) {
      // Fallback: Smart keyword-based parser if LLM fails (e.g. missing API key)
      const text = data.text.toLowerCase();
      
      let intent: 'build' | 'renovate' | 'fix' = 'fix';
      if (text.match(/build|install|create|new|make/)) intent = 'build';
      if (text.match(/renovate|redo|remodel|paint|upgrade/)) intent = 'renovate';

      let trades = 'General labour / helper';
      let duration = '2-4 hours';
      let cost = '₹500 - ₹1,500';

      if (text.match(/pipe|leak|water|sink|toilet|tap/)) {
        trades = 'Plumbing repair & installation';
        duration = '1-3 hours';
        cost = '₹400 - ₹1,200';
      } else if (text.match(/wire|light|switch|fan|electrical|power/)) {
        trades = 'Electrical repair & installation';
        duration = '1-2 hours';
        cost = '₹300 - ₹1,000';
      } else if (text.match(/ac|fridge|washing|appliance|cooling/)) {
        trades = 'AC & appliance repair/installation';
        duration = '1-3 hours';
        cost = '₹500 - ₹2,500';
      } else if (text.match(/wood|furniture|door|wardrobe|bed/)) {
        trades = 'Carpentry & custom furniture';
        duration = 'Half day';
        cost = '₹800 - ₹3,000';
      } else if (text.match(/paint|color|wall|texture/)) {
        trades = 'Painting & wall finishing';
        duration = '1-2 days';
        cost = '₹2,000 - ₹10,000';
      } else if (text.match(/tile|floor|marble/)) {
        trades = 'Tiling & flooring';
        duration = '1-3 days';
        cost = '₹3,000 - ₹15,000';
      } else if (text.match(/bug|pest|termite|cockroach|mosquito/)) {
        trades = 'Pest control';
        duration = '2-4 hours';
        cost = '₹900 - ₹2,500';
      }

      const budgetMatch = data.text.match(/[₹\d][\d,]+/);
      return {
        ok: true as const,
        brief: {
          intent,
          summary: data.text.length > 3 ? data.text.charAt(0).toUpperCase() + data.text.slice(1) : 'Professional required',
          location: data.location || 'Location not specified',
          budget: budgetMatch ? (budgetMatch[0].startsWith('₹') ? budgetMatch[0] : `₹${budgetMatch[0]}`) : 'To be discussed',
          timing: data.date || 'Flexible',
          trades,
          duration,
          cost,
        },
      };
    }
  });
