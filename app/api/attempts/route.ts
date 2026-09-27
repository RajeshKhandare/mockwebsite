import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { selectApprovedQuestions } from "@/lib/test-selection";

const payloadSchema=z.object({testTemplateId:z.string().uuid(),language:z.enum(["en","hi","mr"])});

export async function POST(request:Request){
  const supabase=await createSupabaseServerClient();
  const {data:{user}}=await supabase.auth.getUser();
  const parsed=payloadSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid attempt request."},{status:400});

  const admin=createSupabaseAdminClient();
  const {data:template,error:templateError}=await admin.from("test_templates")
    .select("id,exam_stage_id,question_count,supported_languages,is_active,requires_login,selection_rules")
    .eq("id",parsed.data.testTemplateId).eq("is_active",true).single();
  if(templateError||!template)return NextResponse.json({error:"Test not found."},{status:404});

  const cookieStore=await cookies();
  let guestToken=cookieStore.get("mock_guest")?.value;
  if(!user&&template.requires_login)return NextResponse.json({error:"Authentication required."},{status:401});
  if(!user&&!guestToken)guestToken=crypto.randomUUID()+"-"+crypto.randomUUID();
  if(!template.supported_languages.includes(parsed.data.language))return NextResponse.json({error:"Selected language is not available for this test."},{status:400});

  const selection=await selectApprovedQuestions(admin,{
    examStageId:template.exam_stage_id,language:parsed.data.language,count:template.question_count,
    rules:(template.selection_rules??{}) as {buckets?:Array<{sectionId?:string;subjectId?:string;topicId?:string;difficulty?:string;count:number}>;difficulty?:Record<string,number>},
  });
  if(!selection.ok)return NextResponse.json({error:selection.error},{status:422});

  const {data:optionRows,error:optionError}=await admin.from("question_options")
    .select("question_id,option_index,is_correct").in("question_id",selection.questionIds);
  if(optionError)return NextResponse.json({error:"Question options could not be validated."},{status:500});

  const optionStats=new Map<string,{count:number;correct:number}>();
  for(const option of optionRows??[]){
    const stats=optionStats.get(option.question_id)??{count:0,correct:0};
    stats.count++; if(option.is_correct)stats.correct++; optionStats.set(option.question_id,stats);
  }
  const readyQuestions=selection.questionIds.filter(id=>{
    const stats=optionStats.get(id); return stats?.count===4&&stats.correct===1;
  });
  if(readyQuestions.length<template.question_count)return NextResponse.json({error:"This test is not ready yet. Every live question must have exactly four options and one correct answer."},{status:422});

  const {data:attempt,error:attemptError}=await admin.from("test_attempts").insert({
    user_id:user?.id??null,guest_token:user?null:guestToken,test_template_id:template.id,language:parsed.data.language,duration_seconds:null,
  }).select("id").single();
  if(attemptError||!attempt)return NextResponse.json({error:"Could not start the test."},{status:500});

  const {error:linkError}=await admin.from("test_attempt_questions").insert(
    readyQuestions.map((questionId,index)=>({attempt_id:attempt.id,question_id:questionId,position:index,visited_at:index===0?new Date().toISOString():null}))
  );
  if(linkError){
    await admin.from("test_attempts").delete().eq("id",attempt.id);
    return NextResponse.json({error:"Could not prepare test questions."},{status:500});
  }

  const response=NextResponse.json({attemptId:attempt.id,guest:!user});
  if(!user&&guestToken)response.cookies.set("mock_guest",guestToken,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*24*30});
  return response;
}
