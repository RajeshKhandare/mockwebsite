import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const payloadSchema=z.object({
  testTemplateId:z.string().uuid(),
  language:z.enum(["en","hi","mr"]),
  questionCount:z.number().int().min(1).max(100).optional(),
});

export async function POST(request:Request){
  const supabase=await createSupabaseServerClient();
  const {data:{user}}=await supabase.auth.getUser();
  const parsed=payloadSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid attempt request."},{status:400});

  // Read the template with the same authenticated/public client used by the
  // instructions page. This prevents a misleading 404 when the server-only
  // Supabase secret is unavailable or misconfigured.
  const publicDb = createSupabasePublicClient();
  const {data:template,error:templateError}=await publicDb.from("test_templates")
    .select("id,exam_stage_id,question_count,duration_seconds,supported_languages,is_active,requires_login,selection_rules")
    .eq("id",parsed.data.testTemplateId).eq("is_active",true).maybeSingle();
  if(templateError){
    console.error("Test template lookup failed", templateError);
    return NextResponse.json({error:"The test could not be loaded. Please try again."},{status:500});
  }
  if(!template)return NextResponse.json({error:"Test not found."},{status:404});

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    console.error("Supabase admin client unavailable", error);
    return NextResponse.json({error:"The test engine is not configured on the server yet."},{status:500});
  }

  const cookieStore=await cookies();
  let guestToken=cookieStore.get("mock_guest")?.value;
  if(!user&&template.requires_login)return NextResponse.json({error:"Authentication required."},{status:401});
  if(!user&&!guestToken)guestToken=crypto.randomUUID()+"-"+crypto.randomUUID();
  if(!template.supported_languages.includes(parsed.data.language))return NextResponse.json({error:"Selected language is not available for this test."},{status:400});

  const requestedCount = parsed.data.questionCount ?? template.question_count;
  const speedCounts = [5, 10, 15, 20];
  const isSpeedTest = template.duration_seconds === 600;
  if (isSpeedTest && !speedCounts.includes(requestedCount)) {
    return NextResponse.json({error:"For the 10-minute speed test, choose 5, 10, 15 or 20 questions."},{status:400});
  }
  if (!isSpeedTest && requestedCount !== template.question_count) {
    return NextResponse.json({error:"This test uses its configured question count."},{status:400});
  }
  if (requestedCount > template.question_count) {
    return NextResponse.json({error:"The selected question count exceeds this test's configured pool size."},{status:400});
  }

  // Question selection is prebuilt in Supabase. This removes runtime
  // difficulty/pool scanning from the start path and makes each test variant
  // deterministic and production-safe.
  const { data:questionSet, error:setError } = await admin
    .from("test_question_sets")
    .select("id,question_count")
    .eq("test_template_id", template.id)
    .eq("language", parsed.data.language)
    .eq("question_count", requestedCount)
    .eq("set_number", 1)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (setError) {
    console.error("Prebuilt question set lookup failed", {
      testTemplateId: template.id,
      language: parsed.data.language,
      requestedCount,
      error: { message: setError.message, code: setError.code, details: setError.details, hint: setError.hint },
    });
    return NextResponse.json({error:"The prepared question set could not be loaded. Please try again."},{status:500});
  }
  if (!questionSet) {
    return NextResponse.json({error:"This test does not have a prepared question set for the selected question count yet."},{status:422});
  }

  const { data:setItems, error:itemError } = await admin
    .from("test_question_set_items")
    .select("question_id,position")
    .eq("set_id", questionSet.id)
    .order("position", { ascending: true });

  if (itemError) {
    console.error("Prebuilt question set items lookup failed", {
      setId: questionSet.id,
      error: { message: itemError.message, code: itemError.code, details: itemError.details, hint: itemError.hint },
    });
    return NextResponse.json({error:"The prepared questions could not be loaded. Please try again."},{status:500});
  }

  if (!setItems || setItems.length !== requestedCount) {
    return NextResponse.json({error:"This prepared test set is incomplete. Please try another test."},{status:422});
  }

  const questionIds = setItems.map((item) => item.question_id);
  const {data:optionRows,error:optionError}=await admin
    .from("question_options")
    .select("question_id,option_index,is_correct")
    .in("question_id",questionIds);

  if(optionError) {
    console.error("Prepared question option validation failed", {
      setId: questionSet.id,
      error: { message: optionError.message, code: optionError.code, details: optionError.details, hint: optionError.hint },
    });
    return NextResponse.json({error:"Question options could not be validated."},{status:500});
  }

  const optionStats=new Map<string,{count:number;correct:number}>();
  for(const option of optionRows??[]){
    const stats=optionStats.get(option.question_id)??{count:0,correct:0};
    stats.count++;
    if(option.is_correct)stats.correct++;
    optionStats.set(option.question_id,stats);
  }

  const readyQuestions=questionIds.filter((id)=>{
    const stats=optionStats.get(id);
    return stats?.count===4 && stats.correct===1;
  });

  if(readyQuestions.length !== requestedCount) {
    return NextResponse.json({error:"This prepared test set contains an invalid question. Please try another test."},{status:422});
  }

  const {data:attempt,error:attemptError}=await admin.from("test_attempts").insert({
    user_id:user?.id??null,guest_token:user?null:guestToken,test_template_id:template.id,language:parsed.data.language,
    question_count:requestedCount,duration_seconds:null,
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
