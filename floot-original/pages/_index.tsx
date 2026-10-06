import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, Upload, ArrowRight, Home, Library, History, CheckCircle2, XCircle, Flame, Sparkles, Moon, Sun, Star, Play, Settings, Plus, Pencil, Trash2, Volume2 } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { useThemeMode } from "../helpers/themeMode";
import styles from "./_index.module.css";

type Item = {
  id: string; subject: string; topic: string; prompt: string; answer: string;
  type?: "short_answer" | "fill_blank" | "single_choice" | "flashcard";
  options?: string[]; alt?: string; due?: string; interval?: number;
};
type Result = { knowledge_id:string; subject:string; topic:string; type:string; prompt:string; correct_answer:string; user_answer:string; correct:boolean; response_time_seconds:number };
type QuizReport = { id:string; date:string; duration_seconds:number; total:number; correct:number; accuracy:number; questions:Result[] };

const starter: Item[] = [
  {id:"demo_short",subject:"Demo",topic:"Type Answer",prompt:"What is the capital of Japan?",answer:"Tokyo",type:"short_answer"},
  {id:"demo_fill",subject:"Demo",topic:"Fill in the Blank",prompt:"World War II ended in _____.",answer:"1945",type:"fill_blank"},
  {id:"demo_choice",subject:"Demo",topic:"Multiple Choice",prompt:"Which planet is the largest in our Solar System?",answer:"Jupiter",type:"single_choice",options:["Mars","Jupiter","Saturn","Earth"]},
  {id:"demo_flash",subject:"Demo",topic:"Flashcard",prompt:"Which organelle is often called the powerhouse of the cell?",answer:"Mitochondrion",type:"flashcard"},
];

const norm=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]/g,"");
const today=()=>new Date().toISOString().slice(0,10);

