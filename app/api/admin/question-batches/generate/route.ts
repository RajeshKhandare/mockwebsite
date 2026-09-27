import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin";
import { generateQuestionCandidates } from "@/lib/question-provider";

const schema=z.object({
  examStageId:z.string().uuid(),
  subjectId:z.string().uuid(),
  topicId:z.string().uuid(),
  language:z.enum(["en","hi","mr"]),
  count:z.number().int().min(1).max(1000),
  difficultyMix:z.record(z.enum(["easy","medium","hard"]),z.number()).optional(),
  instructions:z.string().trim().max(5000).optional(),
});

export async function POST(request:Request){
  const admin=await getCurrentAdmin();
  if(!admin)return NextResponse.json({error:"Admin access required."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid generation request."},{status:400});

  try{
    const result=await generateQuestionCandidates(parsed.data);
    if(!result.configured)return NextResponse.json({
      error:"Question generation provider is not configured yet.",
      code:"GENERATION_PROVIDER_NOT_CONFIGURED",
    },{status:503});
    return NextResponse.json({ok:true,questions:result.questions});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Question generation failed."},{status:502});
  }
}
