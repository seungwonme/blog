import { NextResponse } from "next/server";
import { streamAskGraph } from "@/features/ask";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// 스트리밍 LLM 응답이 중간에 끊기지 않도록 함수 실행 시간 상한을 명시.
export const maxDuration = 30;

const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_TURNS = 10;
const MAX_MESSAGE_LENGTH = 2000;

// 인메모리 IP 레이트리밋(고정 윈도우). 공개 엔드포인트가 매 요청마다 유료
// Gemini+Pinecone를 호출하므로 빈도 제한으로 cost/concurrency 남용을 막는다.
// 주의: 서버리스 인스턴스별 카운터라 다중 인스턴스 환경에선 한도가 인스턴스
// 수만큼 곱해진다. 강한 전역 보장이 필요하면 Upstash 등 외부 스토어로 교체.
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;
const rateHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateHits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    // 만료 엔트리 정리 — Map 무한 증가 방지
    if (rateHits.size > 5000) {
      for (const [key, value] of rateHits) {
        if (now > value.resetAt) rateHits.delete(key);
      }
    }
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function sanitizeContent(text: string): string {
  return text.replace(/<[^>]*>/g, "").slice(0, MAX_MESSAGE_LENGTH);
}

function validateHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  const validated: ChatMessage[] = [];
  for (const msg of history.slice(-MAX_HISTORY_TURNS)) {
    if (
      msg &&
      typeof msg === "object" &&
      typeof msg.content === "string" &&
      (msg.role === "user" || msg.role === "assistant")
    ) {
      validated.push({
        role: msg.role,
        content: sanitizeContent(msg.content),
      });
    }
  }
  return validated;
}

function encodeSse(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
}

export async function POST(request: Request) {
  try {
    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { question, history } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        {
          error: `Question too long (max ${MAX_QUESTION_LENGTH} characters)`,
        },
        { status: 400 },
      );
    }

    const chatHistory = validateHistory(history);
    const safeQuestion = sanitizeContent(question);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamAskGraph(
            safeQuestion,
            chatHistory,
            request.signal,
          )) {
            if (chunk.type === "sources") {
              controller.enqueue(encodeSse("sources", chunk.data));
            } else if (chunk.type === "token") {
              controller.enqueue(encodeSse("token", chunk.data));
            } else if (chunk.type === "done") {
              controller.enqueue(encodeSse("done", {}));
            }
          }
        } catch (error) {
          console.error("Ask stream error:", error);
          controller.enqueue(
            encodeSse("error", {
              message: "Failed to generate response",
            }),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Ask API error:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 },
    );
  }
}
