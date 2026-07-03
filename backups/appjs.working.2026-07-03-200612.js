function showPage(pageId, btn) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active-page"));
  document.getElementById(pageId).classList.add("active-page");

  document.querySelectorAll(".nav").forEach(nav => nav.classList.remove("active"));
  btn.classList.add("active");
}

function addBubble(type, text, provider = "") {
  const out = document.getElementById("out");
  const bubble = document.createElement("div");
  bubble.className = type === "user" ? "bubble user-bubble" : "bubble ai-bubble";

  if (provider) {
    bubble.innerHTML = `<div class="provider">Using ${provider}</div><div>${text}</div>`;
  } else {
    bubble.innerText = text;
  }

  out.appendChild(bubble);
  out.scrollTop = out.scrollHeight;
}

async function sendMsg() {
  const msgBox = document.getElementById("msg");
  const mode = document.getElementById("mode").value;
  const msg = msgBox.value.trim();

  if (!msg) return;

  addBubble("user", msg);
  msgBox.value = "";

  addBubble("ai", "Thinking...");

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message: msg, mode: mode })
    });

    const data = await res.json();

    const bubbles = document.querySelectorAll(".ai-bubble");
    bubbles[bubbles.length - 1].remove();

    addBubble("ai", data.answer, data.provider);
  } catch (err) {
    addBubble("ai", "Error: " + err.message);
  }
}

async function loadCases() {
  const list = document.getElementById("case-list");
  if (!list) return;

  const res = await fetch("/cases");
  const cases = await res.json();

  if (!cases.length) {
    list.innerHTML = "<p class='muted'>No cases saved yet.</p>";
    return;
  }

  list.innerHTML = cases.map(c => `
    <div class="case-item">
      <strong>${c.name}</strong>
      <span>${c.type} • ${c.status}</span>
      <p>${c.notes || ""}</p>
    </div>
  `).join("");
}

async function createCase() {
  const payload = {
    name: document.getElementById("case-name").value,
    type: document.getElementById("case-type").value,
    status: document.getElementById("case-status").value,
    notes: document.getElementById("case-notes").value
  };

  await fetch("/cases", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });

  document.getElementById("case-name").value = "";
  document.getElementById("case-type").value = "";
  document.getElementById("case-status").value = "";
  document.getElementById("case-notes").value = "";

  loadCases();
  loadEvidence();
}

document.addEventListener("DOMContentLoaded", loadCases);




async function loadDocuments() {
  const list = document.getElementById("doc-list");
  if (!list) return;

  const res = await fetch("/documents");
  const docs = await res.json();

  if (!docs.length) {
    list.innerHTML = "<p class='muted'>No documents uploaded yet.</p>";
    return;
  }

  list.innerHTML = docs.map(d => `
    <div class="case-item">
      <strong>${d.filename}</strong>
      <span>${d.created_at}</span>
      <button onclick="document.getElementById('doc-filename').value='${d.filename}'">Use This</button>
      <button onclick="deleteDocument('${d.filename}')">Delete</button>
    </div>
  `).join("");
}

async function uploadDocument() {
  const fileInput = document.getElementById("doc-file");
  if (!fileInput.files.length) {
    alert("Choose a file first.");
    return;
  }

  const form = new FormData();
  form.append("file", fileInput.files[0]);

  const res = await fetch("/documents/upload", {
    method: "POST",
    body: form
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  fileInput.value = "";
  document.getElementById("doc-filename").value = data.filename;
  document.getElementById("doc-answer").innerText = "";
  loadDocuments();
}

async function analyzeDocument() {
  const filename = document.getElementById("doc-filename").value.trim();
  const question = document.getElementById("doc-question").value.trim();
  const out = document.getElementById("doc-answer");

  if (!filename) {
    out.innerText = "Pick or type a filename first.";
    return;
  }

  out.innerText = "Analyzing...";

  const res = await fetch("/documents/analyze", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ filename, question })
  });

  const data = await res.json();
  out.innerText = data.answer;
}

document.addEventListener("DOMContentLoaded", loadDocuments);

async function askCapital(prompt, outId, mode = "document") {
  const out = document.getElementById(outId);
  out.innerText = "Building leverage...";
  const res = await fetch("/ask", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: prompt, mode })
  });
  const data = await res.json();
  out.innerText = data.answer;
}

