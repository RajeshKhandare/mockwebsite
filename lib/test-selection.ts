import type { SupabaseClient } from "@supabase/supabase-js";

type RuleBucket={sectionId?:string;subjectId?:string;topicId?:string;difficulty?:string;count:number};
export type SelectionRules={buckets?:RuleBucket[];difficulty?:Partial<Record<"easy"|"medium"|"hard",number>>};

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export async function selectApprovedQuestions(
  db: SupabaseClient,
  args:{examStageId:string;language:string;count:number;rules:SelectionRules},
){
  const selected:string[]=[];
  const selectedSet=new Set<string>();

  async function take(bucket:RuleBucket, count:number){
    if(count<=0)return true;
    let query=db.from("questions").select("id").eq("exam_stage_id",args.examStageId).eq("language",args.language).eq("status","approved");
    if(bucket.sectionId)query=query.eq("section_id",bucket.sectionId);
    if(bucket.subjectId)query=query.eq("subject_id",bucket.subjectId);
    if(bucket.topicId)query=query.eq("topic_id",bucket.topicId);
    if(bucket.difficulty)query=query.eq("difficulty",bucket.difficulty);
    const {data,error}=await query.limit(Math.min(1000,Math.max(count*5,count)));
    if(error||!data)return false;
    const available=shuffle(data.map(row=>row.id).filter(id=>!selectedSet.has(id))).slice(0,count);
    if(available.length<count)return false;
    available.forEach(id=>{selectedSet.add(id);selected.push(id);});
    return true;
  }

  for (const bucket of args.rules.buckets ?? []) {
    if (bucket.count < 0 || selected.length + bucket.count > args.count) {
      return { ok: false as const, error: "The configured question blueprint exceeds this test size." };
    }
    if (!(await take(bucket, bucket.count))) {
      return { ok: false as const, error: "The approved pool does not satisfy this test blueprint." };
    }
  }

  const difficulty = args.rules.difficulty ?? {};
  for(const [difficultyName,rawCount] of Object.entries(difficulty)){
    const count=Number(rawCount);
    if (!Number.isFinite(count) || count <= 0) continue;
    if (selected.length + count > args.count) {
      return { ok: false as const, error: "The configured difficulty mix exceeds this test size." };
    }
    if (!(await take({ difficulty: difficultyName, count }, count))) {
      return { ok: false as const, error: "The approved pool does not satisfy the configured difficulty mix." };
    }
  }

  if (selected.length > args.count) {
    return { ok: false as const, error: "The configured question blueprint exceeds this test size." };
  }

  const remaining = args.count - selected.length;
  if(remaining>0){
    const {data,error}=await db.from("questions").select("id").eq("exam_stage_id",args.examStageId).eq("language",args.language).eq("status","approved").limit(Math.min(2000,Math.max(remaining*10,remaining)));
    if(error||!data)return {ok:false as const,error:"Approved question pool could not be loaded."};
    const available=shuffle(data.map(row=>row.id).filter(id=>!selectedSet.has(id))).slice(0,remaining);
    if(available.length<remaining)return {ok:false as const,error:"The approved question pool is smaller than the configured test size."};
    available.forEach(id=>{selectedSet.add(id);selected.push(id);});
  }

  return {ok:true as const,questionIds:shuffle(selected)};
}
