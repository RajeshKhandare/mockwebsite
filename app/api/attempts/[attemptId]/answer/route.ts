import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const payloadSchema=z.object({questionId:z.string().uuid(),selectedOption:z.number().int().min(0).max(3).nullable(),markedForReview:z.boolean().optional().default(false)});

export async function POST(request:Request,context:{params:Promise<{attemptId:string}>}){
  const {attemptId}=await context.params;
  const parsed=payloadSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid answer."},{status:400});
  const guestToken=(await cookies()).get("mock_guest")?.value??null;
  const supabase=createSupabasePublicClient();
  const {error}=await supabase.rpc("mock_save_answer",{p_attempt_id:attemptId,p_question_id:parsed.data.questionId,p_selected_option:parsed.data.selectedOption,p_marked_for_review:parsed.data.markedForReview,p_guest_token:guestToken});
  if(error){
    console.error("Test answer save failed",{attemptId,error});
    return NextResponse.json({error:error.message??"Answer could not be saved."},{status:409});
  }
  return NextResponse.json({ok:true});
}