function buildCreditPlan() {
  const item = document.getElementById("credit-item").value;
  const facts = document.getElementById("credit-facts").value;
  askCapital(`
Create a Capital Leverage credit action package.

Credit item/problem:
${item}

Facts:
${facts}

Include:
1. What the issue appears to be
2. What proof the user needs
3. CFPB complaint draft
4. Experian dispute draft
5. Equifax dispute draft
6. TransUnion dispute draft
7. Debt collector letter if needed
8. 7-day action plan
9. Disclaimer: no guaranteed deletion or score increase
`, "credit-answer");
}

function buildHousingPlan() {
  const goal = document.getElementById("housing-goal").value;
  askCapital(`
Create a Capital Leverage housing access plan.

User housing situation:
${goal}

Include:
1. Best housing pathways
2. FHA/USDA/VA/NACA/DPA/rent-to-own/seller financing options to verify
3. Documents needed
4. Credit barriers to fix
5. Income/employment readiness
6. 30-day plan
7. Questions to ask lenders/housing counselors
8. Disclaimer: verify current programs and no approval guarantee
`, "housing-answer");
}

function buildEmailWorkflow() {
  askCapital(`
Design the Capital Leverage email intelligence workflow.

Goal:
Connect Gmail so users can find court emails, CFPB emails, credit bureau replies, housing emails, and business emails.

Include:
1. Email categories
2. Search filters
3. Attachment saving
4. AI summaries
5. Draft reply workflow
6. Security warnings
7. Build steps for our app
`, "email-answer");
}

function runAgents() {
  const goal = document.getElementById("agent-goal").value;
  askCapital(`
Run a Capital Leverage multi-agent strategy session.

User goal:
${goal}

Agents:
1. Legal Agent
2. Credit Agent
3. Housing Agent
4. Business Agent
5. Document Agent

Each agent must give:
- Findings
- Strategy
- Documents needed
- Next 3 actions
`, "agent-answer");
}

async function generateTemplate() {
  const templateType = document.getElementById("template-type").value;
  const facts = document.getElementById("template-facts").value;
  const out = document.getElementById("template-answer");

  out.innerText = "Generating Capital Leverage document...";

  const res = await fetch("/templates/generate", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      template_type: templateType,
      facts: facts
    })
  });

  const data = await res.json();
  out.innerText = data.answer;
}

async function loadOpportunities() {
  const list = document.getElementById("opp-list");
  if (!list) return;

  const res = await fetch("/opportunities");
  const opps = await res.json();

  if (!opps.length) {
    list.innerHTML = "<p class='muted'>No opportunities saved yet.</p>";
    return;
  }

  list.innerHTML = opps.map(o => `
    <div class="case-item">
      <strong>${o.title}</strong>
      <span>${o.category} • ${o.status} • Deadline: ${o.deadline || "None"}</span>
      <p>${o.notes || ""}</p>
    </div>
  `).join("");
}

async function saveOpportunity() {
  const payload = {
    title: document.getElementById("opp-title").value,
    category: document.getElementById("opp-category").value,
    status: document.getElementById("opp-status").value,
    deadline: document.getElementById("opp-deadline").value,
    notes: document.getElementById("opp-notes").value
  };

  await fetch("/opportunities", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });

  document.getElementById("opp-title").value = "";
  document.getElementById("opp-category").value = "";
  document.getElementById("opp-status").value = "";
  document.getElementById("opp-deadline").value = "";
  document.getElementById("opp-notes").value = "";

  loadOpportunities();
}

async function buildOpportunityPlan() {
  const goal = document.getElementById("opp-goal").value;
  const out = document.getElementById("opp-answer");

  out.innerText = "Finding leverage opportunities...";

  const res = await fetch("/opportunities/plan", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ goal })
  });

  const data = await res.json();
  out.innerText = data.answer;
}

async function deleteDocument(filename) {
  await fetch("/documents/delete", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ filename })
  });

  document.getElementById("doc-filename").value = "";
  document.getElementById("doc-answer").innerText = "";
  loadDocuments();
}

async function deleteDocument(filename) {
  await fetch("/documents/delete", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ filename })
  });

  document.getElementById("doc-filename").value = "";
  document.getElementById("doc-answer").innerText = "";
  loadDocuments();
}

