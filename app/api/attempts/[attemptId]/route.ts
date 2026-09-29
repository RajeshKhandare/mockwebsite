import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request:Request,context:{params:Promise<{attemptId:string}>}){
  const {attemptId}=await context.params;
  const guestToken=(await cookies()).get("mock_guest")?.value??null;
  const supabase=await createSupabaseServerClient();
  const {data,error}=await supabase.rpc("mock_get_attempt",{p_attempt_id:attemptId,p_guest_token:guestToken});
  if(error||!data){
    console.error("Test attempt load failed",{attemptId,error});
    return NextResponse.json({error:error?.message??"Questions could not be loaded."},{status:404});
  }
  return NextResponse.json(data);
}