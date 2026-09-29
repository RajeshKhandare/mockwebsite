import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRequestClient } from "@/lib/supabase/request";

export async function POST(request:Request,context:{params:Promise<{attemptId:string}>}){
  const {attemptId}=await context.params;
  const guestToken=(await cookies()).get("mock_guest")?.value??null;
  const supabase=await createSupabaseRequestClient(request);
  const {data,error}=await supabase.rpc("mock_submit_attempt",{p_attempt_id:attemptId,p_guest_token:guestToken});
  if(error||!data){ console.error("Test submit failed",{attemptId,error}); return NextResponse.json({error:error?.message??"Could not submit test."},{status:409}); }
  return NextResponse.json({ok:true,result:data});
}