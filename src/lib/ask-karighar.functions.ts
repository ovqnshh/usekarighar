import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { Output, NoObjectGeneratedError, APICallError } from 'ai';
import { z } from 'zod';
import { BriefSchema } from './project-brief';
export type { AskBrief } from './project-brief';

async function generate<T extends z.ZodTypeAny>(schema:T, text:string, instructions:string) {
 const key=process.env['LOVABLE_API_KEY'];
 if (!key) throw new Error('AI is not configured. Please contact Karighar support.');
 const { createResponsesCall } = await import('./ai/responses.server');
 const { result }=createResponsesCall(getRequest(), {baseURL:'https://ai.gateway.lovable.dev/v1',apiKey:key,model:'openai/gpt-6-astra'},[{role:'user',content:text}],instructions,schema);
 try { return await result.output as z.infer<T>; }
 catch(error) {
 if(NoObjectGeneratedError.isInstance(error)) { try {return schema.parse(JSON.parse(error.text ?? ''));} catch {throw new Error('AI could not produce a complete plan. Your request has been kept.');} }
 if(APICallError.isInstance(error)) {
 let message=error.message;
 try { const body=JSON.parse(error.responseBody ?? '{}'); message=body.message ?? body.error?.message ?? message; } catch { /* retain safe SDK message */ }
 throw new Error(message);
 }
 throw error;
 }
}
export const parseProjectRequest=createServerFn({method:'POST'})
 .inputValidator((data:unknown)=>z.object({text:z.string().min(3).max(3000),date:z.string().optional(),location:z.string().optional()}).parse(data))
 .handler(async({data})=>({ok:true as const,brief:await generate(BriefSchema,JSON.stringify(data),`You are Karighar's senior project surveyor for Indian homes. Prepare a detailed, practical quote-ready brief tailored ONLY to this request. Use INR ₹ ranges. Never invent dimensions, location, customer budget or confirmed site conditions. Missing location/timing is empty; missing budget is To be discussed. Separate observed facts from assumptions and site checks. intent is build, renovate or fix. trades uses a relevant short professional trade name. materials is one of I have materials, Karighar should bring materials, Not sure. Provide a specific title and summary, 4-6 sequenced scope steps with acceptance criteria, 3-5 likely materials with specifications and estimated ₹ ranges (not a shopping guarantee), 3-5 safety/access/society/disposal considerations, 3 targeted unanswered questions, 2 exclusions. Size scope to the job: a small repair is not a full renovation. Cost includes rough labour and materials; state that inspection may change it. duration is a realistic range. Preferred date and location take precedence.`)}));
export const suggestProjectIdeas=createServerFn({method:'POST'})
 .inputValidator((data:unknown)=>z.object({text:z.string().min(3).max(500)}).parse(data))
 .handler(async({data})=>({ideas:(await generate(z.object({ideas:z.array(z.string())}),data.text,'Suggest three distinct, specific home-service requests in India based on the customer text. Each should be a ready-to-use sentence under 100 characters. Do not answer the task or invent a location, budget or dimensions.')).ideas.slice(0,3)}));
