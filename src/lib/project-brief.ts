import { z } from 'zod';
export const BriefSchema = z.object({
 intent: z.enum(['build','renovate','fix']), title: z.string(), summary: z.string(), location: z.string(), budget: z.string(), timing: z.string(), materials: z.string(), trades: z.string(), duration: z.string(), cost: z.string(),
 scope: z.array(z.object({title:z.string(),detail:z.string()})),
 materialList: z.array(z.object({item:z.string(),specification:z.string(),estimate:z.string()})),
 considerations:z.array(z.string()), questions:z.array(z.string()), exclusions:z.array(z.string()),
});
export type AskBrief = z.infer<typeof BriefSchema>;
