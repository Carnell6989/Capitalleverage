async function runCommandCenter() {
  const type = document.getElementById("command-type")?.value || "full";
  return runPublicCommandTask(type);
}

async function runPublicCommandTask(task) {
  const input = document.getElementById("command-input")?.value || "";
  const out = document.getElementById("command-answer");

  if (!out) return alert("Command answer box missing.");

  const taskName = {
    credit: "Credit Strategy",
    business: "Business Funding Plan",
    housing: "Housing Plan",
    legal: "Legal Strategy",
    documents: "Document / Evidence Plan",
    full: "Full Leverage Plan",
    calendar: "60-Day Calendar Plan",
    letters: "Draft Letters / Complaints",
    research: "Web Research Plan"
  }[task] || "Full Leverage Plan";

  out.innerText = "Capital Leverage agents are building: " + taskName + "...";

  const prompt = `You are Capital Leverage Command Center.

Task: ${taskName}

User situation:
${input || "The user has not added details yet. Give a strong starter checklist and tell them what to upload or answer next."}

Work like a multi-agent team:
1. Credit Agent
2. Business Funding Agent
3. Housing Agent
4. Legal Agent
5. Document/Evidence Agent
6. Web Research Agent

Use live web research when helpful.

Response style:
- Do not say "Direct Answer"
- Sound confident and practical
- Say "Here is the move"
- Say "We are going to"
- Do not guarantee approval, deletion, funding, or legal outcome

Return:
1. Here is the move
2. Agent breakdown
3. What to upload
4. What documents to draft
5. What laws/rules/programs to research
6. 60-day action plan
7. Next 10 actions`;

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        mode: "research",
        message: prompt
      })
    });

    const data = await res.json();
    out.innerText = data.answer || "No command response returned.";
  } catch (err) {
    out.innerText = "Command Center error: " + err.message;
  }
}

window.runCommandCenter = runCommandCenter;
window.runPublicCommandTask = runPublicCommandTask;