function copyTextById(id) {
  const el = document.getElementById(id);
  const text = el ? el.innerText : "";
  navigator.clipboard.writeText(text);
  alert("Copied.");
}

function clearDocumentQuestion() {
  document.getElementById("doc-question").value = "";
  document.getElementById("doc-question").focus();
}

function newDocumentUpload() {
  document.getElementById("doc-file").value = "";
  document.getElementById("doc-filename").value = "";
  document.getElementById("doc-question").value = "Summarize this document and list important dates, names, claims, and next steps.";
  document.getElementById("doc-answer").innerText = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function askDocumentFollowup() {
  const filename = document.getElementById("doc-filename").value.trim();
  const followup = document.getElementById("doc-followup").value.trim();
  const out = document.getElementById("doc-answer");

  if (!filename) {
    out.innerText = "Pick a document first.";
    return;
  }

  if (!followup) {
    out.innerText = "Type a follow-up question first.";
    return;
  }

  out.innerText = "Answering follow-up...";

  const res = await fetch("/documents/analyze", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      filename: filename,
      question: followup
    })
  });

  const data = await res.json();
  out.innerText = data.answer;
  document.getElementById("doc-followup").value = "";
}

async function loadEvidence() {
  const list = document.getElementById("evidence-list");
  if (!list) return;

  const res = await fetch("/evidence");
  const items = await res.json();

  if (!items.length) {
    list.innerHTML = "<p class='muted'>No evidence saved yet.</p>";
    return;
  }

  list.innerHTML = items.map(e => `
    <div class="case-item">
      <strong>${e.title}</strong>
      <span>${e.category} • ${e.date} • ${e.case_name}</span>
      <p>${e.notes || ""}</p>
    </div>
  `).join("");
}

async function saveEvidence() {
  const payload = {
    title: document.getElementById("evidence-title").value,
    category: document.getElementById("evidence-category").value,
    date: document.getElementById("evidence-date").value,
    case_name: document.getElementById("evidence-case").value,
    notes: document.getElementById("evidence-notes").value
  };

  await fetch("/evidence", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });

  document.getElementById("evidence-title").value = "";
  document.getElementById("evidence-category").value = "";
  document.getElementById("evidence-date").value = "";
  document.getElementById("evidence-case").value = "";
  document.getElementById("evidence-notes").value = "";

  loadEvidence();
}

async function reviewPastedEmail() {
  const sender = document.getElementById("email-sender").value;
  const subject = document.getElementById("email-subject").value;
  const body = document.getElementById("email-body").value;
  const out = document.getElementById("email-review-answer");

  if (!body.trim()) {
    out.innerText = "Paste an email first.";
    return;
  }

  out.innerText = "Reviewing email...";

  const res = await fetch("/email/intake", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ sender, subject, body })
  });

  const data = await res.json();
  out.innerText = data.answer;
}

async function saveEmailAsEvidence() {
  const sender = document.getElementById("email-sender").value;
  const subject = document.getElementById("email-subject").value;
  const body = document.getElementById("email-body").value;
  const review = document.getElementById("email-review-answer").innerText;

  const payload = {
    title: "Email: " + (subject || "No Subject"),
    category: "Email",
    date: new Date().toISOString().slice(0, 10),
    case_name: "Email Intake",
    notes: `From: ${sender}\n\nSubject: ${subject}\n\nOriginal Email:\n${body}\n\nAI Review:\n${review}`
  };

  await fetch("/evidence", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });

  alert("Email saved to Evidence Vault.");
}

async function loadMemory() {
  const box = document.getElementById("memory-text");
  const status = document.getElementById("memory-status");
  if (!box) return;

  const res = await fetch("/memory");
  const data = await res.json();
  box.value = data.memory || "";
  status.innerText = "Memory loaded.";
}

async function saveMemory() {
  const memory = document.getElementById("memory-text").value;
  const status = document.getElementById("memory-status");

  await fetch("/memory", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ memory })
  });

  status.innerText = "Memory saved. Capital Leverage will now use this in AI answers.";
}

function showPage(pageId, btn) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
    page.style.display = "none";
  });

  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }

  document.querySelectorAll(".nav").forEach(n => n.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (pageId === "documents" && typeof loadDocuments === "function") loadDocuments();
  if (pageId === "memory" && typeof loadMemory === "function") loadMemory();
  if (pageId === "cases" && typeof loadCases === "function") loadCases();
  if (pageId === "evidence" && typeof loadEvidence === "function") loadEvidence();
}

