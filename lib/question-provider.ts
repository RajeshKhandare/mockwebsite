export type QuestionGenerationRequest = {
  examStageId:string;
  subjectId:string;
  topicId:string;
  language:"en"|"hi"|"mr";
  count:number;
  difficultyMix?:Record<"easy"|"medium"|"hard",number>;
  instructions?:string;
};

export type GeneratedQuestionPayload = {
  question:string;
  options:string[];
  correctOption:number;
  explanation:string;
  difficulty:"easy"|"medium"|"hard";
  language:"en"|"hi"|"mr";
  examStageId:string;
  subjectId:string;
  topicId:string;
};

export async function generateQuestionCandidates(request:QuestionGenerationRequest){
  const url=process.env.MOCKTEST_AI_GENERATION_URL;
  const secret=process.env.MOCKTEST_AI_GENERATION_SECRET;
  if(!url)return {configured:false as const,questions:[] as GeneratedQuestionPayload[]};

  const response=await fetch(url,{
    method:"POST",
    headers:{"Content-Type":"application/json",...(secret?{"Authorization":"Bearer "+secret}:{})},
    body:JSON.stringify(request),
    cache:"no-store",
  });
  if(!response.ok)throw new Error("Configured question generation provider returned an error.");
  const payload=await response.json() as {questions?:GeneratedQuestionPayload[]};
  return {configured:true as const,questions:Array.isArray(payload.questions)?payload.questions:[]};
}
