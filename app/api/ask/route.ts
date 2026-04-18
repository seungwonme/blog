import { NextResponse } from "next/server";
import { streamAskGraph } from "@/features/ask";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_TURNS = 10;
const MAX_MESSAGE_LENGTH = 2000;

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
          for await (const chunk of streamAskGraph(safeQuestion, chatHistory)) {
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
