"use client";

import { useMemo, useState } from "react";

type Item={id:string;name:string};
type Stage=Item & {exam_id:string};
type Topic=Item & {subject_id:string};

export default function QuestionFactory({ exams, stages, subjects, topics }: { exams:Item[]; stages:Stage[]; subjects:Item[]; topics:Topic[] }) {
  const [examId,setExamId]=useState(exams[0]?.id ?? "");
  const [stageId,setStageId]=useState(stages.find(s=>s.exam_id===exams[0]?.id)?.id ?? "");
  const [subjectId,setSubjectId]=useState(subjects[0]?.id ?? "");
  const [topicId,setTopicId]=useState(topics.find(t=>t.subject_id===subjects[0]?.id)?.id ?? "");
  const [language,setLanguage]=useState("en");
  const [sourceType,setSourceType]=useState("ai");
  const [json,setJson]=useState("");
  const [result,setResult]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const filteredStages=useMemo(()=>stages.filter(s=>s.exam_id===examId),[stages,examId]);
  const filteredTopics=useMemo(()=>topics.filter(t=>t.subject_id===subjectId),[topics,subjectId]);

  function changeExam(value:string){setExamId(value);setStageId(stages.find(s=>s.exam_id===value)?.id ?? "");}
  function changeSubject(value:string){setSubjectId(value);setTopicId(topics.find(t=>t.subject_id===value)?.id ?? "");}

  async function submit(){
    setLoading(true);setError("");setResult("");
    try{
      const parsed: unknown = JSON.parse(json);
      const questions: unknown[] = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as Record<string, unknown>).questions)
          ? (parsed as Record<string, unknown>).questions as unknown[]
          : [];
      if(!questions.length) throw new Error("Paste a JSON array or an object containing a questions array.");
      const enriched=questions.map((q)=>{
        const source = typeof q === "object" && q !== null ? q as Record<string, unknown> : {};
        return {
        ...source, examStageId:typeof source.examStageId === "string" ? source.examStageId : stageId, subjectId:typeof source.subjectId === "string" ? source.subjectId : subjectId, topicId:typeof source.topicId === "string" ? source.topicId : topicId,
        language:typeof source.language === "string" ? source.language : language, sourceType:typeof source.sourceType === "string" ? source.sourceType : sourceType,
      }; });
      const response=await fetch("/api/admin/question-batches",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({examStageId:stageId,subjectId,topicId,language,sourceType,questions:enriched})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error||"Batch could not be processed.");
      setResult(JSON.stringify(data,null,2));
    }catch(e){setError(e instanceof Error?e.message:"Invalid batch.");}
    finally{setLoading(false);}
  }

  return (
    <section className="panel">
      <div className="grid">
        <label>Exam<select value={examId} onChange={e=>changeExam(e.target.value)}>{exams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Stage<select value={stageId} onChange={e=>setStageId(e.target.value)}>{filteredStages.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Subject<select value={subjectId} onChange={e=>changeSubject(e.target.value)}>{subjects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Topic<select value={topicId} onChange={e=>setTopicId(e.target.value)}>{filteredTopics.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Language<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option></select></label>
        <label>Source<select value={sourceType} onChange={e=>setSourceType(e.target.value)}><option value="ai">AI</option><option value="original">Original</option><option value="import">Import</option><option value="pyq_inspired">PYQ-inspired</option><option value="manual">Manual</option></select></label>
      </div>
      <label style={{display:"block",marginTop:20}}>Question JSON batch<textarea value={json} onChange={e=>setJson(e.target.value)} rows={18} placeholder={'[{"question":"...","options":["...","...","...","..."],"correctOption":0,"explanation":"...","difficulty":"medium"}]'} /></label>
      <div className="actions" style={{marginTop:16}}><button className="button primary" disabled={loading||!stageId||!subjectId||!topicId} onClick={()=>void submit()}>{loading?"Validating batch…":"Validate & process batch"}</button></div>
      {result&&<pre className="panel" style={{marginTop:20,overflow:"auto"}}>{result}</pre>}
      {error&&<p className="form-message error">{error}</p>}
    </section>
  );
}