async function askMyCase() {
  const q = document.getElementById("mycase-question").value;
  const out = document.getElementById("mycase-answer");

  if (!q.trim()) {
    out.innerText = "Ask something about your UMA case first.";
    return;
  }

  out.innerText = "My Case Agent is working...";

  const res = await fetch("/my-case/ask", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({question: q})
  });

  const data = await res.json();
  out.innerText = data.answer || "No response returned.";
}

async function askMyCase() {
  const q = document.getElementById("mycase-question").value;
  const out = document.getElementById("mycase-answer");
  const mode = document.getElementById("mycase-ai-mode")?.value || "legal";

  if (!q.trim()) {
    out.innerText = "Ask something about your UMA case first.";
    return;
  }

  out.innerText = "Selected My Case AI is working...";

  const res = await fetch("/my-case/ask", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({question: q, mode: mode})
  });

  const data = await res.json();
  out.innerText = data.answer || "No response returned.";
}

async function askMyCaseAllAgents() {
  const q = document.getElementById("mycase-question").value;
  const out = document.getElementById("mycase-answer");

  if (!q.trim()) {
    out.innerText = "Ask something about your UMA case first.";
    return;
  }

  out.innerText = "All Capital Leverage case agents are working together...";

  const res = await fetch("/my-case/all-agents", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({question: q})
  });

  const data = await res.json();
  out.innerText = data.answer || "No response returned.";
}

async function researchMyCase() {
  const q = document.getElementById("mycase-question").value;
  const out = document.getElementById("mycase-answer");

  if (!q.trim()) {
    out.innerText = "Ask a research question about your UMA case first.";
    return;
  }

  out.innerText = "Searching the web and case law sources...";

  const res = await fetch("/my-case/research", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({question: q})
  });

  const data = await res.json();
  out.innerText = data.answer || "No research answer returned.";
}

