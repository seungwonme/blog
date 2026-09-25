"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Dice5,
  Flame,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";

type Topic = "전체" | "경우의 수" | "확률" | "통계";
type Difficulty = "전체" | "개념" | "기본" | "도전";

type Formula = {
  id: string;
  category: Exclude<Topic, "전체">;
  name: string;
  formula: string;
  description: string;
  example: string;
  accent: string;
};

type Problem = {
  id: number;
  category: Exclude<Topic, "전체">;
  difficulty: Exclude<Difficulty, "전체">;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  tag: string;
};

const TOPICS: Topic[] = ["전체", "경우의 수", "확률", "통계"];

const FORMULAS: Formula[] = [
  {
    id: "addition",
    category: "경우의 수",
    name: "합의 법칙",
    formula: "m + n",
    description: "동시에 일어날 수 없는 두 사건의 경우의 수를 더해요.",
    example: "빨간 공 3개 또는 파란 공 2개 중 하나를 고르는 방법은 3 + 2 = 5가지",
    accent: "coral",
  },
  {
    id: "multiplication",
    category: "경우의 수",
    name: "곱의 법칙",
    formula: "m × n",
    description: "두 단계가 차례로 일어나는 경우의 수를 곱해요.",
    example: "상의 4벌과 하의 3벌을 고르는 방법은 4 × 3 = 12가지",
    accent: "yellow",
  },
  {
    id: "permutation",
    category: "경우의 수",
    name: "순열",
    formula: "ₙPᵣ = n! / (n−r)!",
    description: "서로 다른 n개에서 r개를 뽑아 순서를 정해 나열해요.",
    example: "5명 중 회장·부회장 2명을 뽑는 방법은 ₅P₂ = 5 × 4 = 20가지",
    accent: "blue",
  },
  {
    id: "combination",
    category: "경우의 수",
    name: "조합",
    formula: "ₙCᵣ = n! / r!(n−r)!",
    description: "서로 다른 n개에서 순서 없이 r개를 뽑아요.",
    example: "5명 중 대표 2명을 뽑는 방법은 ₅C₂ = 10가지",
    accent: "purple",
  },
  {
    id: "probability",
    category: "확률",
    name: "확률의 기본",
    formula: "P(A) = 사건 A의 경우의 수 / 전체 경우의 수",
    description: "각 근원사건이 일어날 가능성이 같을 때의 확률이에요.",
    example: "주사위에서 짝수가 나올 확률은 3 / 6 = 1 / 2",
    accent: "mint",
  },
  {
    id: "complement",
    category: "확률",
    name: "여사건의 확률",
    formula: "P(Aᶜ) = 1 − P(A)",
    description: "사건 A가 일어나지 않을 확률은 1에서 A의 확률을 빼요.",
    example: "비가 올 확률이 0.3이면 비가 오지 않을 확률은 0.7",
    accent: "coral",
  },
  {
    id: "mean",
    category: "통계",
    name: "평균",
    formula: "평균 = 자료의 합 / 자료의 개수",
    description: "자료의 값을 모두 더한 뒤 자료의 개수로 나눠요.",
    example: "4, 7, 9의 평균은 (4 + 7 + 9) / 3 = 20 / 3",
    accent: "yellow",
  },
  {
    id: "variance",
    category: "통계",
    name: "분산과 표준편차",
    formula: "분산 = 편차 제곱의 평균, 표준편차 = √분산",
    description: "자료가 평균에서 얼마나 흩어져 있는지 나타내요.",
    example: "표준편차가 작을수록 자료가 평균 주변에 모여 있어요.",
    accent: "blue",
  },
];