export default function IndexPage(){
  const { mode, switchToDarkMode, switchToLightMode } = useThemeMode();
  const [items,setItems]=useState<Item[]>([]);
  const [quizCount,setQuizCount]=useState(0);
  const [streakDays,setStreakDays]=useState<string[]>([]);
  const [tab,setTab]=useState<"home"|"library"|"results"|"settings"|"streak">("home");
  const [review,setReview]=useState<Item[]|null>(null);
  const [idx,setIdx]=useState(0);
  const [answer,setAnswer]=useState("");
  const [revealed,setRevealed]=useState(false);
  const [result,setResult]=useState<boolean|null>(null);
  const [started,setStarted]=useState(Date.now());
  const [results,setResults]=useState<Result[]>([]);
  const [reportHistory,setReportHistory]=useState<QuizReport[]>([]);
  const [openReportId,setOpenReportId]=useState<string|null>(null);
  const [importText,setImportText]=useState("");
  const [showImport,setShowImport]=useState(false);
  const [showAdd,setShowAdd]=useState(false);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [draft,setDraft]=useState({subject:"",topic:"",prompt:"",answer:"",type:"short_answer" as Item["type"],options:""});
  const [message,setMessage]=useState("");
  const [voiceStatus,setVoiceStatus]=useState<"idle"|"loading"|"speaking"|"error">("idle");

  useEffect(()=>{ 
    try{
      const x=localStorage.getItem("recallflow_bank_v2");
      const saved: Item[] = x?JSON.parse(x):starter;
      const demoChoice: Item = {id:"demo_choice",subject:"Demo",topic:"Multiple Choice",prompt:"Which planet is the largest in our Solar System?",answer:"Jupiter",type:"single_choice",options:["Mars","Jupiter","Saturn","Earth"]};
      const merged=saved.some(i=>i.type==="single_choice")?saved:[...saved,demoChoice];
      setItems(merged.map(i=>i.id==="demo_choice"?{...i,due:today()}:i));
      setQuizCount(Number(localStorage.getItem("recallflow_quiz_count")||0));
      setStreakDays(JSON.parse(localStorage.getItem("recallflow_streak_days")||"[]"));
      setReportHistory(JSON.parse(localStorage.getItem("recallflow_reports")||"[]"));
      if(localStorage.getItem("recallflow_theme")==="dark") switchToDarkMode();
    }catch{setItems(starter)}
  },[]);
  useEffect(()=>{ if(items.length)localStorage.setItem("recallflow_bank_v2",JSON.stringify(items)) },[items]);

  const due=useMemo(()=>items.filter(x=>!x.due||x.due<=today()),[items]);
  const current=review?.[idx];

  function startReview(){
    const q=items.slice();
    setReview(q);setIdx(0);setResults([]);setAnswer("");setRevealed(false);setResult(null);setStarted(Date.now());
  }
  function grade(forced?:boolean){
    if(!current)return;
    const ok=forced ?? norm(answer)===norm(current.answer);
    const seconds=Math.max(1,Math.round((Date.now()-started)/1000));
    setResult(ok);setRevealed(true);
    setResults(r=>[...r,{knowledge_id:current.id,subject:current.subject,topic:current.topic,type:current.type||"short_answer",prompt:current.prompt,correct_answer:current.answer,user_answer:current.type==="flashcard"?(ok?"self-marked: knew":"self-marked: did not know"):answer,correct:ok,response_time_seconds:seconds}]);
    const next=new Date(); next.setDate(next.getDate()+(ok?Math.max(1,Math.round((current.interval||1)*2.2)):0));
    setItems(xs=>xs.map(x=>x.id===current.id?{...x,interval:ok?Math.max(1,Math.round((x.interval||1)*2.2)):0,due:next.toISOString().slice(0,10)}:x));
  }
  function next(){
    if(!review)return;
    if(idx+1>=review.length){
      setQuizCount(c=>{const n=c+1;localStorage.setItem("recallflow_quiz_count",String(n));return n});
      setStreakDays(ds=>{const t=today();const n=ds.includes(t)?ds:[...ds,t];localStorage.setItem("recallflow_streak_days",JSON.stringify(n));return n});
      const report:QuizReport={id:`report_${Date.now()}`,date:new Date().toISOString(),duration_seconds:results.reduce((a,b)=>a+b.response_time_seconds,0),total:results.length,correct:results.filter(x=>x.correct).length,accuracy:results.length?Math.round(results.filter(x=>x.correct).length/results.length*100):0,questions:results};
      setReportHistory(prev=>{const nextReports=[report,...prev];localStorage.setItem("recallflow_reports",JSON.stringify(nextReports));return nextReports});
      setIdx(review.length);return
    }
    setIdx(i=>i+1);setAnswer("");setRevealed(false);setResult(null);setStarted(Date.now());
  }
  function doImport(){
    try{
      const parsed=JSON.parse(importText); const arr=Array.isArray(parsed)?parsed:(parsed.items||parsed.questions);
      if(!Array.isArray(arr))throw new Error();
      const clean=arr.map((x:any,i:number)=>({id:x.id||`item_${Date.now()}_${i}`,subject:x.subject||"General",topic:x.topic||"Imported",prompt:x.prompt||x.question,answer:String(x.answer??""),type:x.type||"short_answer",options:x.options,alt:x.alt}));
      setItems(xs=>[...xs,...clean]);setShowImport(false);setImportText("");setMessage(`Imported ${clean.length} items`);
    }catch{setMessage("That JSON could not be imported.")}
  }
  function exportReport(){
    const report={date:new Date().toISOString(),duration_seconds:results.reduce((a,b)=>a+b.response_time_seconds,0),total:results.length,correct:results.filter(x=>x.correct).length,accuracy:results.length?Math.round(results.filter(x=>x.correct).length/results.length*100):0,questions:results};
    navigator.clipboard?.writeText(JSON.stringify(report,null,2));setMessage("Detailed report copied to clipboard.");
  }
  function copySavedReport(report:QuizReport){navigator.clipboard?.writeText(JSON.stringify(report,null,2));setMessage("Saved report copied to clipboard.")}
  function openAdd(item?:Item){setEditingId(item?.id||null);setDraft(item?{subject:item.subject,topic:item.topic,prompt:item.prompt,answer:item.answer,type:item.type||"short_answer",options:(item.options||[]).join("\n")}:{subject:"",topic:"",prompt:"",answer:"",type:"short_answer",options:""});setShowAdd(true)}
  function saveQuestion(){if(!draft.prompt.trim()||!draft.answer.trim()){setMessage("Add a question and answer first.");return}const data={subject:draft.subject.trim()||"General",topic:draft.topic.trim()||"General",prompt:draft.prompt.trim(),answer:draft.answer.trim(),type:draft.type,options:draft.type==="single_choice"?draft.options.split("\n").map(x=>x.trim()).filter(Boolean):undefined};if(editingId)setItems(xs=>xs.map(x=>x.id===editingId?{...x,...data}:x));else setItems(xs=>[...xs,{id:`item_${Date.now()}`,...data}]);setShowAdd(false);setMessage(editingId?"Question updated.":"Question added.");setEditingId(null)}
  function deleteQuestion(id:string){setItems(xs=>xs.filter(x=>x.id!==id));setMessage("Question deleted.")}
  async function playKokoroDemo(){
    try{
      setVoiceStatus("loading");
      const text="What is the capital of Japan? The correct answer is Tokyo.";
      const voices=window.speechSynthesis?.getVoices?.()||[];
      const preferred=voices.find(v=>/google.*english|samsung.*english|microsoft.*(aria|jenny|guy)/i.test(v.name))||voices.find(v=>/^en[-_]/i.test(v.lang))||voices[0];
      if(!window.speechSynthesis) throw new Error("Speech synthesis unavailable");
      window.speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(text);
      if(preferred) utterance.voice=preferred;
      utterance.lang=preferred?.lang||"en-US";
      utterance.rate=.94;
      utterance.pitch=1;
      utterance.onstart=()=>setVoiceStatus("speaking");
      utterance.onend=()=>setVoiceStatus("idle");
      utterance.onerror=()=>setVoiceStatus("error");
      window.speechSynthesis.speak(utterance);
    }catch(e){console.error(e);setVoiceStatus("error")}
  }
  function toggleTheme(){
    if(mode==="dark"){switchToLightMode();localStorage.setItem("recallflow_theme","light")}
    else{switchToDarkMode();localStorage.setItem("recallflow_theme","dark")}
  }
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return {key:d.toISOString().slice(0,10),label:d.toLocaleDateString(undefined,{weekday:"narrow"})}});
  let streak=0; for(let i=last7.length-1;i>=0;i--){if(streakDays.includes(last7[i].key))streak++;else if(i!==last7.length-1||streak>0)break}
  const history14=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(13-i));const key=d.toISOString().slice(0,10);return {key,label:d.toLocaleDateString(undefined,{day:"numeric",month:"short"}),done:streakDays.includes(key),today:key===today()}});
  const sortedDays=[...new Set(streakDays)].sort();
  let longest=0,run=0,prev=""; sortedDays.forEach(k=>{if(!prev){run=1}else{const a=new Date(prev),b=new Date(k);run=(Math.round((b.getTime()-a.getTime())/86400000)===1)?run+1:1}longest=Math.max(longest,run);prev=k});

  if(review){
    if(idx>=review.length){
      const correct=results.filter(x=>x.correct).length;
      const accuracy=results.length?Math.round(correct/results.length*100):0;
      return <main className={styles.reviewPage}><section className={styles.finish}>
        <div className={styles.finishBadge}><Sparkles size={18}/> QUIZ COMPLETE</div>
        <div className={styles.scoreRing}><strong>{accuracy}%</strong><span>accuracy</span></div>
        <h1>Nice work.</h1>
        <div className={styles.finishStats}><div><b>{correct}</b><span>Correct</span></div><div><b>{results.length-correct}</b><span>Missed</span></div><div><b>{results.length}</b><span>Total</span></div></div>
        <Button onClick={exportReport}><Download size={17}/> Copy full report</Button>
        <Button variant="outline" onClick={()=>setReview(null)}>Back home</Button>
        {message&&<p className={styles.note}>{message}</p>}
      </section></main>
    }
    return <main className={styles.reviewPage}><section className={styles.quiz}>
      <div className={styles.quizTop}><button className={styles.closeQuiz} onClick={()=>setReview(null)}>×</button><div className={styles.track}><span style={{width:`${((idx+1)/review.length)*100}%`}}/></div><small>{idx+1} / {review.length}</small></div>
      <div className={styles.quizMeta}><span>{(current?.type||"short_answer").replaceAll("_"," ")}</span><b>{current?.subject} · {current?.topic}</b></div>
      {current?.type==="flashcard" ? <>
        <button className={`${styles.flipCard} ${revealed?styles.flipped:""}`} onClick={()=>result===null&&setRevealed(v=>!v)} aria-label={revealed?"Show question":"Reveal answer"}>
          <div className={styles.flipInner}>
            <div className={styles.flipFront}><span>QUESTION</span><strong>{current.prompt}</strong><small>Tap to flip</small></div>
            <div className={styles.flipBack}><span>ANSWER</span><strong>{current.answer}</strong><small>Tap to see question</small></div>
          </div>
        </button>
        {revealed&&result===null&&<div className={styles.two}><Button variant="outline" onClick={()=>grade(false)}>Didn't know</Button><Button onClick={()=>grade(true)}>Knew it</Button></div>}
      </> : <div className={styles.questionPanel}>
        <p className={styles.questionKicker}>QUESTION {idx+1}</p>
        <h1>{current?.prompt}</h1>
        {current?.type==="single_choice" && current.options ? <div className={styles.options}>{current.options.map((o,i)=><button key={o} className={styles.optionButton} disabled={revealed} onClick={()=>{setAnswer(o);setTimeout(()=>grade(norm(o)===norm(current.answer)),0)}}><span>{String.fromCharCode(65+i)}</span><b>{o}</b></button>)}</div> : <div className={styles.answerArea}>
          <Input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type your answer…" disabled={revealed} onKeyDown={e=>{if(e.key==="Enter"&&answer&&!revealed)grade()}}/>
          {!revealed&&<Button disabled={!answer} onClick={()=>grade()}>Check answer</Button>}
        </div>}
      </div>}
      {result!==null&&<div className={result?styles.feedbackGood:styles.feedbackBad}><div className={styles.feedbackIcon}>{result?<CheckCircle2/>:<XCircle/>}</div><div className={styles.feedbackCopy}><strong>{result?"Correct!":"Not quite"}</strong>{!result&&<span>Correct answer: {current?.answer}</span>}</div><Button onClick={next}>Continue <ArrowRight size={17}/></Button></div>}
    </section></main>
  }

  return <div className={styles.shell}><main className={styles.main}>
    <header><div><img className={styles.brandLogo} src="/_cdn/static/92c7668f-8766-4c35-9d5c-25d15d0c168c-recallflow-logo-transparent.png" alt="RecallFlow logo"/><strong>RecallFlow</strong></div><div className={styles.headerRight}><span className={styles.mini}>{items.length} questions</span><Button variant="ghost" size="icon-md" aria-label="Change theme" onClick={toggleTheme}>{mode==="dark"?<Sun size={18}/>:<Moon size={18}/>}</Button></div></header>
    {tab==="home"&&<><section className={styles.intro}><p>Good to see you.</p><h1>Ready for a quick quiz?</h1></section>
      <section className={styles.hero}><div className={styles.heroCopy}><div className={styles.heroLabel}><Sparkles size={14}/> TODAY'S QUIZ</div><strong>{items.length}</strong><p>{items.length===1?"question":"questions"} in your quiz</p></div><Button onClick={startReview} disabled={!items.length}>Take quiz <ArrowRight size={18}/></Button></section>
      <section className={styles.streakCard}>
        <button className={styles.streakOpen} onClick={()=>setTab("streak")}>
          <div className={styles.streakTop}><div><span className={styles.streakLabel}><Flame size={16}/> CURRENT STREAK</span><strong>{streak}<small> days</small></strong></div><div className={styles.streakStars}><Star size={18} fill="currentColor"/><span>{streak*10}</span></div></div>
          <div className={styles.week}>{last7.map(d=><div key={d.key}><span>{d.label}</span><div className={streakDays.includes(d.key)?styles.dayDone:(d.key===today()?styles.dayToday:styles.dayMissed)}>{streakDays.includes(d.key)?<Star size={16} fill="currentColor"/>:d.key===today()?<Flame size={15}/>:<XCircle size={14}/>}</div></div>)}</div>
          <span className={styles.streakHint}>View streak details <ArrowRight size={13}/></span>
        </button>
      </section>
      <div className={styles.homeStats}><div><CheckCircle2 size={20}/><strong>{quizCount}</strong><span>Quizzes taken</span></div><div><BookOpen size={20}/><strong>{items.length}</strong><span>Questions</span></div></div>
      <section className={styles.homeAction}><p>Keep the habit going</p><h2>A few minutes a day is enough.</h2><Button onClick={startReview} disabled={!items.length}>Take quiz <ArrowRight size={18}/></Button></section></>}
    {tab==="library"&&<section><div className={styles.pageTitle}><div><p className={styles.eyebrow}>YOUR QUESTIONS</p><h1>Question bank</h1></div></div><div className={styles.addActions}><Button onClick={()=>openAdd()}><Plus size={17}/> Add question</Button><Button variant="outline" onClick={()=>setShowImport(!showImport)}><Upload size={17}/> Import</Button></div>
      {showAdd&&<div className={styles.questionForm}><div className={styles.formHead}><div><p className={styles.eyebrow}>{editingId?"EDIT":"NEW QUESTION"}</p><h2>{editingId?"Edit question":"Add manually"}</h2></div><button onClick={()=>setShowAdd(false)}>×</button></div><label>Question type<select value={draft.type} onChange={e=>setDraft(d=>({...d,type:e.target.value as Item["type"]}))}><option value="short_answer">Type answer</option><option value="fill_blank">Fill in the blank</option><option value="single_choice">Multiple choice</option><option value="flashcard">Flashcard</option></select></label><label>Question<Textarea value={draft.prompt} onChange={e=>setDraft(d=>({...d,prompt:e.target.value}))} placeholder="What is the capital of France?"/></label><label>Correct answer<Input value={draft.answer} onChange={e=>setDraft(d=>({...d,answer:e.target.value}))} placeholder="Paris"/></label>{draft.type==="single_choice"&&<label>Choices <small>One per line — include the correct answer</small><Textarea value={draft.options} onChange={e=>setDraft(d=>({...d,options:e.target.value}))}/></label>}<div className={styles.twoFields}><label>Subject<Input value={draft.subject} onChange={e=>setDraft(d=>({...d,subject:e.target.value}))} placeholder="Geography"/></label><label>Topic<Input value={draft.topic} onChange={e=>setDraft(d=>({...d,topic:e.target.value}))} placeholder="Capitals"/></label></div><Button onClick={saveQuestion}>{editingId?"Save changes":"Add question"}</Button></div>}
      {showImport&&<div className={styles.importBox}><p className={styles.eyebrow}>IMPORT MANY</p><h2>Paste question JSON</h2><Textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder='[{"subject":"Geography","topic":"Capitals","prompt":"Capital of France?","answer":"Paris"}]'/><Button onClick={doImport}>Import questions</Button></div>}
      {message&&<p className={styles.note}>{message}</p>}
      <div className={styles.bankCount}>{items.length} saved {items.length===1?"question":"questions"}</div><div className={styles.cards}>{items.map(x=><article key={x.id}><div className={styles.cardTop}><div><span>{x.subject}</span><small>{x.topic}</small></div><div className={styles.cardTools}><button aria-label="Edit question" onClick={()=>openAdd(x)}><Pencil size={15}/></button><button aria-label="Delete question" onClick={()=>deleteQuestion(x.id)}><Trash2 size={15}/></button></div></div><h3>{x.prompt}</h3><p>{x.answer}</p><em>{(x.type||"short_answer").replaceAll("_"," ")}</em></article>)}</div></section>}
    {tab==="results"&&<section className={styles.reportsPage}><div className={styles.pageTitle}><div><p className={styles.eyebrow}>YOUR QUIZ RECORDS</p><h1>Reports</h1></div></div>
      {reportHistory.length>0?<><div className={styles.reportOverview}><div><strong>{reportHistory.length}</strong><span>Quizzes</span></div><div><strong>{Math.round(reportHistory.reduce((a,r)=>a+r.accuracy,0)/reportHistory.length)}%</strong><span>Avg. accuracy</span></div><div><strong>{reportHistory.reduce((a,r)=>a+r.questions.filter(q=>!q.correct).length,0)}</strong><span>Total misses</span></div></div>
      <div className={styles.reportList}>{reportHistory.map((r,i)=><article className={styles.reportCard} key={r.id}>
        <button className={styles.reportHead} onClick={()=>setOpenReportId(openReportId===r.id?null:r.id)}>
          <div className={styles.reportDate}><span>{i===0?"LATEST":"QUIZ"}</span><strong>{new Date(r.date).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}</strong><small>{new Date(r.date).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}</small></div>
          <div className={styles.reportScore}><strong>{r.accuracy}%</strong><span>{r.correct}/{r.total}</span></div>
        </button>
        {openReportId===r.id&&<div className={styles.reportDetails}>
          <div className={styles.reportMiniStats}><div><b>{r.correct}</b><span>Correct</span></div><div><b>{r.total-r.correct}</b><span>Missed</span></div><div><b>{Math.round(r.duration_seconds/60)}m</b><span>Time</span></div></div>
          <div className={styles.reportQuestions}>{r.questions.map((q,qi)=><div className={q.correct?styles.reportQuestionGood:styles.reportQuestionBad} key={qi}><span>{q.correct?<CheckCircle2 size={16}/>:<XCircle size={16}/>}</span><div><b>{q.prompt}</b><small>Your answer: {q.user_answer || "No answer"}</small>{!q.correct&&<small>Correct: {q.correct_answer}</small>}</div><em>{q.response_time_seconds}s</em></div>)}</div>
          <Button variant="outline" onClick={()=>copySavedReport(r)}><Download size={16}/> Copy full report</Button>
        </div>}
      </article>)}</div></>:<div className={styles.emptyReports}><History size={34}/><h2>No reports yet</h2><p>Finish your first quiz and its full report will appear here automatically.</p><Button onClick={startReview} disabled={!items.length}><Play size={16} fill="currentColor"/> Take a quiz</Button></div>}
      {message&&<p className={styles.note}>{message}</p>}
    </section>}
    {tab==="settings"&&<section><div className={styles.pageTitle}><div><p className={styles.eyebrow}>RECALLFLOW</p><h1>Settings</h1></div></div><div className={styles.settingsList}><button onClick={toggleTheme}><span>{mode==="dark"?<Sun size={19}/>:<Moon size={19}/>} Theme</span><b>{mode==="dark"?"Dark":"Light"}</b></button><div><span><BookOpen size={19}/> Stored questions</span><b>{items.length}</b></div></div><div className={styles.voiceDemo}><div><span className={styles.voiceLabel}><Volume2 size={16}/> VOICE TEST</span><h2>Hear your device voice</h2><p>Uses the best English speech voice available on this device. Tap play to test sound.</p></div><Button onClick={playKokoroDemo} disabled={voiceStatus==="loading"||voiceStatus==="speaking"}><Volume2 size={17}/>{voiceStatus==="loading"?"Loading model…":voiceStatus==="speaking"?"Playing…":voiceStatus==="error"?"Try again":"Play sample"}</Button></div><p className={styles.note}>More quiz, scheduling and data settings can be added here.</p></section>}
    {tab==="streak"&&<section className={styles.streakPage}><button className={styles.backButton} onClick={()=>setTab("home")}>← Home</button><div className={styles.streakPageHero}><Flame size={34}/><p className={styles.eyebrow}>YOUR STREAK</p><h1>{streak} <small>day streak</small></h1><p>Complete a quiz each day to keep it going.</p></div><div className={styles.streakSummary}><div><strong>{streak}</strong><span>Current</span></div><div><strong>{longest}</strong><span>Longest</span></div><div><strong>{streakDays.length}</strong><span>Active days</span></div></div><div className={styles.streakHistoryCard}><div className={styles.historyTitle}><strong>Recent activity</strong><span><i className={styles.dotDone}/>Done <i className={styles.dotMissed}/>Missed <i className={styles.dotToday}/>Today</span></div><div className={styles.historyGrid}>{history14.map(d=><div key={d.key} className={d.done?styles.historyDone:d.today?styles.historyToday:styles.historyMissed}><span>{d.label}</span>{d.done?<Star size={15} fill="currentColor"/>:d.today?<Flame size={15}/>:<XCircle size={14}/>}</div>)}</div></div></section>}
  </main>
  <nav className={styles.nav}><button className={tab==="home"?styles.active:""} onClick={()=>setTab("home")}><Home/><span>Home</span></button><button className={tab==="library"?styles.active:""} onClick={()=>setTab("library")}><Library/><span>Questions</span></button><button className={styles.quizNav} onClick={startReview}><Play className={styles.plus} fill="currentColor"/><span>Quiz</span></button><button className={tab==="results"?styles.active:""} onClick={()=>setTab("results")}><History/><span>Report</span></button><button className={tab==="settings"?styles.active:""} onClick={()=>setTab("settings")}><Settings/><span>Settings</span></button></nav>
  </div>
}