function openPlanBuilder() {
  let modal = document.getElementById("plan-builder-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "plan-builder-modal";
    modal.className = "plan-builder-modal";
    modal.innerHTML = `
      <div class="plan-builder-box">
        <button class="modal-close" onclick="closePlanBuilder()">×</button>
        <h2>Build My Leverage Plan</h2>
        <p>Choose what you want Capital Leverage to build.</p>

        <select id="plan-type">
          <option value="Housing">🏠 Housing Plan</option>
          <option value="Credit">💳 Credit Repair Plan</option>
          <option value="Legal">⚖️ Legal Strategy</option>
          <option value="Business">💼 Business Funding Plan</option>
          <option value="Documents">📄 Document/Evidence Plan</option>
          <option value="Full">🚀 Full Leverage Plan</option>
        </select>

        <textarea id="plan-details" placeholder="Tell Capital Leverage what is going on, what you need, and what outcome you want..."></textarea>

        <button onclick="submitPlanBuilder()">Generate Plan</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.style.display = "flex";
}

function closePlanBuilder() {
  const modal = document.getElementById("plan-builder-modal");
  if (modal) modal.style.display = "none";
}

function submitPlanBuilder() {
  const type = document.getElementById("plan-type").value;
  const details = document.getElementById("plan-details").value;
  const msg = document.getElementById("msg");

  closePlanBuilder();

  msg.value = `Use web research and build a ${type} Capital Leverage plan.

Details:
${details}

Return:
1. Best strategy
2. Laws/rules/programs to verify
3. Documents needed
4. Step-by-step actions
5. Deadlines to check
6. Draft language if useful.`;

  msg.scrollIntoView({behavior:"smooth", block:"center"});
  msg.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("button").forEach(btn => {
    const t = btn.innerText.trim();
    if (t === "Build My Leverage Plan" || t === "Generate Leverage Plan") {
      btn.onclick = openPlanBuilder;
    }
  });
});

async function runMyCaseTask(taskName) {
  const q = document.getElementById("mycase-question")?.value || "";
  const out = document.getElementById("mycase-answer");

  if (!out) return;

  const labels = {
    legal_review: "Running Legal Review...",
    case_law: "Searching web and finding case law...",
    discovery: "Building Discovery Requests...",
    cfpb: "Drafting CFPB Complaint...",
    damages: "Building Damages Summary...",
    settlement: "Creating Settlement Package...",
    timeline: "Building Case Timeline...",
    exhibits: "Creating Exhibit Plan..."
  };

  out.innerText = labels[taskName] || "Running My Case task...";

  const res = await fetch("/my-case/task", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({task: taskName, question: q})
  });

  const data = await res.json();
  out.innerText = data.answer || "No task response returned.";
}

async function draftEmailWithAI() {
  const to = document.getElementById("draft-email-to").value;
  const subject = document.getElementById("draft-email-subject").value;
  const context = document.getElementById("draft-email-context").value;
  const out = document.getElementById("draft-email-output");

  if (!context.trim()) {
    out.innerText = "Tell me what the email should say first.";
    return;
  }

  out.innerText = "Drafting email...";

  const res = await fetch("/ask", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      mode: "email",
      message: `Draft a professional email.

To: ${to}
Subject: ${subject}

Context:
${context}

Return only:
Subject line:
Email body:`
    })
  });

  const data = await res.json();
  out.innerText = data.answer || "No draft returned.";
}

async function runCommandCenter() {
  const type = document.getElementById("command-type")?.value || "general";
  const input = document.getElementById("command-input")?.value || "";
  const out = document.getElementById("command-answer");

  if (!out) return;

  if (!input.trim()) {
    out.innerText = "Tell Capital Leverage what you need help with first.";
    return;
  }

  out.innerText = "Capital Leverage is building your command plan...";

  const res = await fetch("/ask", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      mode: "research",
      message: `Build a Capital Leverage ${type} command plan.

Situation:
${input}

Return:
1. Here is the move
2. Which agents should handle it
3. Documents/screenshots to upload
4. Laws/rules/programs to research
5. Letters/complaints/tasks to create
6. Next 10 actions

Do not guarantee approval, deletion, funding, or legal outcome.`
    })
  });

  const data = await res.json();
  out.innerText = data.answer || "No command plan returned.";
}

/* BUSINESS LEVERAGE CENTER */

async function openBusinessIndustry(industry) {
  const out = document.getElementById("business-answer");
  const score = document.getElementById("business-credit-score")?.value || "";
  const goal = document.getElementById("business-funding-goal")?.value || "";
  const details = document.getElementById("business-details")?.value || "";

  if (!out) return;

  out.innerText = "Capital Leverage is building the " + industry + " funding strategy...";

  const prompt = `You are Capital Leverage Business Funding Agent.

Build a funding-readiness strategy for this business category:
${industry}

Credit score:
${score || "Unknown"}

Funding goal:
${goal || "Unknown"}

User details:
${details || "No extra details yet. Give a strong starter plan and tell the user what to add next."}

Capital Leverage positioning:
Even with a 500 credit score, we can build a 60-day funding readiness strategy. Do not guarantee approval. Build the roadmap.

Return in confident Capital Leverage style:
1. Here is the move
2. Best business model for ${industry}
3. Credit score path: 500 / 650 / 750
4. What to dispute or clean up
5. CFPB / bureau / certified-mail strategy
6. D&B setup checklist
7. Vendor / tradeline options to research
8. Banks and lenders to research
9. Business plan structure
10. Funding package checklist
11. 60-day calendar plan
12. Next 10 actions`;

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ mode: "research", message: prompt })
    });

    const data = await res.json();
    out.innerText = data.answer || "No business strategy returned.";
  } catch (err) {
    out.innerText = "Business Center error: " + err.message;
  }
}

async function buildBusinessPlan() {
  const name = document.getElementById("business-name")?.value || "";
  const type = document.getElementById("business-type")?.value || "";
  const score = document.getElementById("business-credit-score")?.value || "";
  const goal = document.getElementById("business-funding-goal")?.value || "";
  const details = document.getElementById("business-details")?.value || "";
  const out = document.getElementById("business-answer");

  if (!out) return;

  out.innerText = "Capital Leverage is building your business plan...";

  const prompt = `You are Capital Leverage Business Plan Agent.

Business name: ${name}
Business type: ${type}
Credit score: ${score}
Funding goal: ${goal}
Details: ${details}

Build a professional business plan and funding package.

Return:
1. Executive summary
2. Business concept
3. Services/products
4. Target market
5. Revenue model
6. Startup costs
7. 12-month money plan
8. Funding use breakdown
9. Credit/funding readiness
10. Documents needed
11. Lender-ready summary
12. Next actions`;

  const res = await fetch("/ask", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ mode: "research", message: prompt })
  });

  const data = await res.json();
  out.innerText = data.answer || "No business plan returned.";
}

async function buildBusinessFundingPlan() {
  const type = document.getElementById("business-type")?.value || "business";
  return openBusinessIndustry(type);
}

/* BUSINESS CHAT BUILDER */

function businessQuickPrompt(type) {
  const box = document.getElementById("business-chat-input");
  if (!box) return;

  if (type === "names") {
    box.value = "Generate strong business names for my company. Make them professional, fundable, clean, and good for branding. Give me names for construction, real estate, trucking, cleaning, and service businesses.";
  }

  if (type === "description") {
    box.value = "Write a professional business description I can use for my LLC, lender application, website, and business plan.";
  }

  if (type === "funding") {
    box.value = "Build a 60-day business funding readiness strategy. Include credit readiness, D&B setup, vendor accounts, business plan, lender documents, and what I need to upload for a better plan.";
  }

  box.focus();
}

async function askBusinessChat() {
  const input = document.getElementById("business-chat-input")?.value || "";
  const out = document.getElementById("business-answer");

  if (!out) return;

  if (!input.trim()) {
    out.innerText = "Ask the Business Agent what you want to build first.";
    return;
  }

  out.innerText = "Capital Leverage Business Agent is building your answer...";

  const prompt = `You are Capital Leverage Business Agent.

User request:
${input}

Capital Leverage business rules:
- Help generate business names, descriptions, plans, funding strategy, and lender-ready documents.
- If the request involves credit, funding, tradelines, collections, or loan readiness, explain that a credit report, screenshots, or uploaded documents will make the plan more accurate.
- Do not guarantee approval or funding.
- Speak confidently like Capital Leverage: "Here is the move" and "We are going to..."
- Do not say "Direct Answer."

Return:
1. Here is the move
2. Business strategy
3. Credit/funding readiness if relevant
4. What to upload for a more accurate plan
5. Documents to create
6. Next steps`;

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
    out.innerText = data.answer || "No business answer returned.";
  } catch (err) {
    out.innerText = "Business Center error: " + err.message;
  }
}

/* TRADING BOT LAB */

function getTradingAccess() {
  const raw = localStorage.getItem("capital_leverage_trading_access");
  if (!raw) return { tier: "none", trialStarted: null };

  try { return JSON.parse(raw); }
  catch { return { tier: "none", trialStarted: null }; }
}

function hasTradingAccess() {
  const access = getTradingAccess();

  if (access.tier === "paid" || access.tier === "demo") return true;

  if (access.tier === "trial" && access.trialStarted) {
    const started = new Date(access.trialStarted).getTime();
    const now = Date.now();
    const days = (now - started) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }

  return false;
}

function updateTradingAccessUI() {
  const content = document.getElementById("trading-lab-content");
  const status = document.getElementById("trading-access-status");

  if (!content) return;

  if (hasTradingAccess()) {
    content.style.display = "block";
    if (status) status.innerText = "Trading Lab access active.";
    drawTradeChart();
  } else {
    content.style.display = "none";
    if (status) status.innerText = "Trading Lab locked. Start your 7-day trial or unlock paid access later.";
  }
}

function startTradingTrial() {
  localStorage.setItem("capital_leverage_trading_access", JSON.stringify({
    tier: "trial",
    trialStarted: new Date().toISOString()
  }));
  updateTradingAccessUI();
}

function unlockTradingDemo() {
  localStorage.setItem("capital_leverage_trading_access", JSON.stringify({
    tier: "demo",
    trialStarted: new Date().toISOString()
  }));
  updateTradingAccessUI();
}

async function runTradingTask(task) {
  if (!hasTradingAccess()) {
    updateTradingAccessUI();
    alert("Trading Lab is locked. Start the 7-day trial first.");
    return;
  }

  const input = document.getElementById("trading-input")?.value || "";
  const out = document.getElementById("trading-answer");
  if (!out) return;

  const taskName = {
    strategy: "Build Trading Strategy",
    watchlist: "Create Watchlist",
    entry_exit: "Entry and Exit Rules",
    risk: "1% Stop Loss Risk Rules",
    paper: "Paper Trading Setup",
    openalice: "OpenAlice Setup",
    vps: "24/7 VPS Bot Plan",
    journal: "Trading Journal",
    custom: "Custom Trading Agent Request"
  }[task] || "Trading Strategy";

  out.innerText = "Capital Leverage Trading Agent is building: " + taskName + "...";

  const prompt = `You are Capital Leverage Trading Bot Lab.

Task:
${taskName}

User instructions:
${input || "No extra instructions yet. Build the best starter paper-trading plan from the Capital Leverage watchlist."}

Current connected setup:
- Alpaca Paper Trading is already connected inside Capital Leverage.
- Trading mode is PAPER only.
- Maximum stop loss is locked at 1% per trade.
- Do not tell the user to create an Alpaca account again.
- Do not tell the user to create OpenAlice account at openalice.com.
- OpenAlice should be treated as a self-hosted agent/workspace we will install on the VPS.
- Alpaca can execute supported stocks/crypto/options.
- GBPJPY is forex, so GBPJPY is OpenAlice research mode only unless a forex broker is connected later.

Capital Leverage watchlist:
1. SPY
2. QQQ
3. AAPL
4. TSLA
5. NVDA
6. AMD
7. MSFT
8. META
9. BTC/USD
10. GBPJPY Research

Mandatory risk rule:
- Stop loss must be 1% per trade.
- Do not suggest risking more than 1%.
- Add max daily loss rule: stop trading after 3 losing trades or 3% account drawdown.
- Paper trading only.
- No profit guarantees.

Response style:
- Do not say "Direct Answer."
- Speak like Capital Leverage.
- Say "Here is the move."
- Say "We are going to."

Return:
1. Here is the move
2. Best assets to watch from the 10 choices
3. Which assets Alpaca can paper trade
4. GBPJPY OpenAlice forex research plan
5. Entry rules
6. Exit rules
7. Exact 1% stop-loss rule
8. Max daily loss rule
9. What the bot should do every day
10. Next 10 actions`;

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ mode: "research", message: prompt })
    });

    const data = await res.json();
    out.innerText = data.answer || "No trading answer returned.";
  } catch (err) {
    out.innerText = "Trading Lab error: " + err.message;
  }
}

function drawTradeChart() {
  const canvas = document.getElementById("trade-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = 220;

  ctx.clearRect(0, 0, w, h);

  const data = [1000, 1008, 1003, 1015, 1022, 1018, 1030, 1026, 1042, 1055];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = 28;

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = pad + i * ((h - pad * 2) / 4);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 3;
  ctx.beginPath();

  data.forEach((v, i) => {
    const x = pad + i * ((w - pad * 2) / (data.length - 1));
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "14px Segoe UI";
  ctx.fillText("Demo paper equity curve", pad, 20);
}

document.addEventListener("DOMContentLoaded", updateTradingAccessUI);

async function checkTradingAccount() {
  const out = document.getElementById("trading-answer");
  if (!out) return;

  out.innerText = "Checking Alpaca Paper account...";

  try {
    const res = await fetch("/trading/account");
    const data = await res.json();

    if (!data.success) {
      out.innerText = "Trading account error: " + data.message;
      return;
    }

    out.innerText =
`Alpaca Paper Connected

Status: ${data.status}
Buying Power: $${data.buying_power}
Trading Mode: ${data.trading_mode}
Max Stop Loss: ${data.max_stop_loss_percent}%

Here is the move:
We are connected to paper trading. Next we build the watchlist, entry rules, exit rules, and 1% stop-loss bot logic before any live trading.`;
  } catch (err) {
    out.innerText = "Trading account check failed: " + err.message;
  }
}

async function getTradingBotStatus() {
  const out = document.getElementById("trading-answer");
  if (!out) return;

  out.innerText = "Checking trading bot status...";

  try {
    const res = await fetch("/trading/bot/status");
    const data = await res.json();

    out.innerText =
`Trading Bot Status

Running: ${data.running ? "YES" : "NO"}
Mode: ${data.mode}
Strategy: ${data.strategy}

If running = NO, press Start Paper Bot.`;
  } catch (err) {
    out.innerText = "Bot status error: " + err.message;
  }
}

async function startTradingBot() {
  const out = document.getElementById("trading-answer");
  if (!out) return;

  out.innerText = "Starting paper trading bot...";

  try {
    const res = await fetch("/trading/bot/start", {
      method: "POST",
      headers: {"Content-Type":"application/json"}
    });
    const data = await res.json();

    out.innerText =
`Paper Bot Started

Message: ${data.message}
Running: ${data.running ? "YES" : "NO"}
Strategy: ${data.strategy}

Next move:
Now press "Run Strategy" to simulate a paper-trading strategy run.`;
  } catch (err) {
    out.innerText = "Start bot error: " + err.message;
  }
}

async function stopTradingBot() {
  const out = document.getElementById("trading-answer");
  if (!out) return;

  out.innerText = "Stopping paper trading bot...";

  try {
    const res = await fetch("/trading/bot/stop", {
      method: "POST",
      headers: {"Content-Type":"application/json"}
    });
    const data = await res.json();

    out.innerText =
`Paper Bot Stopped

Message: ${data.message}
Running: ${data.running ? "YES" : "NO"}`;
  } catch (err) {
    out.innerText = "Stop bot error: " + err.message;
  }
}

async function runPaperStrategy() {
  const out = document.getElementById("trading-answer");
  const input = document.getElementById("trading-input");
  if (!out) return;

  let symbol = "SPY";
  let timeframe = "5Min";

  if (input && input.value.trim()) {
    symbol = input.value.trim();
  }

  out.innerText = "Running paper trading strategy...";

  try {
    const res = await fetch("/trading/bot/run-strategy", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        symbol,
        timeframe
      })
    });

    const data = await res.json();

    if (!data.success) {
      out.innerText = "Strategy error: " + data.message;
      return;
    }

    out.innerText =
`Capital Leverage Paper Strategy Run

Symbol: ${data.symbol}
Timeframe: ${data.timeframe}
Strategy: ${data.strategy}

Entry Rule:
${data.entry_rule}

Stop Loss Rule:
${data.stop_loss_rule}

Take Profit Rule:
${data.take_profit_rule}

Result:
${data.message}`;
  } catch (err) {
    out.innerText = "Run strategy error: " + err.message;
  }
}

function setTradingSymbol(symbol) {
  const input = document.getElementById("trading-input");
  if (!input) return;

  if (symbol === "GBPJPY") {
    input.value = "Research GBPJPY forex setup for OpenAlice only. Build entry/exit rules, 1% stop loss, risk plan, and explain that Alpaca Paper cannot execute forex.";
  } else {
    input.value = symbol;
  }

  input.focus();
}


// =========================
// OPENALICE TRADING LAB UI
// =========================

async function callTradingLab(endpoint, prompt) {
  const out = document.getElementById("trading-answer");
  if (out) out.textContent = "Capital Leverage is thinking...";

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await r.json();

    if (data.success) {
      if (out) out.textContent = data.answer || "Done.";
    } else {
      if (out) out.textContent = data.message || "Trading request failed.";
    }
  } catch (e) {
    if (out) out.textContent = "Trading request failed: " + e;
  }
}

function getTradingPrompt() {
  const box = document.getElementById("trading-prompt");
  return box ? box.value.trim() : "";
}

async function buildTradingStrategy() {
  const prompt = getTradingPrompt() || "Build me a paper trading strategy for the strongest U.S. stocks and include GBPJPY research mode. Risk max 1% per trade.";
  await callTradingLab("/trading/openalice/strategy", prompt);
}

async function createTradingWatchlist() {
  const prompt = getTradingPrompt() || "Build me a watchlist for the best stocks to paper trade right now and include GBPJPY research mode.";
  await callTradingLab("/trading/openalice/watchlist", prompt);
}

async function openAliceSetupPlan() {
  const prompt = getTradingPrompt() || "Explain how OpenAlice is connected inside Capital Leverage Trading Lab and how I use it with Alpaca paper plus GBPJPY research mode.";
  await callTradingLab("/trading/openalice/setup", prompt);
}

async function buildTradingJournal() {
  const prompt = getTradingPrompt() || "Build me a trading journal for paper trades with 1% stop loss tracking.";
  await callTradingLab("/trading/openalice/journal", prompt);
}

async function askTradingAgent() {
  const prompt = getTradingPrompt() || "Here is the move. Find the strongest stocks for today, include GBPJPY research mode, keep risk at 1%, and give me exact levels to watch.";
  await callTradingLab("/trading/openalice/strategy", prompt);
}
