let commandUploadedFiles = [];

async function uploadCommandFiles() {
  const fileInput = document.getElementById("command-files");
  const out = document.getElementById("command-upload-result");

  if (!fileInput || !fileInput.files.length) {
    out.innerText = "Choose at least one file, screenshot, PDF, or document first.";
    return;
  }

  out.innerText = "Uploading files to Capital Leverage Command Center...\n";
  commandUploadedFiles = [];

  for (const file of fileInput.files) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/documents/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      commandUploadedFiles.push(file.name);
      out.innerText += `\n✅ Uploaded: ${file.name}`;
      if (data.message) out.innerText += `\n${data.message}\n`;
    } catch (err) {
      out.innerText += `\n❌ Error uploading ${file.name}: ${err.message}\n`;
    }
  }

  out.innerText += "\nNow type your command below and hit Ask Selected Agent or All Agents Work Together.";
}

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

  const files = commandUploadedFiles.length
    ? commandUploadedFiles.join(", ")
    : "No files uploaded in this command session yet.";

  out.innerText = "Capital Leverage agents are working on: " + taskName + "...";

  const prompt = `You are Capital Leverage Command Center.

Task: ${taskName}

Uploaded files in this session:
${files}

User command / situation:
${input || "The user has not added details yet. Give a strong starter checklist and tell them what to upload or answer next."}

Work like a multi-agent team:
1. Credit Agent
2. Business Funding Agent
3. Housing Agent
4. Legal Agent
5. Document/Evidence Agent
6. Web Research Agent

Rules:
- If files were uploaded, tell the user how those files should be used.
- If the user needs credit/funding help, tell them to upload a credit report or screenshots for a stronger analysis.
- If the user needs legal help, tell them to upload letters, contracts, notices, reports, court papers, emails, screenshots, or evidence.
- Use live web research when helpful.
- Do not say "Direct Answer."
- Sound confident and practical.
- Say "Here is the move" and "We are going to."
- Do not guarantee approval, deletion, funding, or legal outcome.

Return:
1. Here is the move
2. Agent breakdown
3. Uploaded file use-plan
4. What documents/screenshots to upload next
5. What documents to draft
6. What laws/rules/programs to research
7. 60-day action plan
8. Next 10 actions`;

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

window.uploadCommandFiles = uploadCommandFiles;
window.runCommandCenter = runCommandCenter;
window.runPublicCommandTask = runPublicCommandTask;
