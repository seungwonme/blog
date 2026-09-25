import type { Metadata } from "next";
import { ProbabilityStatisticsPage } from "@/pages/probability-statistics";

export const metadata: Metadata = {
  title: "수학 한 칸 — 고1 확률과 통계",
  description: "고등학교 1학년 확률과 통계 핵심 공식과 문제를 한 칸씩 공부하는 학습 서비스.",
  alternates: { canonical: "https://www.aidenahn.com/probability-statistics" },
};

export default function ProbabilityStatisticsRoute() {
  return <ProbabilityStatisticsPage />;
}
