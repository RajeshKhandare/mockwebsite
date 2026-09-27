import type { GeneratedQuestion } from "@/lib/question-validation";

export type SemanticReviewResult = {
  verdict:"approved"|"review"|"rejected";
  score:number;
  confidence:number;
  reasons:string[];
};

export async function reviewQuestionSemantics(question:GeneratedQuestion):Promise<SemanticReviewResult|null>{
  const url=process.env.MOCKTEST_AI_REVIEW_URL;
  const secret=process.env.MOCKTEST_AI_REVIEW_SECRET;
  if(!url)return null;
  const response=await fetch(url,{
    method:"POST",
    headers:{"Content-Type":"application/json",...(secret?{"Authorization":"Bearer "+secret}:{})},
    body:JSON.stringify({question}),
    cache:"no-store",
  });
  if(!response.ok)throw new Error("Configured semantic review provider returned an error.");
  const data=await response.json() as Partial<SemanticReviewResult>;
  if(!["approved","review","rejected"].includes(String(data.verdict)))throw new Error("Semantic review provider returned an invalid verdict.");
  return {
    verdict:data.verdict as SemanticReviewResult["verdict"],
    score:Number(data.score??0),
    confidence:Number(data.confidence??0),
    reasons:Array.isArray(data.reasons)?data.reasons.map(String):[],
  };
}
