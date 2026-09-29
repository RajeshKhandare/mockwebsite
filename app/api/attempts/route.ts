import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseRequestClient } from "@/lib/supabase/request";

const payloadSchema=z.object({testTemplateId:z.string().uuid(),language:z.enum(["en","hi","mr"]),questionCount:z.number().int().min(1).max(100).optional()});

export async function POST(request:Request){
  const supabase=await createSupabaseRequestClient(request);
  const {data:{user}}=await supabase.auth.getUser();
  const parsed=payloadSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid attempt request."},{status:400});

  const {data:template,error:templateError}=await supabase.from("test_templates")
    .select("id,question_count,duration_seconds,supported_languages,is_active,requires_login")
    .eq("id",parsed.data.testTemplateId).eq("is_active",true).maybeSingle();
  if(templateError||!template)return NextResponse.json({error:templateError?"The test could not be loaded. Please try again.":"Test not found."},{status:templateError?500:404});
  if(template.requires_login&&!user)return NextResponse.json({error:"Authentication required."},{status:401});

  const cookieStore=await cookies();
  let guestToken=cookieStore.get("mock_guest")?.value?.trim() ?? "";
  if(!user&&!guestToken) guestToken=crypto.randomUUID()+"-"+crypto.randomUUID();
  const requestedCount=parsed.data.questionCount??template.question_count;
  const {data:attemptId,error}=await supabase.rpc("mock_start_attempt",{
    p_test_template_id:template.id,p_language:parsed.data.language,p_question_count:requestedCount,p_guest_token:user?null:guestToken
  });
  if(error||!attemptId){
    console.error("Test attempt start failed",{templateId:template.id,requestedCount,error});
    const status=error?.code==="P0001"&&/Authentication required/i.test(error.message??"")?401:422;
    return NextResponse.json({error:error?.message??"Could not start the test."},{status});
  }
  const response=NextResponse.json({attemptId,guest:!user});
  if(!user&&guestToken)response.cookies.set("mock_guest",guestToken,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*24*30});
  return response;
}