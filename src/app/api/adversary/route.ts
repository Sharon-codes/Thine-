import { NextRequest } from "next/server";

const MEMORY = {
  user_context: {
    current_runway_months: 8,
    stated_q1_priority: "Achieve default alive status by cutting non-essential R&D.",
    recent_anxiety_logs:
      "Expressed burnout on March 5th regarding managing the engineering team.",
    core_value: "Speed over perfection.",
  },
};

const buildAdversarialResponse = (input: string) => {
  const { current_runway_months, stated_q1_priority, recent_anxiety_logs, core_value } =
    MEMORY.user_context;

  return [
    `Premise received: "${input}". With ${current_runway_months} months of runway and Q1 priority "${stated_q1_priority}", every new commitment is a wager against default alive, not a flex of ambition.`,
    `${recent_anxiety_logs} You keep invoking "${core_value}" while shrinking R&D bandwidth; that is a contradiction dressed up as discipline. If this premise is defending prior investment, name it as sunk-cost.`,
    `Define the failure you will accept this month and the failure you refuse to tolerate. Which deliverable dies this week so the core move survives?`,
  ].join("\n\n");
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input : "";

  if (!input.trim()) {
    return new Response(JSON.stringify({ error: "Missing input." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = buildAdversarialResponse(input.trim());
  return Response.json({ response });
}
