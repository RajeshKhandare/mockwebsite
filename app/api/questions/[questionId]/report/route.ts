import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createSupabaseRequestClient } from "@/lib/supabase/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema=z.object({attemptId:z.string().uuid().optional(),reason:z.enum(["wrong_answer","ambiguous","outdated","duplicate","typo","translation","other"]),details:z.string().trim().max(2000).optional()});
export async function POST(request:Request,context:{params:Promise<{questionId:string}>}){
  const {questionId}=await context.params;
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid report."},{status:400});
  const supabase=await createSupabaseRequestClient(request);
  const {data:{user}}=await supabase.auth.getUser();
  const guestToken=(await cookies()).get("mock_guest")?.value??null;
  if(!user&&!guestToken)return NextResponse.json({error:"Sign in or open the test before reporting a question."},{status:401});
  const db=createSupabaseAdminClient();
  if(parsed.data.attemptId){
    const {data:attempt}=await db.from("test_attempts").select("id,user_id,guest_token").eq("id",parsed.data.attemptId).maybeSingle();
    if(!attempt || (user ? attempt.user_id!==user.id : attempt.guest_token!==guestToken))return NextResponse.json({error:"Attempt not found."},{status:404});
  }
  const {error}=await db.from("question_reports").insert({question_id:questionId,attempt_id:parsed.data.attemptId??null,user_id:user?.id??null,guest_token:user?null:guestToken,reason:parsed.data.reason,details:parsed.data.details??null});
  if(error)return NextResponse.json({error:"Report could not be submitted."},{status:500});
  return NextResponse.json({ok:true});
}