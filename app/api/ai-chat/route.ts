import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type ChatPayload = {
  messages?: Array<{ role?: string; content?: string }>;
  context?: {
    user?: {
      fullName?: string;
      location?: string;
      favoritesCount?: number;
      joinedProjectsCount?: number;
      createdProjectsCount?: number;
    };
    questionnaireAnswers?: Record<string, string>;
    selectedProject?: string | null;
    globalChatOptIn?: boolean;
  };
};

function buildFallbackReply(payload: ChatPayload) {
  const latestUserMessage =
    [...(payload.messages || [])].reverse().find((message) => message.role === "user")
      ?.content || "";

  const location = payload.context?.user?.location || "your current location";
  const joinedProjectsCount = payload.context?.user?.joinedProjectsCount ?? 0;
  const favoritesCount = payload.context?.user?.favoritesCount ?? 0;
  const selectedProject = payload.context?.selectedProject;
  const projectType = payload.context?.questionnaireAnswers?.project_type;

  return [
    "## Assistant response",
    "",
    `You asked: **${latestUserMessage || "no prompt provided"}**`,
    "",
    "OpenAI is not configured yet, so this fallback response is being used.",
    "",
    `- Current location: **${location}**`,
    `- Joined projects: **${joinedProjectsCount}**`,
    `- Favorite projects: **${favoritesCount}**`,
    `- Project focus: **${projectType || "still being defined"}**`,
    ...(selectedProject ? [`- Selected project: **${selectedProject}**`] : []),
    "",
    "### Next steps",
    "- Add OPENAI_API_KEY in Vercel project settings.",
    "- Redeploy after the environment variable is saved.",
    "- The chat route will then call OpenAI automatically.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatPayload;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json({
      reply: buildFallbackReply(body),
      provider: "fallback",
    });
  }

  const openai = new OpenAI({ apiKey });

  const normalizedMessages = (body.messages || [])
    .filter((message) => (message.content || "").trim().length > 0)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content || "",
    }));

  const appContextSummary = {
    fullName: body.context?.user?.fullName || null,
    location: body.context?.user?.location || null,
    favoritesCount: body.context?.user?.favoritesCount ?? 0,
    joinedProjectsCount: body.context?.user?.joinedProjectsCount ?? 0,
    createdProjectsCount: body.context?.user?.createdProjectsCount ?? 0,
    selectedProject: body.context?.selectedProject || null,
    globalChatOptIn: body.context?.globalChatOptIn ?? false,
    questionnaireAnswers: body.context?.questionnaireAnswers || {},
  };

  try {
    const response = await openai.responses.create({
      model: "gpt-5",
      instructions:
        "You are the AI assistant inside Prototype 6, an off-grid and project-based community app. " +
        "Use the provided app context when relevant. Help with project comparison, matching, communication, and practical next steps. " +
        "Be concise, useful, and clear. When relevant, suggest whether the user should ask the community, message a project owner, or join/open a project chat.",
      input: [
        {
          role: "system",
          content: `App context: ${JSON.stringify(appContextSummary)}`,
        },
        ...normalizedMessages,
      ],
    });

    return Response.json({
      reply: response.output_text || "",
      provider: "openai",
    });
  } catch (error) {
    console.error("AI chat route failed", error);
    return Response.json(
      {
        error: "AI chat request failed.",
      },
      { status: 500 }
    );
  }
}