const PROBLEMS: Problem[] = [
  {
    id: 1,
    category: "경우의 수",
    difficulty: "개념",
    tag: "곱의 법칙",
    prompt: "서로 다른 티셔츠 4벌과 바지 3벌 중 하나씩 골라 입는 방법은 모두 몇 가지인가요?",
    options: ["7가지", "12가지", "16가지", "24가지"],
    answer: 1,
    explanation: "티셔츠를 고르는 4가지 방법마다 바지 3가지를 고를 수 있으므로 4 × 3 = 12가지예요.",
  },
  {
    id: 2,
    category: "경우의 수",
    difficulty: "기본",
    tag: "조합",
    prompt: "학생 6명 중에서 대표 2명을 뽑는 방법은 모두 몇 가지인가요?",
    options: ["12가지", "15가지", "30가지", "36가지"],
    answer: 1,
    explanation: "대표를 뽑는 순서는 중요하지 않으므로 ₆C₂ = 6 × 5 / 2 = 15가지예요.",
  },
  {
    id: 3,
    category: "확률",
    difficulty: "개념",
    tag: "확률",
    prompt: "주사위 한 개를 던질 때 3의 배수가 나올 확률은?",
    options: ["1 / 6", "1 / 3", "1 / 2", "2 / 3"],
    answer: 1,
    explanation: "3의 배수는 3, 6으로 2가지이고 전체는 6가지이므로 2 / 6 = 1 / 3이에요.",
  },
  {
    id: 4,
    category: "확률",
    difficulty: "기본",
    tag: "여사건",
    prompt: "어떤 사건이 일어날 확률이 0.28일 때, 그 사건이 일어나지 않을 확률은?",
    options: ["0.28", "0.62", "0.72", "1.28"],
    answer: 2,
    explanation: "여사건의 확률은 1 − P(A)이므로 1 − 0.28 = 0.72예요.",
  },
  {
    id: 5,
    category: "통계",
    difficulty: "기본",
    tag: "평균",
    prompt: "자료 4, 6, 7, 9, 9의 평균을 구하세요.",
    options: ["6", "7", "7.2", "8"],
    answer: 1,
    explanation: "자료의 합은 35이고 자료의 개수는 5이므로 평균은 35 / 5 = 7이에요.",
  },
  {
    id: 6,
    category: "통계",
    difficulty: "도전",
    tag: "자료 해석",
    prompt: "두 자료 A, B의 평균이 같을 때, 표준편차가 더 큰 자료에 대한 설명으로 옳은 것은?",
    options: ["자료가 평균에 더 모여 있다", "자료의 개수가 반드시 더 많다", "자료가 평균에서 더 흩어져 있다", "최댓값이 반드시 더 크다"],
    answer: 2,
    explanation: "표준편차는 자료가 평균에서 떨어진 정도를 나타내므로 클수록 자료가 더 넓게 흩어져 있어요.",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function ProbabilityStatisticsPage() {
  const [topic, setTopic] = useState<Topic>("전체");
  const [difficulty] = useState<Difficulty>("전체");
  const [activeFormula, setActiveFormula] = useState("probability");
  const [problemIndex, setProblemIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [copied, setCopied] = useState(false);

  const filteredFormulas = useMemo(
    () => FORMULAS.filter((item) => topic === "전체" || item.category === topic),
    [topic],
  );
  const filteredProblems = useMemo(
    () => PROBLEMS.filter((item) => (topic === "전체" || item.category === topic) && (difficulty === "전체" || item.difficulty === difficulty)),
    [difficulty, topic],
  );
  const currentProblem = filteredProblems[problemIndex % Math.max(filteredProblems.length, 1)] ?? PROBLEMS[0];
  const currentFormula = filteredFormulas.find((item) => item.id === activeFormula) ?? filteredFormulas[0] ?? FORMULAS[0];
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === currentProblem.answer;

  useEffect(() => {
    const saved = window.localStorage.getItem("math-one-progress");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { solvedCount?: number; streak?: number };
      setSolvedCount(parsed.solvedCount ?? 0);
      setStreak(parsed.streak ?? 0);
    } catch {
      window.localStorage.removeItem("math-one-progress");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("math-one-progress", JSON.stringify({ solvedCount, streak }));
  }, [solvedCount, streak]);


  function changeFilters(nextTopic: Topic) {
    setTopic(nextTopic);
    const nextFormulas = FORMULAS.filter((item) => nextTopic === "전체" || item.category === nextTopic);
    setActiveFormula(nextFormulas[0]?.id ?? "probability");
    setProblemIndex(0);
    setSelectedAnswer(null);
  }

  function answerProblem(index: number) {
    if (isAnswered) return;
    const correct = index === currentProblem.answer;
    setSelectedAnswer(index);
    setSolvedCount((count) => count + 1);
    setStreak((value) => (correct ? value + 1 : 0));
  }

  function nextProblem() {
    setProblemIndex((index) => (index + 1) % Math.max(filteredProblems.length, 1));
    setSelectedAnswer(null);
  }

  async function copyFormula() {
    await navigator.clipboard?.writeText(`${currentFormula.name}: ${currentFormula.formula}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="probability-app">
      <div className="app-shell">
        <header className="app-header">
          <a className="brand" href="#top" aria-label="수학 한 칸 홈">
            <span className="brand-mark">∑</span>
            <span>
              <strong>수학 한 칸</strong>
              <small>고1 확률과 통계</small>
            </span>
          </a>
          <div className="header-actions">
            <span className="live-status"><i /> 학습 기록은 이 브라우저에 저장돼요</span>
            <a className="back-link" href="https://www.aidenahn.com">aidenahn.com <ArrowRight size={14} /></a>
          </div>
        </header>

        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> 개념부터 문제까지, 한 칸씩</div>
            <h1>확률과 통계,<br /><em>감</em>으로 풀지 말고<br />구조로 풀자.</h1>
            <p>공식은 짧게 확인하고, 바로 문제에 적용해 보세요.<br />오늘 배운 한 가지가 다음 문제의 힌트가 됩니다.</p>
            <div className="hero-cta-row">
              <a href="#practice" className="primary-button">오늘의 문제 풀기 <ArrowRight size={17} /></a>
              <a href="#formulas" className="text-button">공식부터 보기 <ChevronDown size={15} /></a>
            </div>
          </div>
          <div className="hero-visual" role="img" aria-label="확률과 통계를 상징하는 도형">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="math-orb"><span>P(A)</span><strong>?</strong><small>가능성을<br />수로 바꾸는 일</small></div>
            <div className="float-card float-card-one"><Dice5 size={16} /><span>경우의 수</span><b>ₙCᵣ</b></div>
            <div className="float-card float-card-two"><BarChart3 size={16} /><span>자료의 흩어짐</span><b>σ</b></div>
            <div className="hero-grid-label">01 / probability<br />02 / statistics</div>
          </div>
        </section>

        <section className="stats-strip" aria-label="학습 현황">
          <div><span>오늘 푼 문제</span><strong>{formatNumber(solvedCount)}<small>문제</small></strong></div>
          <div><span>연속 정답</span><strong>{streak}<small>회</small></strong></div>
          <div><span>오늘의 목표</span><strong>5<small>문제</small></strong><div className="mini-progress"><i style={{ width: `${Math.min((solvedCount / 5) * 100, 100)}%` }} /></div></div>
          <div className="stats-note"><Flame size={18} /> <span>작게 풀고<br /><b>확실하게 쌓기</b></span></div>
        </section>

        <section className="section-block" id="formulas">
          <div className="section-heading">
            <div><span className="section-number">01</span><h2>공식 노트</h2><p>문제에 자주 등장하는 핵심 공식만 모았어요.</p></div>
            <div className="topic-tabs" role="tablist" aria-label="공식 주제 필터">
              {TOPICS.map((item) => <button type="button" key={item} className={topic === item ? "active" : ""} onClick={() => changeFilters(item)}>{item}</button>)}
            </div>
          </div>
          <div className="formula-layout">
            <div className="formula-list">
              {filteredFormulas.map((formula) => (
                <button type="button" key={formula.id} className={`formula-item ${formula.id === activeFormula ? "selected" : ""}`} onClick={() => setActiveFormula(formula.id)}>
                  <span className={`formula-dot ${formula.accent}`} />
                  <span><small>{formula.category}</small><strong>{formula.name}</strong></span>
                  <b>{formula.formula}</b>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
            <article className="formula-detail">
              <div className="detail-top"><span className={`formula-dot ${currentFormula.accent}`} /> <span>{currentFormula.category} / 핵심 공식</span><button type="button" onClick={copyFormula} aria-label="공식 복사">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
              <h3>{currentFormula.name}</h3>
              <div className="formula-display">{currentFormula.formula}</div>
              <p>{currentFormula.description}</p>
              <div className="formula-example"><span>EXAMPLE</span><p>{currentFormula.example}</p></div>
            </article>
          </div>
        </section>

        <section className="section-block practice-section" id="practice">
          <div className="section-heading practice-heading">
            <div><span className="section-number">02</span><h2>오늘의 문제</h2><p>정답을 고르고, 왜 그런지까지 확인해 보세요.</p></div>
            <div className="practice-meta"><Target size={17} /><span>{solvedCount} / 5 완료</span><div className="progress-track"><i style={{ width: `${Math.min((solvedCount / 5) * 100, 100)}%` }} /></div></div>
          </div>
          <div className="practice-layout">
            <article className="problem-card">
              <div className="problem-card-top"><span className="problem-index">Q {String((problemIndex % Math.max(filteredProblems.length, 1)) + 1).padStart(2, "0")}</span><div><span className="pill">{currentProblem.category}</span><span className="pill muted-pill">{currentProblem.difficulty}</span></div><button type="button" className="reset-button" onClick={() => setSelectedAnswer(null)} aria-label="답변 초기화"><RotateCcw size={16} /></button></div>
              <h3>{currentProblem.prompt}</h3>
              <div className="answers">
                {currentProblem.options.map((option, index) => {
                  const state = isAnswered ? (index === currentProblem.answer ? "correct" : index === selectedAnswer ? "wrong" : "dimmed") : "";
                  return <button type="button" key={option} className={`answer-option ${state}`} onClick={() => answerProblem(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{isAnswered && index === currentProblem.answer && <Check size={17} />}</button>;
                })}
              </div>
              {isAnswered && <div className={`answer-feedback ${isCorrect ? "correct-feedback" : "wrong-feedback"}`}><strong>{isCorrect ? "정답이에요!" : "다시 살펴봐요."}</strong><p>{currentProblem.explanation}</p></div>}
              <button type="button" className="next-button" onClick={nextProblem} disabled={!isAnswered}>{isAnswered ? "다음 문제" : "답을 선택하세요"} <ArrowRight size={16} /></button>
            </article>
            <aside className="side-note"><div className="side-note-icon"><CircleHelp size={18} /></div><h3>막혔나요?</h3><p>문제에서 묻는 상황을 먼저 작은 단계로 나눠 보세요. 어떤 공식이 필요한지 보이면 계산은 따라옵니다.</p><a href="#formulas">공식 노트 다시 보기 <ArrowRight size={15} /></a></aside>
          </div>
        </section>

        <section className="quick-tools">
          <div className="tool-copy"><span className="section-number">03</span><h2>빠른 도구</h2><p>시험 직전, 헷갈리는 개념을 빠르게 점검해요.</p></div>
          <div className="tool-cards"><a href="#formulas" className="tool-card"><span className="tool-icon blue-icon"><BarChart3 size={20} /></span><strong>개념 다시 보기</strong><small>핵심 공식 8개</small><ArrowRight size={16} /></a><a href="#practice" className="tool-card"><span className="tool-icon coral-icon"><Dice5 size={20} /></span><strong>랜덤 문제</strong><small>6문제 중 하나</small><ArrowRight size={16} /></a><div className="tool-card score-card"><span className="tool-icon yellow-icon"><Flame size={20} /></span><strong>나의 기록</strong><small>{solvedCount ? `${solvedCount}문제를 풀었어요` : "아직 첫 문제 전이에요"}</small><b>{solvedCount > 0 ? `${Math.min(Math.round((streak / solvedCount) * 100), 100)}%` : "—"}</b></div></div>
        </section>

        <footer className="app-footer"><span>수학 한 칸 <i>·</i> 고1 확률과 통계</span><span>작은 이해가 큰 차이를 만듭니다.</span></footer>
      </div>
    </main>
  );
}
