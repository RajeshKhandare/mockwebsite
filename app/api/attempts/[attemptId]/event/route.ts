import { NextResponse } from "next/server";
import { z } from "zod";
import { getAttemptOwner } from "@/lib/attempt-owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema=z.object({
  questionId:z.string().uuid().optional(),
  eventType:z.enum(["view","answer","clear","mark","unmark","next","previous","submit","timeout"]),
  selectedOption:z.number().int().min(0).max(3).nullable().optional(),
  elapsedSeconds:z.number().int().min(0).max(86400).optional(),
});

export async function POST(request:Request,context:{params:Promise<{attemptId:string}>}){
  const {attemptId}=await context.params;
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid event."},{status:400});
  const owner=await getAttemptOwner();
  if(!owner.userId&&!owner.guestToken)return NextResponse.json({error:"Attempt owner not found."},{status:401});

  const db=createSupabaseAdminClient();
  const {data:attempt}=await db.from("test_attempts").select("id,user_id,guest_token,status").eq("id",attemptId).maybeSingle();
  if(!attempt || (owner.userId ? attempt.user_id!==owner.userId : attempt.guest_token!==owner.guestToken))
    return NextResponse.json({error:"Attempt not found."},{status:404});
  if(attempt.status!=="in_progress")return NextResponse.json({ok:true});

  await db.from("test_attempt_events").insert({
    attempt_id:attemptId, question_id:parsed.data.questionId??null, event_type:parsed.data.eventType,
    selected_option:parsed.data.selectedOption??null, elapsed_seconds:parsed.data.elapsedSeconds??null,
  });
  return NextResponse.json({ok:true});
}
