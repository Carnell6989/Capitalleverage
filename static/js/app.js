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

// =========================
// TRADING DESK 2.0 MARKET BOARD
// =========================

async function loadMarketScan() {
  const board = document.getElementById("market-board");
  const answer = document.getElementById("trading-answer");

  if (!board) return;

  board.innerHTML = "<div class='market-row'>Scanning Capital Leverage watchlist...</div>";

  try {
    const res = await fetch("/trading/market-scan");
    const data = await res.json();

    if (!data.success) {
      board.innerHTML = `<div class="market-row">Market scan failed: ${data.message}</div>`;
      return;
    }

    board.innerHTML = data.watchlist.map(item => {
      const change = item.change_pct === null || item.change_pct === undefined ? "—" : item.change_pct + "%";
      const price = item.price === null || item.price === undefined ? "—" : item.price;
      const high = item.high === null || item.high === undefined ? "—" : item.high;
      const low = item.low === null || item.low === undefined ? "—" : item.low;

      return `
        <div class="market-row" onclick="selectMarketSymbol('${item.symbol}')">
          <strong>${item.symbol}</strong>
          <span>Price: ${price}</span>
          <span>H: ${high}</span>
          <span>L: ${low}</span>
          <span>Chg: ${change}</span>
          <span>${item.signal}</span>
        </div>
      `;
    }).join("");

    if (answer) {
      const top = (data.top_3 || []).map(x => `${x.symbol} (${x.change_pct}%)`).join(", ");
      answer.textContent =
`Here is the move.

Capital Leverage scanned the board.

Top 3 right now:
${top || "No top names found yet."}

Risk rule:
1% max stop loss per trade.

Mode:
Paper trading only.

Next:
Click a symbol on the Market Board or run strategy on the strongest setup.`;
    }

  } catch (e) {
    board.innerHTML = `<div class="market-row">Market scan error: ${e}</div>`;
  }
}

function selectMarketSymbol(symbol) {
  const input = document.getElementById("trading-input");
  const answer = document.getElementById("trading-answer");

  if (input) input.value = symbol;

  if (answer) {
    answer.textContent =
`Selected: ${symbol}

Here is the move.

Capital Leverage is ready to build a trade card for ${symbol}.

Next:
Press Run Strategy or Ask Trading Agent.

Rules:
Paper mode only.
Maximum stop loss: 1%.`;
  }
}

// =========================
// SMART TRADING COMMANDS
// =========================

async function smartTradingCommand(command) {
  const out = document.getElementById("trading-answer");
  const input = document.getElementById("trading-input");
  const symbol = input && input.value.trim() ? input.value.trim() : "SPY";

  if (out) out.textContent = "Capital Leverage is reading the market, checking the board, and building the move...";

  try {
    const res = await fetch("/trading/smart-command", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ command, symbol })
    });

    const data = await res.json();
    if (out) out.textContent = data.answer || data.message || JSON.stringify(data, null, 2);
  } catch (e) {
    if (out) out.textContent = "Smart command error: " + e;
  }
}

// =========================
// FIX TRADING LAB BUTTONS — CLEAN OVERRIDE
// =========================

async function runTradingTask(command) {
  const out = document.getElementById("trading-answer");
  const input = document.getElementById("trading-input");
  const symbol = input && input.value.trim() ? input.value.trim() : "SPY";

  if (out) out.textContent = "Capital Leverage is scanning the market and building the move...";

  try {
    const res = await fetch("/trading/smart-command", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ command, symbol })
    });

    const data = await res.json();
    if (out) out.textContent = data.answer || data.message || JSON.stringify(data, null, 2);
  } catch (e) {
    if (out) out.textContent = "Trading request failed: " + e;
  }
}

function buildTradingStrategy() { return runTradingTask("strategy"); }
function createTradingWatchlist() { return runTradingTask("watchlist"); }
function openAliceSetupPlan() { return runTradingTask("openalice"); }
function buildTradingJournal() { return runTradingTask("journal"); }
function askTradingAgent() { return runTradingTask("custom"); }

// Auto-run Trading Desk scan when Trading Lab opens
const oldShowPageTrading = typeof showPage === "function" ? showPage : null;

if (oldShowPageTrading) {
  window.showPage = function(page, btn) {
    oldShowPageTrading(page, btn);

    if (page === "trading") {
      setTimeout(() => {
        if (typeof loadMarketScan === "function") {
          loadMarketScan();
        }
      }, 500);
    }
  };
}

// =========================
// MY CASE FILE VAULT
// =========================

async function uploadMyCaseFiles() {
  const input = document.getElementById("mycase-files");
  const out = document.getElementById("mycase-upload-result");

  if (!input || !input.files || !input.files.length) {
    if (out) out.textContent = "Pick one or more files first.";
    return;
  }

  if (out) out.textContent = "Uploading My Case files...";

  const results = [];

  for (const file of input.files) {
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/mycase/upload", {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      results.push(`Uploaded: ${data.filename || file.name}`);
    } catch (e) {
      results.push(`Failed: ${file.name} -> ${e}`);
    }
  }

  if (out) out.textContent = results.join("\n");
  loadMyCaseFiles();
}

async function loadMyCaseFiles() {
  const list = document.getElementById("mycase-file-list");
  if (!list) return;

  list.innerHTML = "Loading case files...";

  try {
    const res = await fetch("/mycase/files");
    const files = await res.json();

    if (!files.length) {
      list.innerHTML = "<div class='doc-card'>No My Case files uploaded yet.</div>";
      return;
    }

    list.innerHTML = files.map(f => `
      <div class="doc-card">
        <strong>${f.filename}</strong><br>
        <span>${f.created_at || ""}</span><br>
        <span>${f.text_length || 0} chars extracted</span>
      </div>
    `).join("");
  } catch (e) {
    list.innerHTML = "Failed to load case files.";
  }
}

// Override Ask My Case so it uses uploaded case files automatically
async function askMyCase() {
  const q = document.getElementById("mycase-question")?.value?.trim() || "";
  const out = document.getElementById("mycase-answer");
  const mode = document.getElementById("mycase-ai-mode")?.value || "document";

  if (out) out.textContent = "Capital Leverage is reviewing your case files...";

  try {
    // if using document/legal style, hit My Case analyzer first
    if (["document", "legal", "credit", "business"].includes(mode)) {
      const res = await fetch("/mycase/analyze", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ question: q, mode })
      });
      const data = await res.json();
      if (out) out.textContent = data.answer || JSON.stringify(data, null, 2);
      return;
    }

    // fallback to generic ask route for research/fast/etc
    const res = await fetch("/ask", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message: q, mode })
    });
    const data = await res.json();
    if (out) out.textContent = data.answer || JSON.stringify(data, null, 2);

  } catch (e) {
    if (out) out.textContent = "My Case request failed: " + e;
  }
}

async function autoPaperTrade() {
  const out = document.getElementById("trading-answer");
  if (out) out.textContent = "Capital Leverage bot is scanning and placing a PAPER trade only...";

  try {
    const res = await fetch("/trading/bot/auto-paper-trade", {
      method: "POST",
      headers: {"Content-Type": "application/json"}
    });

    const data = await res.json();

    if (!data.success) {
      if (out) out.textContent = data.message || "No trade placed.";
      return;
    }

    if (out) out.textContent =
`PAPER TRADE PLACED

Symbol: ${data.symbol}
Qty: ${data.qty}
Estimated Entry: ${data.estimated_entry}
Stop Loss: ${data.stop_loss}
Take Profit: ${data.take_profit}
Risk Rule: ${data.risk_rule}

Order ID:
${data.order_id}`;
  } catch (e) {
    if (out) out.textContent = "Auto paper trade error: " + e;
  }
}

// =========================
// LIVE TRADING DASHBOARD
// =========================

let marketAutoRefreshTimer = null;
let lastMarketScan = null;

function tradingViewSymbol(symbol) {
  const map = {
    "SPY": "AMEX:SPY",
    "QQQ": "NASDAQ:QQQ",
    "AAPL": "NASDAQ:AAPL",
    "TSLA": "NASDAQ:TSLA",
    "NVDA": "NASDAQ:NVDA",
    "AMD": "NASDAQ:AMD",
    "MSFT": "NASDAQ:MSFT",
    "META": "NASDAQ:META",
    "BTC/USD": "BINANCE:BTCUSDT",
    "GBPJPY": "FX:GBPJPY"
  };
  return map[symbol] || "NASDAQ:AAPL";
}

function updateLiveDashboard(item) {
  if (!item) return;

  const title = document.getElementById("live-symbol-title");
  const status = document.getElementById("live-symbol-status");
  const price = document.getElementById("live-price");
  const high = document.getElementById("live-high");
  const low = document.getElementById("live-low");
  const change = document.getElementById("live-change");
  const frame = document.getElementById("tradingview-frame");

  if (title) title.textContent = item.symbol;
  if (status) status.textContent = item.signal || "Waiting...";
  if (price) price.textContent = "Price: " + (item.price ?? "—");
  if (high) high.textContent = "High: " + (item.high ?? "—");
  if (low) low.textContent = "Low: " + (item.low ?? "—");
  if (change) change.textContent = "Change: " + (item.change_pct ?? "—") + (item.change_pct == null ? "" : "%");

  if (frame) {
    const tv = encodeURIComponent(tradingViewSymbol(item.symbol));
    frame.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview-frame&symbol=${tv}&interval=5&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=0f172a&studies=%5B%5D&theme=dark&style=1&timezone=America%2FNew_York`;
  }
}

function selectMarketSymbol(symbol) {
  const input = document.getElementById("trading-input");
  const answer = document.getElementById("trading-answer");

  if (input) input.value = symbol;

  if (lastMarketScan && lastMarketScan.watchlist) {
    const item = lastMarketScan.watchlist.find(x => x.symbol === symbol);
    if (item) updateLiveDashboard(item);
  } else {
    updateLiveDashboard({symbol, signal: "Selected", price: null, high: null, low: null, change_pct: null});
  }

  if (answer) {
    answer.textContent =
`Selected: ${symbol}

Capital Leverage is focused on ${symbol}.

Next:
Press Run Strategy or Auto Paper Trade.

Rules:
Paper mode only.
Maximum stop loss: 1%.`;
  }
}

// override market scan so it updates live dashboard too
const oldLoadMarketScanLive = typeof loadMarketScan === "function" ? loadMarketScan : null;

async function loadMarketScan() {
  const board = document.getElementById("market-board");
  const answer = document.getElementById("trading-answer");

  if (!board) return;

  board.innerHTML = "<div class='market-row'>Scanning Capital Leverage watchlist...</div>";

  try {
    const res = await fetch("/trading/market-scan");
    const data = await res.json();
    lastMarketScan = data;

    if (!data.success) {
      board.innerHTML = `<div class="market-row">Market scan failed: ${data.message}</div>`;
      return;
    }

    board.innerHTML = data.watchlist.map(item => {
      const change = item.change_pct === null || item.change_pct === undefined ? "—" : item.change_pct + "%";
      const price = item.price === null || item.price === undefined ? "—" : item.price;
      const high = item.high === null || item.high === undefined ? "—" : item.high;
      const low = item.low === null || item.low === undefined ? "—" : item.low;

      return `
        <div class="market-row" onclick="selectMarketSymbol('${item.symbol}')">
          <strong>${item.symbol}</strong>
          <span>Price: ${price}</span>
          <span>H: ${high}</span>
          <span>L: ${low}</span>
          <span>Chg: ${change}</span>
          <span>${item.signal}</span>
        </div>
      `;
    }).join("");

    if (data.top_3 && data.top_3.length) {
      updateLiveDashboard(data.top_3[0]);
    }

    if (answer) {
      const top = (data.top_3 || []).map(x => `${x.symbol} (${x.change_pct}%)`).join(", ");
      answer.textContent =
`Here is the move.

Capital Leverage scanned the board.

Top 3 right now:
${top || "No top names found yet."}

Risk rule:
1% max stop loss per trade.

Mode:
Paper trading only.

Dashboard:
Live chart updated with strongest setup.`;
    }

  } catch (e) {
    board.innerHTML = `<div class="market-row">Market scan error: ${e}</div>`;
  }
}

function startMarketAutoRefresh() {
  if (marketAutoRefreshTimer) clearInterval(marketAutoRefreshTimer);
  loadMarketScan();
  marketAutoRefreshTimer = setInterval(loadMarketScan, 15000);
}

// =========================
// SIDEBAR COLLAPSE CONTROL
// =========================

function toggleSidebar() {
  const app = document.querySelector(".app");
  if (!app) return;

  app.classList.toggle("sidebar-collapsed");

  try {
    localStorage.setItem(
      "capitalLeverageSidebarCollapsed",
      app.classList.contains("sidebar-collapsed") ? "yes" : "no"
    );
  } catch (e) {}
}

window.addEventListener("DOMContentLoaded", () => {
  const app = document.querySelector(".app");
  if (!app) return;

  try {
    if (localStorage.getItem("capitalLeverageSidebarCollapsed") === "yes") {
      app.classList.add("sidebar-collapsed");
    }
  } catch (e) {}
});

// =========================
// MUSIC MANAGER OS
// =========================

async function musicManagerTask(task) {
  const input = document.getElementById("music-manager-input");
  if (input) {
    input.value = `Build the ${task} section for Music Manager OS. Make it useful for independent artists and managers.`;
  }
  askMusicManager(task);
}

async function askMusicManager(task = "build") {
  const input = document.getElementById("music-manager-input");
  const out = document.getElementById("music-manager-answer");
  const details = input ? input.value.trim() : "";

  if (out) out.textContent = "Capital Leverage is building the Music Manager OS plan...";

  try {
    const res = await fetch("/business/music-manager", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ task, details })
    });

    const data = await res.json();
    if (out) out.textContent = data.answer || JSON.stringify(data, null, 2);
  } catch (e) {
    if (out) out.textContent = "Music Manager request failed: " + e;
  }
}

// =========================
// MUSIC MANAGER DASHBOARD
// =========================

let selectedMusicGenre = "";

function setMusicGenre(genre) {
  selectedMusicGenre = genre;

  const task = document.getElementById("music-task-preview");
  const input = document.getElementById("music-campaign-input");

  if (task) {
    task.textContent = `Selected genre: ${genre}. Ready to build manager tasks, campaign posts, captions, and growth plan.`;
  }

  if (input) {
    input.value = `Build a Music Manager OS growth plan for a ${genre} artist. Include daily tasks, YouTube Shorts, TikTok posts, campaign ideas, captions, hashtags, posting schedule, and performance tracking.`;
  }
}

async function askMusicManagerDashboard(task = "dashboard") {
  const out = document.getElementById("music-dashboard-answer");
  const input = document.getElementById("music-campaign-input");
  const details = input ? input.value.trim() : "";

  if (out) out.textContent = "Music Manager OS is building the artist growth dashboard plan...";

  try {
    const res = await fetch("/business/music-manager", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        task,
        details: `Genre: ${selectedMusicGenre || "Not selected"}\n\n${details}`
      })
    });

    const data = await res.json();
    if (out) out.textContent = data.answer || JSON.stringify(data, null, 2);
  } catch (e) {
    if (out) out.textContent = "Music Manager dashboard error: " + e;
  }
}

// =========================
// MUSIC MANAGER FULL SYSTEM
// =========================

async function saveMusicArtist() {
  const body = {
    name: document.getElementById("music-artist-name")?.value || "",
    genre: document.getElementById("music-artist-genre")?.value || "",
    goal: document.getElementById("music-artist-goal")?.value || ""
  };

  await fetch("/music/artists", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  loadMusicManagerData();
}

async function saveMusicCampaign() {
  const body = {
    artist: document.getElementById("music-campaign-artist")?.value || "",
    title: document.getElementById("music-campaign-title")?.value || "",
    platform: document.getElementById("music-campaign-platform")?.value || "",
    goal: document.getElementById("music-campaign-goal")?.value || ""
  };

  await fetch("/music/campaigns", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  loadMusicManagerData();
}

async function saveMusicLink() {
  const body = {
    artist: document.getElementById("music-link-artist")?.value || "",
    campaign: document.getElementById("music-link-campaign")?.value || "",
    url: document.getElementById("music-link-url")?.value || ""
  };

  await fetch("/music/links", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  loadMusicManagerData();
}

async function loadMusicManagerData() {
  try {
    const artists = await (await fetch("/music/artists")).json();
    const campaigns = await (await fetch("/music/campaigns")).json();
    const links = await (await fetch("/music/links")).json();

    document.getElementById("music-artists-list").innerHTML =
      artists.length ? artists.map(a => `<div class="doc-card"><strong>${a.name}</strong><br>${a.genre}<br>${a.goal}</div>`).join("") : "No artists yet.";

    document.getElementById("music-campaigns-list").innerHTML =
      campaigns.length ? campaigns.map(c => `<div class="doc-card"><strong>${c.title}</strong><br>${c.artist}<br>${c.platform}<br>${c.status}</div>`).join("") : "No campaigns yet.";

    document.getElementById("music-links-list").innerHTML =
      links.length ? links.map(l => `<div class="doc-card"><strong>${l.campaign}</strong><br>${l.artist}<br>${l.url}<br>Clicks: ${l.clicks}</div>`).join("") : "No links yet.";
  } catch (e) {
    console.log("Music data load failed", e);
  }
}

async function musicManagerAgent(task) {
  const out = document.getElementById("music-manager-control-answer") || document.getElementById("music-dashboard-answer");
  const genre = window.selectedMusicGenre || document.getElementById("music-artist-genre")?.value || "";
  const artist = document.getElementById("music-artist-name")?.value || document.getElementById("music-campaign-artist")?.value || "";
  const details = document.getElementById("music-campaign-input")?.value || document.getElementById("music-artist-goal")?.value || "";

  if (out) out.textContent = "Music Manager OS is working...";

  try {
    const res = await fetch("/music/manager-agent", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ task, artist, genre, details })
    });

    const data = await res.json();
    if (out) out.textContent = data.answer || JSON.stringify(data, null, 2);
  } catch (e) {
    if (out) out.textContent = "Music Manager agent failed: " + e;
  }
}

// =========================
// MUSIC MANAGER AUTO CAMPAIGN AGENT
// =========================

async function runMusicAutoCampaign() {
  const out = document.getElementById("music-manager-control-answer") || document.getElementById("music-dashboard-answer");
  const artist = document.getElementById("music-artist-name")?.value || "";
  const genre = selectedMusicGenre || document.getElementById("music-artist-genre")?.value || "";
  const song = document.getElementById("music-campaign-title")?.value || "";
  const goal = document.getElementById("music-campaign-goal")?.value || document.getElementById("music-campaign-input")?.value || "";

  if (out) out.textContent = "Music Manager Agent is building the full campaign...";

  try {
    const res = await fetch("/music/auto-campaign", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        artist,
        genre,
        song,
        goal,
        platforms: "YouTube Shorts, TikTok, Instagram Reels"
      })
    });

    const data = await res.json();
    if (out) out.textContent = data.answer || data.message || JSON.stringify(data, null, 2);
  } catch (e) {
    if (out) out.textContent = "Auto campaign failed: " + e;
  }
}

// =========================
// MUSIC MANAGER AUTO CAMPAIGN AGENT
// =========================

async function runMusicAutoCampaign() {
  const out = document.getElementById("music-manager-control-answer") || document.getElementById("music-dashboard-answer");
  const artist = document.getElementById("music-artist-name")?.value || "";
  const genre = selectedMusicGenre || document.getElementById("music-artist-genre")?.value || "";
  const song = document.getElementById("music-campaign-title")?.value || "";
  const goal = document.getElementById("music-campaign-goal")?.value || document.getElementById("music-campaign-input")?.value || "";

  if (out) out.textContent = "Music Manager Agent is building the full campaign...";

  try {
    const res = await fetch("/music/auto-campaign", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        artist,
        genre,
        song,
        goal,
        platforms: "YouTube Shorts, TikTok, Instagram Reels"
      })
    });

    const data = await res.json();
    if (out) out.textContent = data.answer || data.message || JSON.stringify(data, null, 2);
  } catch (e) {
    if (out) out.textContent = "Auto campaign failed: " + e;
  }
}

// =========================
// CLEAN MUSIC MANAGER OS HELPERS
// =========================

async function checkYouTubeGlobal() {
  const box = document.getElementById("music-youtube-channel");
  if (box) box.innerHTML = "Checking YouTube connection...";

  try {
    const res = await fetch("/youtube/status");
    const data = await res.json();

    if (!data.connected) {
      if (box) box.innerHTML = "YouTube is not connected yet.";
      return;
    }

    if (box) box.innerHTML = "YouTube is connected. Press Sync My YouTube.";
  } catch (e) {
    if (box) box.innerHTML = "YouTube check failed: " + e;
  }
}

async function syncYouTubeGlobal() {
  const channelBox = document.getElementById("music-youtube-channel");
  const videosBox = document.getElementById("music-youtube-videos");

  if (channelBox) channelBox.innerHTML = "Syncing YouTube channel...";
  if (videosBox) videosBox.innerHTML = "Loading videos...";

  try {
    const chRes = await fetch("/youtube/channel");
    const ch = await chRes.json();

    if (!ch.success) {
      if (channelBox) channelBox.innerHTML = ch.message || "No YouTube channel found.";
      if (videosBox) videosBox.innerHTML = "No videos loaded.";
      return;
    }

    const stats = ch.channel.statistics || {};
    document.getElementById("music-total-views").textContent = stats.viewCount || "0";
    document.getElementById("music-total-videos").textContent = stats.videoCount || "0";
    document.getElementById("music-total-followers").textContent = stats.subscriberCount || "0";

    if (channelBox) {
      channelBox.innerHTML = `
        <div class="doc-card">
          <strong>${ch.channel.title}</strong><br>
          Views: ${stats.viewCount || "0"}<br>
          Subscribers: ${stats.subscriberCount || "0"}<br>
          Videos: ${stats.videoCount || "0"}
        </div>
      `;
    }

    const vRes = await fetch("/youtube/videos");
    const vd = await vRes.json();

    if (!vd.success || !vd.videos || !vd.videos.length) {
      if (videosBox) videosBox.innerHTML = "No videos found yet.";
      return;
    }

    if (videosBox) {
      videosBox.innerHTML = vd.videos.map(v => {
        const st = v.statistics || {};
        return `
          <div class="doc-card music-video-card">
            ${v.thumbnail ? `<img src="${v.thumbnail}" alt="">` : ""}
            <strong>${v.title}</strong><br>
            Views: ${st.viewCount || "0"} |
            Likes: ${st.likeCount || "0"} |
            Comments: ${st.commentCount || "0"}
          </div>
        `;
      }).join("");
    }

    const focus = document.getElementById("music-today-focus");
    const move = document.getElementById("music-best-move");
    const attention = document.getElementById("music-needs-attention");

    if (focus) focus.textContent = "Use your latest YouTube videos to build today’s content plan.";
    if (move) move.textContent = "Generate titles, captions, and a 7-day campaign from your top videos.";
    if (attention) attention.textContent = "Check which video has the most views and double down on that style.";

  } catch (e) {
    if (channelBox) channelBox.innerHTML = "YouTube sync failed: " + e;
  }
}

// =========================
// YOUTUBE CONNECT BUTTON
// =========================

async function connectYouTubeGlobal() {
  const box = document.getElementById("music-youtube-channel");
  if (box) box.innerHTML = "Checking YouTube connection...";

  try {
    const res = await fetch("/youtube/status");
    const data = await res.json();

    if (data.connected) {
      if (box) box.innerHTML = "✅ YouTube is already connected. Press 📺 Sync My YouTube.";
      return;
    }

    window.location.href = "/youtube/connect";
  } catch (e) {
    if (box) box.innerHTML = "YouTube connect check failed: " + e;
  }
}

// override sync so it gives better instructions
async function syncYouTubeGlobal() {
  const channelBox = document.getElementById("music-youtube-channel");
  const videosBox = document.getElementById("music-youtube-videos");

  if (channelBox) channelBox.innerHTML = "Syncing YouTube channel...";
  if (videosBox) videosBox.innerHTML = "Loading videos...";

  try {
    const statusRes = await fetch("/youtube/status");
    const status = await statusRes.json();

    if (!status.connected) {
      if (channelBox) channelBox.innerHTML = "❌ YouTube is not connected. Press ▶️ Connect YouTube first.";
      if (videosBox) videosBox.innerHTML = "No videos loaded.";
      return;
    }

    const chRes = await fetch("/youtube/channel");
    const ch = await chRes.json();

    if (!ch.success) {
      if (channelBox) channelBox.innerHTML =
        "⚠️ Connected to Google, but no YouTube channel was found. Make sure the Gmail you connected actually owns/has a YouTube channel.";
      if (videosBox) videosBox.innerHTML = "No videos loaded.";
      return;
    }

    const stats = ch.channel.statistics || {};
    document.getElementById("music-total-views").textContent = stats.viewCount || "0";
    document.getElementById("music-total-videos").textContent = stats.videoCount || "0";
    document.getElementById("music-total-followers").textContent = stats.subscriberCount || "0";

    if (channelBox) {
      channelBox.innerHTML = `
        <div class="doc-card">
          ✅ <strong>${ch.channel.title}</strong><br>
          Views: ${stats.viewCount || "0"}<br>
          Subscribers: ${stats.subscriberCount || "0"}<br>
          Videos: ${stats.videoCount || "0"}
        </div>
      `;
    }

    const vRes = await fetch("/youtube/videos");
    const vd = await vRes.json();

    if (!vd.success || !vd.videos || !vd.videos.length) {
      if (videosBox) videosBox.innerHTML = "No YouTube videos found yet.";
      return;
    }

    videosBox.innerHTML = vd.videos.map(v => {
      const st = v.statistics || {};
      return `
        <div class="doc-card music-video-card">
          ${v.thumbnail ? `<img src="${v.thumbnail}" alt="">` : ""}
          <strong>${v.title}</strong><br>
          Views: ${st.viewCount || "0"} |
          Likes: ${st.likeCount || "0"} |
          Comments: ${st.commentCount || "0"}
        </div>
      `;
    }).join("");

  } catch (e) {
    if (channelBox) channelBox.innerHTML = "YouTube sync failed: " + e;
  }
}

// =========================
// GROWTH CAMPAIGN ENGINE
// =========================

async function runGrowthCampaignEngine() {
  const out = document.getElementById("growth-campaign-answer") || document.getElementById("music-manager-control-answer");

  const body = {
    artist: document.getElementById("growth-artist")?.value || document.getElementById("music-artist-name")?.value || "",
    genre: document.getElementById("growth-genre")?.value || document.getElementById("music-artist-genre")?.value || "",
    song: document.getElementById("growth-song")?.value || document.getElementById("music-campaign-title")?.value || "",
    goal: document.getElementById("growth-goal")?.value || document.getElementById("music-campaign-goal")?.value || "",
    content_notes: document.getElementById("growth-content-notes")?.value || document.getElementById("music-campaign-input")?.value || "",
    platforms: "YouTube Shorts, TikTok, Instagram Reels"
  };

  if (out) out.textContent = "Growth Campaign Engine is building the full campaign...";

  try {
    const res = await fetch("/music/growth-campaign", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (out) {
      out.textContent = data.answer || data.message || JSON.stringify(data, null, 2);
    }
  } catch (e) {
    if (out) out.textContent = "Growth Campaign Engine failed: " + e;
  }
}

async function loadGrowthCampaigns() {
  const out = document.getElementById("growth-campaign-answer") || document.getElementById("music-manager-control-answer");
  if (out) out.textContent = "Loading saved growth campaigns...";

  try {
    const res = await fetch("/music/growth-campaigns");
    const data = await res.json();

    if (!data.length) {
      if (out) out.textContent = "No growth campaigns saved yet.";
      return;
    }

    if (out) {
      out.textContent = data.map(c =>
        `CAMPAIGN: ${c.song || c.artist || "Untitled"}\nSTATUS: ${c.status}\nDATE: ${c.created_at}\n\n${c.output}\n\n---\n`
      ).join("\n");
    }
  } catch (e) {
    if (out) out.textContent = "Could not load campaigns: " + e;
  }
}

// =========================
// MUSIC CAMPAIGN ACTION QUEUE
// =========================



// =========================
// HARD FIXED CAMPAIGN ACTION QUEUE
// =========================

function escapeHtmlCL(str) {
  return String(str || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

async function buildCampaignActionQueue() {
  const box = document.getElementById("music-action-queue-list");
  const campaignBox = document.getElementById("growth-campaign-answer");

  const campaignText = campaignBox ? campaignBox.textContent.trim() : "";
  const artist =
    document.getElementById("growth-artist")?.value ||
    document.getElementById("music-artist-name")?.value ||
    "";
  const song =
    document.getElementById("growth-song")?.value ||
    document.getElementById("music-campaign-title")?.value ||
    "";

  if (box) box.innerHTML = "Building campaign action cards...";

  if (!campaignText) {
    if (box) box.innerHTML = "Run Growth Campaign first, then press Build Action Queue.";
    return;
  }

  try {
    const res = await fetch("/music/action-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist: artist,
        song: song,
        campaign_text: campaignText
      })
    });

    const data = await res.json();

    if (!data.success) {
      if (box) box.innerHTML = "Action queue failed: " + JSON.stringify(data, null, 2);
      return;
    }

    await loadCampaignActionQueue();
  } catch (e) {
    if (box) box.innerHTML = "Action queue error: " + e;
  }
}

async function loadCampaignActionQueue() {
  const box = document.getElementById("music-action-queue-list");
  if (!box) return;

  box.innerHTML = "Loading campaign action cards...";

  try {
    const res = await fetch("/music/action-queue");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      box.innerHTML = "No campaign action cards yet.";
      return;
    }

    const rows = data.slice().reverse().map((a) => {
      const id = encodeURIComponent(a.id || "");
      const day = escapeHtmlCL(a.day || "");
      const platform = escapeHtmlCL(a.platform || "Platform");
      const task = escapeHtmlCL(a.task || "Campaign task");
      const status = escapeHtmlCL(a.status || "Draft");

      return `
        <div class="doc-card campaign-action-card">
          <strong>${day} — ${platform}</strong><br>
          ${task}<br>
          <span>Status: <b>${status}</b></span>
          <div class="command-buttons">
            <button class="aq-btn" data-id="${id}" data-status="Approved">✅ Approve</button>
            <button class="aq-btn" data-id="${id}" data-status="Done">🔥 Mark Done</button>
            <button class="aq-btn" data-id="${id}" data-status="Needs Edit">✍️ Needs Edit</button>
          </div>
        </div>
      `;
    }).join("");

    box.innerHTML = rows;

    document.querySelectorAll(".aq-btn").forEach((btn) => {
      btn.onclick = async () => {
        const id = decodeURIComponent(btn.dataset.id || "");
        const status = btn.dataset.status || "Draft";
        await updateCampaignAction(id, status);
      };
    });
  } catch (e) {
    box.innerHTML = "Load queue error: " + e;
  }
}

async function updateCampaignAction(id, status) {
  try {
    await fetch("/music/action-queue/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    await loadCampaignActionQueue();
  } catch (e) {
    const box = document.getElementById("music-action-queue-list");
    if (box) box.innerHTML = "Update queue error: " + e;
  }
}


// =========================
// CAMPAIGN CONTROL ROOM
// =========================

async function createCampaignProject() {
  const campaignText = document.getElementById("growth-campaign-answer")?.textContent || "";
  const artist = document.getElementById("growth-artist")?.value || document.getElementById("music-artist-name")?.value || "";
  const song = document.getElementById("growth-song")?.value || document.getElementById("music-campaign-title")?.value || "";
  const goal = document.getElementById("growth-goal")?.value || document.getElementById("music-campaign-goal")?.value || "";

  const res = await fetch("/music/campaign-project", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ artist, song, goal, campaign_text: campaignText })
  });

  const data = await res.json();
  if (data.success) {
    showCampaignProject(data.project);
    await loadCampaignProjects();
  }
}

async function loadCampaignProjects() {
  const box = document.getElementById("campaign-project-list");
  if (box) box.innerHTML = "Loading campaign projects...";

  const res = await fetch("/music/campaign-project");
  const data = await res.json();

  if (!data.length) {
    if (box) box.innerHTML = "No campaign projects yet.";
    return;
  }

  const latest = data[data.length - 1];
  showCampaignProject(latest);

  if (box) {
    box.innerHTML = data.slice().reverse().map(p => `
      <div class="doc-card">
        <strong>${p.song || "Untitled Campaign"}</strong><br>
        Artist: ${p.artist || "Unknown"}<br>
        Status: ${p.status || "Draft"}<br>
        Progress: ${p.progress || 0}%
        <div class="command-buttons">
          <button onclick='showCampaignProject(${JSON.stringify(p).replace(/'/g, "&apos;")})'>👁️ View</button>
        </div>
      </div>
    `).join("");
  }
}

function showCampaignProject(p) {
  document.getElementById("campaign-screen-title").textContent = p.song || "Campaign Project";
  document.getElementById("campaign-screen-subtitle").textContent =
    `${p.artist || "Artist"} — ${p.goal || "Growth campaign"}`;

  const progress = Number(p.progress || 0);
  document.getElementById("campaign-progress-fill").style.width = progress + "%";
  document.getElementById("campaign-progress-text").textContent = progress + "%";

  document.getElementById("campaign-drafts-count").textContent = p.posts_planned || 0;
  document.getElementById("campaign-approved-count").textContent = p.posts_approved || 0;
  document.getElementById("campaign-posted-count").textContent = p.posts_done || 0;
}

// =========================
// SIMPLE WORKING DRAFT STUDIO
// =========================

let currentDraftId = null;

function safeTextCL(v) {
  return String(v || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

async function buildDraftFromActionCard(action) {
  const status = document.getElementById("draft-studio-status");
  const content = document.getElementById("draft-studio-content");

  if (status) status.textContent = "CL is building the draft...";
  if (content) content.value = "";

  try {
    const res = await fetch("/music/post-builder", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        artist: action.artist || document.getElementById("music-artist-name")?.value || "",
        song: action.song || document.getElementById("music-campaign-title")?.value || "",
        platform: action.platform || "",
        task: action.task || "",
        campaign_text: action.campaign_text || document.getElementById("growth-campaign-answer")?.textContent || ""
      })
    });

    const data = await res.json();

    if (!data.success) {
      if (status) status.textContent = "Draft failed: " + JSON.stringify(data, null, 2);
      return;
    }

    currentDraftId = data.draft.id;

    if (content) content.value = data.answer || data.draft.draft_text || "";
    if (status) status.textContent = "Draft built. Now you can rewrite or approve it.";

    await loadPostDrafts();
  } catch (e) {
    if (status) status.textContent = "Draft error: " + e;
  }
}

async function rewriteDraftWithAI() {
  const content = document.getElementById("draft-studio-content");
  const instruction = document.getElementById("draft-studio-instruction");
  const status = document.getElementById("draft-studio-status");

  if (!content || !content.value.trim()) {
    if (status) status.textContent = "Build a draft first.";
    return;
  }

  if (status) status.textContent = "AI is rewriting the draft...";

  try {
    const res = await fetch("/music/post-builder/rewrite", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        draft_text: content.value,
        instruction: instruction?.value || "Make it stronger and more viral."
      })
    });

    const data = await res.json();

    if (data.success) {
      content.value = data.answer;
      if (status) status.textContent = "Draft rewritten.";
    } else {
      if (status) status.textContent = "Rewrite failed.";
    }
  } catch (e) {
    if (status) status.textContent = "Rewrite error: " + e;
  }
}

async function approveDraftStudio() {
  const status = document.getElementById("draft-studio-status");

  if (!currentDraftId) {
    if (status) status.textContent = "Build a draft first before approving.";
    return;
  }

  await fetch("/music/post-builder/update", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({id: currentDraftId, status: "Approved"})
  });

  if (status) status.textContent = "Draft approved.";
  await loadPostDrafts();
}

// force action queue cards to show Build Draft button
async function loadCampaignActionQueue() {
  const box = document.getElementById("music-action-queue-list");
  if (!box) return;

  box.innerHTML = "Loading post cards...";

  try {
    const res = await fetch("/music/action-queue");
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      box.innerHTML = "No post cards yet. Press Build Post Cards first.";
      return;
    }

    box.innerHTML = data.slice().reverse().slice(0, 7).map((a, index) => {
      window["campaignAction_" + index] = a;

      return `
        <div class="doc-card campaign-action-card">
          <strong>${safeTextCL(a.day)} — ${safeTextCL(a.platform || "Platform")}</strong><br>
          ${safeTextCL(a.task || "Campaign task")}<br>
          <span>Status: <b>${safeTextCL(a.status || "Draft")}</b></span>
          <div class="command-buttons">
            <button onclick="buildDraftFromActionCard(window.campaignAction_${index})">📤 Build Draft</button>
            <button onclick="updateCampaignAction('${safeTextCL(a.id)}', 'Approved')">✅ Approve Task</button>
            <button onclick="updateCampaignAction('${safeTextCL(a.id)}', 'Done')">🔥 Mark Done</button>
          </div>
        </div>
      `;
    }).join("");

  } catch (e) {
    box.innerHTML = "Load queue error: " + e;
  }
}

// =========================
// CL VIDEO TV STUDIO
// =========================

let clUploadedVideoUrl = "";

async function uploadCLVideo() {
  const fileInput = document.getElementById("cl-video-file");
  const status = document.getElementById("cl-video-status");
  const player = document.getElementById("cl-video-player");

  if (!fileInput || !fileInput.files.length) {
    if (status) status.textContent = "Choose a video first.";
    return;
  }

  const form = new FormData();
  form.append("video", fileInput.files[0]);

  if (status) status.textContent = "Uploading video...";

  try {
    const res = await fetch("/music/video/upload", {
      method: "POST",
      body: form
    });

    const data = await res.json();

    if (!data.success) {
      if (status) status.textContent = data.message || "Upload failed.";
      return;
    }

    clUploadedVideoUrl = data.url;

    if (player) {
      player.src = data.url;
      player.load();
    }

    if (status) status.textContent = "Video loaded in CL TV Studio.";
  } catch (e) {
    if (status) status.textContent = "Upload error: " + e;
  }
}

async function buildVideoPostPackage() {
  const out = document.getElementById("cl-video-draft");
  const status = document.getElementById("cl-video-status");

  const artist =
    document.getElementById("cl-video-artist")?.value ||
    document.getElementById("music-artist-name")?.value ||
    "";

  const song =
    document.getElementById("cl-video-song")?.value ||
    document.getElementById("music-campaign-title")?.value ||
    "";

  const notes =
    document.getElementById("cl-video-notes")?.value ||
    "";

  if (out) out.value = "CL is building the post package...";
  if (status) status.textContent = "AI writing title, caption, hashtags, and platform versions...";

  try {
    const res = await fetch("/music/video/ai-draft", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        artist,
        song,
        notes,
        video_url: clUploadedVideoUrl,
        platform: "YouTube Shorts, TikTok, Instagram Reels"
      })
    });

    const data = await res.json();

    if (data.success) {
      if (out) out.value = data.answer;
      if (status) status.textContent = "Post package ready.";
    } else {
      if (out) out.value = "AI draft failed.";
    }
  } catch (e) {
    if (out) out.value = "AI draft error: " + e;
  }
}

// =========================
// YOUTUBE MARKET SCANNER
// =========================

async function runYouTubeMarketScan() {
  const out = document.getElementById("market-scan-output");
  const results = document.getElementById("market-video-results");

  const artist = document.getElementById("market-artist")?.value || document.getElementById("music-artist-name")?.value || "";
  const genre = document.getElementById("market-genre")?.value || document.getElementById("music-artist-genre")?.value || "rap music";
  const keyword = document.getElementById("market-keyword")?.value || "";

  if (out) out.value = "Scanning YouTube market and building original content strategy...";
  if (results) results.innerHTML = "Loading top market videos...";

  try {
    const res = await fetch("/music/youtube/market-scan", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({artist, genre, keyword})
    });

    const data = await res.json();

    if (!data.success) {
      if (out) out.value = data.message || "Market scan failed.";
      return;
    }

    if (results) {
      results.innerHTML = data.videos.map(v => `
        <div class="doc-card music-video-card">
          ${v.thumbnail ? `<img src="${v.thumbnail}" alt="">` : ""}
          <strong>${v.title}</strong><br>
          Channel: ${v.channel}<br>
          Views: ${v.views} | Likes: ${v.likes} | Comments: ${v.comments}
        </div>
      `).join("");
    }

    if (out) out.value = data.answer;
  } catch (e) {
    if (out) out.value = "Market scan error: " + e;
  }
}

// =========================
// CL PUBLISHING QUEUE + 10 SHORTS ENGINE
// =========================

async function sendVideoDraftToCLQueue() {
  const status = document.getElementById("cl-video-status");
  const draft = document.getElementById("cl-video-draft")?.value || "";

  const body = {
    artist: document.getElementById("cl-video-artist")?.value || document.getElementById("music-artist-name")?.value || "",
    song: document.getElementById("cl-video-song")?.value || document.getElementById("music-campaign-title")?.value || "",
    video_url: clUploadedVideoUrl || "",
    draft_text: draft,
    platforms: ["YouTube Shorts", "TikTok", "Instagram Reels"]
  };

  if (!draft.trim()) {
    if (status) status.textContent = "Build a post package first.";
    return;
  }

  const res = await fetch("/music/publishing-queue", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (status) {
    status.textContent = data.success
      ? "Added to CL Publishing Queue."
      : "Queue failed.";
  }
}

async function repurposeVideoInto10Shorts() {
  const out = document.getElementById("cl-video-draft");
  const status = document.getElementById("cl-video-status");

  const body = {
    artist: document.getElementById("cl-video-artist")?.value || document.getElementById("music-artist-name")?.value || "",
    song: document.getElementById("cl-video-song")?.value || document.getElementById("music-campaign-title")?.value || "",
    notes: document.getElementById("cl-video-notes")?.value || "",
    draft_text: out?.value || ""
  };

  if (out) out.value = "CL is turning this one video into 10 Shorts...";
  if (status) status.textContent = "Building 10 Shorts plan...";

  const res = await fetch("/music/video/repurpose-10-shorts", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (out) out.value = data.answer || "No output.";
  if (status) status.textContent = "10 Shorts plan ready.";
}

// =========================
// CL PUBLISHING QUEUE SCREEN
// =========================

async function loadCLPublishingQueue() {
  const box = document.getElementById("cl-publishing-queue-list");
  if (!box) return;

  box.innerHTML = "Loading CL Publishing Queue...";

  try {
    const res = await fetch("/music/publishing-queue");
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      box.innerHTML = "No posts in queue yet.";
      return;
    }

    box.innerHTML = data.slice().reverse().map(item => `
      <div class="doc-card cl-queue-card">
        <strong>${item.song || "Untitled Post"}</strong><br>
        Artist: ${item.artist || "Unknown"}<br>
        Status: <b>${item.status || "Queued"}</b><br>
        Platforms: ${(item.platforms || []).join(", ")}<br>
        ${item.video_url ? `<video controls playsinline src="${item.video_url}" class="queue-video-preview"></video>` : ""}
        <pre>${item.draft_text || ""}</pre>
        <div class="command-buttons">
          <button onclick="alert('YouTube upload is next build.')">📤 Post to YouTube</button>
          <button onclick="alert('n8n webhook is next build.')">⚙️ Send to n8n</button>
          <button onclick="copyTextRaw(\`${(item.draft_text || "").replace(/`/g, "\\`")}\`)">Copy Draft</button>
        </div>
      </div>
    `).join("");

  } catch (e) {
    box.innerHTML = "Queue load error: " + e;
  }
}

async function clearCLPublishingQueueConfirm() {
  if (!confirm("Clear the whole CL Publishing Queue?")) return;

  await fetch("/music/publishing-queue/clear", { method: "POST" });
  await loadCLPublishingQueue();
}

function copyTextRaw(text) {
  navigator.clipboard.writeText(text || "");
  alert("Copied.");
}

// =========================
// YOUTUBE UPLOAD FROM CL QUEUE
// =========================

async function postQueueItemToYouTube(id) {
  if (!confirm("Upload this video to YouTube as PRIVATE?")) return;

  const res = await fetch("/music/publishing-queue/youtube-upload", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ id })
  });

  const data = await res.json();

  alert(data.message || JSON.stringify(data, null, 2));
  await loadCLPublishingQueue();
}

// override queue loader with real YouTube upload button
async function loadCLPublishingQueue() {
  const box = document.getElementById("cl-publishing-queue-list");
  if (!box) return;

  box.innerHTML = "Loading CL Publishing Queue...";

  try {
    const res = await fetch("/music/publishing-queue");
    const data = await res.json();

    if (!Array.isArray(data) || !data.length) {
      box.innerHTML = "No posts in queue yet.";
      return;
    }

    box.innerHTML = data.slice().reverse().map(item => `
      <div class="doc-card cl-queue-card">
        <strong>${item.song || "Untitled Post"}</strong><br>
        Artist: ${item.artist || "Unknown"}<br>
        Status: <b>${item.status || "Queued"}</b><br>
        Platforms: ${(item.platforms || []).join(", ")}<br>
        ${item.youtube_url ? `<a href="${item.youtube_url}" target="_blank">Open YouTube Upload</a><br>` : ""}
        ${item.video_url ? `<video controls playsinline src="${item.video_url}" class="queue-video-preview"></video>` : ""}
        <pre>${item.draft_text || ""}</pre>
        <div class="command-buttons">
          <button onclick="postQueueItemToYouTube('${item.id}')">📤 Post to YouTube Private</button>
          <button onclick="copyTextRaw(\`${(item.draft_text || "").replace(/`/g, "\\`")}\`)">Copy Draft</button>
        </div>
      </div>
    `).join("");

  } catch (e) {
    box.innerHTML = "Queue load error: " + e;
  }
}

// =========================
// YOUTUBE VIDEO IMPORTER
// =========================

async function importYouTubeVideoToCL() {
  const status = document.getElementById("cl-video-status");
  const player = document.getElementById("cl-video-player");
  const url = prompt("Paste your YouTube video URL:");

  if (!url) return;

  if (status) status.textContent = "Downloading your YouTube video into CL...";

  const res = await fetch("/music/youtube/import-video", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({url})
  });

  const data = await res.json();

  if (!data.success) {
    if (status) status.textContent = data.message || "Import failed.";
    alert(data.error || data.message || "Import failed.");
    return;
  }

  clUploadedVideoUrl = data.url;

  if (player) {
    player.src = data.url;
    player.load();
  }

  if (status) status.textContent = "Video imported into CL TV Studio.";
}

// =========================
// FFMPEG 10 SHORTS CLIP CUTTER
// =========================

async function create10ShortClips() {
  const status = document.getElementById("cl-video-status");
  const out = document.getElementById("cl-video-draft");

  if (!clUploadedVideoUrl) {
    if (status) status.textContent = "Upload or import a video first.";
    return;
  }

  if (status) status.textContent = "CL is cutting 10 vertical Shorts...";
  if (out) out.value = "Creating 10 short clips with FFmpeg...";

  const res = await fetch("/music/video/create-10-shorts", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      video_url: clUploadedVideoUrl,
      count: 10,
      clip_seconds: 15
    })
  });

  const data = await res.json();

  if (!data.success) {
    if (status) status.textContent = data.message || "Clip export failed.";
    return;
  }

  if (status) status.textContent = data.message;

  const html = data.shorts.map(s => `
SHORT ${s.number}
Start: ${s.start}s
Length: ${s.duration}s
Video: ${location.origin}${s.url}
`).join("\n");

  if (out) out.value = html;

  const queueBox = document.getElementById("cl-publishing-queue-list");
  if (queueBox) {
    queueBox.innerHTML = data.shorts.map(s => `
      <div class="doc-card cl-queue-card">
        <strong>Short ${s.number}</strong><br>
        Start: ${s.start}s<br>
        <video controls playsinline src="${s.url}" class="queue-video-preview"></video>
        <div class="command-buttons">
          <button onclick="navigator.clipboard.writeText('${location.origin}${s.url}')">Copy Video Link</button>
        </div>
      </div>
    `).join("");
  }
}

// =========================
// FIXED YOUTUBE IMPORT TO CL
// =========================

async function importYouTubeUrlToCL() {
  const status = document.getElementById("cl-video-status");
  const player = document.getElementById("cl-video-player");

  const url = prompt("Paste your YouTube video URL:");

  if (!url) return;

  if (status) status.textContent = "Importing YouTube video into CL...";

  try {
    const res = await fetch("/music/youtube/import-url", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({url})
    });

    const data = await res.json();

    if (!data.success) {
      if (status) status.textContent = data.message || "Import failed.";
      alert(data.error || data.message || "Import failed.");
      return;
    }

    clUploadedVideoUrl = data.url;

    if (player) {
      player.src = data.url;
      player.load();
    }

    if (status) status.textContent = "YouTube video imported and loaded in CL TV Studio.";
  } catch (e) {
    if (status) status.textContent = "Import error: " + e;
  }
}

// =========================
// HARD FIX: CL VIDEO TV BUTTONS
// =========================

function clSetVideo(url, message) {
  clUploadedVideoUrl = url || clUploadedVideoUrl || "";
  const player = document.getElementById("cl-video-player");
  const status = document.getElementById("cl-video-status");

  if (player && clUploadedVideoUrl) {
    player.src = clUploadedVideoUrl;
    player.load();
  }

  if (status) status.textContent = message || "Video loaded.";
}

async function uploadCLVideo() {
  const fileInput = document.getElementById("cl-video-file");
  const status = document.getElementById("cl-video-status");

  if (!fileInput || !fileInput.files.length) {
    if (status) status.textContent = "Choose a video first.";
    return;
  }

  const form = new FormData();
  form.append("video", fileInput.files[0]);

  if (status) status.textContent = "Uploading video...";

  try {
    const res = await fetch("/music/video/upload", { method: "POST", body: form });
    const data = await res.json();

    if (!data.success) {
      if (status) status.textContent = data.message || "Upload failed.";
      return;
    }

    clSetVideo(data.url, "Video uploaded and loaded in CL TV Studio.");
  } catch (e) {
    if (status) status.textContent = "Upload error: " + e;
  }
}

async function importYouTubeUrlToCL() {
  const status = document.getElementById("cl-video-status");
  const url = prompt("Paste your YouTube video URL:");

  if (!url) return;
  if (status) status.textContent = "Importing YouTube video into CL...";

  try {
    const res = await fetch("/music/youtube/import-url", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({url})
    });

    const data = await res.json();

    if (!data.success) {
      if (status) status.textContent = data.message || "Import failed.";
      alert(data.error || data.message || "Import failed.");
      return;
    }

    clSetVideo(data.url, "YouTube video imported into CL TV Studio.");
  } catch (e) {
    if (status) status.textContent = "Import error: " + e;
  }
}

async function buildVideoPostPackage() {
  const out = document.getElementById("cl-video-draft");
  const status = document.getElementById("cl-video-status");

  const artist = document.getElementById("cl-video-artist")?.value || document.getElementById("music-artist-name")?.value || "";
  const song = document.getElementById("cl-video-song")?.value || document.getElementById("music-campaign-title")?.value || "";
  const notes = document.getElementById("cl-video-notes")?.value || "";

  if (out) out.value = "CL is building title, caption, hashtags, and platform drafts...";
  if (status) status.textContent = "Building post package...";

  try {
    const res = await fetch("/music/video/ai-draft", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        artist, song, notes,
        video_url: clUploadedVideoUrl,
        platform: "YouTube Shorts, TikTok, Instagram Reels"
      })
    });

    const data = await res.json();

    if (data.success) {
      if (out) out.value = data.answer;
      if (status) status.textContent = "Post package ready.";
    } else {
      if (out) out.value = data.message || "Post package failed.";
    }
  } catch (e) {
    if (out) out.value = "Post package error: " + e;
  }
}

async function repurposeVideoInto10Shorts() {
  const out = document.getElementById("cl-video-draft");
  const status = document.getElementById("cl-video-status");

  const body = {
    artist: document.getElementById("cl-video-artist")?.value || document.getElementById("music-artist-name")?.value || "",
    song: document.getElementById("cl-video-song")?.value || document.getElementById("music-campaign-title")?.value || "",
    notes: document.getElementById("cl-video-notes")?.value || "",
    draft_text: out?.value || ""
  };

  if (out) out.value = "CL is turning this video into a 10 Shorts content plan...";
  if (status) status.textContent = "Building 10 Shorts plan...";

  try {
    const res = await fetch("/music/video/repurpose-10-shorts", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (out) out.value = data.answer || data.message || "No output.";
    if (status) status.textContent = data.success ? "10 Shorts plan ready." : "10 Shorts plan failed.";
  } catch (e) {
    if (out) out.value = "10 Shorts plan error: " + e;
  }
}

async function create10ShortClips() {
  const status = document.getElementById("cl-video-status");
  const out = document.getElementById("cl-video-draft");

  if (!clUploadedVideoUrl) {
    if (status) status.textContent = "Upload or import a video first.";
    return;
  }

  if (status) status.textContent = "CL is cutting 10 vertical Shorts...";
  if (out) out.value = "Creating 10 short clips with FFmpeg...";

  try {
    const res = await fetch("/music/video/create-10-shorts", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        video_url: clUploadedVideoUrl,
        count: 10,
        clip_seconds: 15
      })
    });

    const data = await res.json();

    if (!data.success) {
      if (status) status.textContent = data.message || "Clip export failed.";
      if (out) out.value = data.message || "Clip export failed.";
      return;
    }

    if (status) status.textContent = data.message;

    if (out) {
      out.value = data.shorts.map(s =>
`SHORT ${s.number}
Start: ${s.start}s
Length: ${s.duration}s
Video: ${location.origin}${s.url}`
      ).join("\n\n");
    }

    const queueBox = document.getElementById("cl-publishing-queue-list");
    if (queueBox) {
      queueBox.innerHTML = data.shorts.map(s => `
        <div class="doc-card cl-queue-card">
          <strong>Exported Short ${s.number}</strong><br>
          Start: ${s.start}s | Length: ${s.duration}s<br>
          <video controls playsinline src="${s.url}" class="queue-video-preview"></video>
          <div class="command-buttons">
            <button onclick="addShortClipToCLQueue('${s.url}', 'Short ${s.number}')">📤 Add This Short to Queue</button>
            <button onclick="navigator.clipboard.writeText('${location.origin}${s.url}')">Copy Video Link</button>
          </div>
        </div>
      `).join("");
    }
  } catch (e) {
    if (status) status.textContent = "Clip export error: " + e;
  }
}

async function addShortClipToCLQueue(videoUrl, label) {
  const draft = document.getElementById("cl-video-draft")?.value || "";
  const body = {
    artist: document.getElementById("cl-video-artist")?.value || document.getElementById("music-artist-name")?.value || "",
    song: label || document.getElementById("cl-video-song")?.value || "Short Clip",
    video_url: videoUrl,
    draft_text: draft,
    platforms: ["YouTube Shorts", "TikTok", "Instagram Reels"]
  };

  const res = await fetch("/music/publishing-queue", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();
  alert(data.success ? "Short added to CL Publishing Queue." : "Queue failed.");
  await loadCLPublishingQueue();
}

async function sendVideoDraftToCLQueue() {
  const status = document.getElementById("cl-video-status");
  const draft = document.getElementById("cl-video-draft")?.value || "";

  if (!clUploadedVideoUrl) {
    if (status) status.textContent = "Upload/import/export a video first.";
    return;
  }

  const body = {
    artist: document.getElementById("cl-video-artist")?.value || document.getElementById("music-artist-name")?.value || "",
    song: document.getElementById("cl-video-song")?.value || document.getElementById("music-campaign-title")?.value || "Music Post",
    video_url: clUploadedVideoUrl,
    draft_text: draft,
    platforms: ["YouTube Shorts", "TikTok", "Instagram Reels"]
  };

  const res = await fetch("/music/publishing-queue", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (status) status.textContent = data.success ? "Added to CL Publishing Queue." : "Queue failed.";
  await loadCLPublishingQueue();
}

// =========================
// MY YOUTUBE VIDEO PICKER
// =========================

async function loadMyYouTubeVideosForImport() {
  const box = document.getElementById("youtube-picker-results");
  const status = document.getElementById("cl-video-status");

  if (box) box.innerHTML = "Loading your YouTube videos...";
  if (status) status.textContent = "Getting videos from your connected YouTube channel...";

  try {
    const res = await fetch("/music/youtube/my-videos-picker");
    const data = await res.json();

    if (!data.success) {
      if (box) box.innerHTML = data.message || "Could not load videos.";
      return;
    }

    box.innerHTML = data.videos.map(v => `
      <div class="doc-card youtube-picker-card">
        ${v.thumbnail ? `<img src="${v.thumbnail}" class="youtube-picker-thumb">` : ""}
        <strong>${v.title}</strong><br>
        <small>${v.published_at || ""}</small>
        <div class="command-buttons">
          <button onclick="importSelectedYouTubeVideo('${v.url.replace(/'/g, "\\'")}')">📥 Import This Video</button>
        </div>
      </div>
    `).join("");

    if (status) status.textContent = "Pick a YouTube video to import.";
  } catch (e) {
    if (box) box.innerHTML = "Picker error: " + e;
  }
}

async function importSelectedYouTubeVideo(url) {
  const status = document.getElementById("cl-video-status");
  const player = document.getElementById("cl-video-player");

  if (status) status.textContent = "Downloading selected YouTube video into CL...";

  try {
    const res = await fetch("/music/youtube/import-url", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({url})
    });

    const data = await res.json();

    if (!data.success) {
      if (status) status.textContent = data.message || "Import failed.";
      alert(data.error || data.message || "Import failed.");
      return;
    }

    clUploadedVideoUrl = data.url;

    if (player) {
      player.src = data.url;
      player.load();
    }

    if (status) status.textContent = "Selected YouTube video imported into CL.";
  } catch (e) {
    if (status) status.textContent = "Import error: " + e;
  }
}

// =========================
// ANALYZE FROM YOUTUBE
// =========================

let selectedYouTubeVideoForCL = null;

async function analyzeSelectedYouTubeVideo(v) {
  selectedYouTubeVideoForCL = v;

  const status = document.getElementById("cl-video-status");
  const out = document.getElementById("cl-video-draft");

  const artistInput = document.getElementById("cl-video-artist");
  const songInput = document.getElementById("cl-video-song");
  const notesInput = document.getElementById("cl-video-notes");

  if (artistInput && !artistInput.value) artistInput.value = document.getElementById("music-artist-name")?.value || "";
  if (songInput) songInput.value = v.title || "";
  if (notesInput) notesInput.value = `Selected from YouTube: ${v.url}`;

  if (status) status.textContent = "Analyzing selected YouTube video...";
  if (out) out.value = "CL is analyzing this YouTube video and building a content package...";

  const res = await fetch("/music/youtube/analyze-video", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      video_id: v.id,
      title: v.title,
      url: v.url,
      artist: artistInput?.value || "",
      description: v.description || ""
    })
  });

  const data = await res.json();

  if (!data.success) {
    if (status) status.textContent = data.message || "Analyze failed.";
    if (out) out.value = data.message || "Analyze failed.";
    return;
  }

  if (out) out.value = data.answer;
  if (status) status.textContent = "YouTube video analyzed. Upload original file if you want real clip exports.";
}

async function loadMyYouTubeVideosForImport() {
  const box = document.getElementById("youtube-picker-results");
  const status = document.getElementById("cl-video-status");

  if (box) box.innerHTML = "Loading your YouTube videos...";
  if (status) status.textContent = "Getting videos from your connected YouTube channel...";

  try {
    const res = await fetch("/music/youtube/my-videos-picker");
    const data = await res.json();

    if (!data.success) {
      if (box) box.innerHTML = data.message || "Could not load videos.";
      return;
    }

    box.innerHTML = data.videos.map((v, i) => {
      window["ytPick_" + i] = v;
      return `
        <div class="doc-card youtube-picker-card">
          ${v.thumbnail ? `<img src="${v.thumbnail}" class="youtube-picker-thumb">` : ""}
          <strong>${v.title}</strong><br>
          <small>${v.published_at || ""}</small><br>
          <small>${v.url || ""}</small>
          <div class="command-buttons">
            <button onclick="analyzeSelectedYouTubeVideo(window.ytPick_${i})">🧠 Analyze This Video</button>
          </div>
        </div>
      `;
    }).join("");

    if (status) status.textContent = "Pick a YouTube video to analyze.";
  } catch (e) {
    if (box) box.innerHTML = "Picker error: " + e;
  }
}

// =========================
// YOUTUBE EMBED PREVIEW FIX
// =========================

function showYouTubePreviewInTV(videoId) {
  const player = document.getElementById("cl-video-player");
  const iframe = document.getElementById("cl-youtube-embed-preview");

  if (player) {
    player.pause?.();
    player.removeAttribute("src");
    player.style.display = "none";
  }

  if (iframe && videoId) {
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.style.display = "block";
  }
}

function showUploadedVideoInTV(url) {
  const player = document.getElementById("cl-video-player");
  const iframe = document.getElementById("cl-youtube-embed-preview");

  if (iframe) {
    iframe.src = "";
    iframe.style.display = "none";
  }

  if (player && url) {
    player.style.display = "block";
    player.src = url;
    player.load();
  }
}

// patch analyzer to show YouTube preview
const oldAnalyzeSelectedYouTubeVideo = analyzeSelectedYouTubeVideo;
analyzeSelectedYouTubeVideo = async function(v) {
  showYouTubePreviewInTV(v.id);
  return oldAnalyzeSelectedYouTubeVideo(v);
};

// patch uploaded/imported file preview
const oldClSetVideo = clSetVideo;
clSetVideo = function(url, message) {
  showUploadedVideoInTV(url);
  return oldClSetVideo(url, message);
};

// =========================
// YOUTUBE CAMPAIGN SAVE + SMART EDIT PLAN
// =========================

async function saveYouTubeAnalysisCampaign() {
  const out = document.getElementById("cl-video-draft");
  const status = document.getElementById("cl-video-status");

  if (!selectedYouTubeVideoForCL) {
    alert("Pick and analyze a YouTube video first.");
    return;
  }

  const body = {
    title: selectedYouTubeVideoForCL.title || document.getElementById("cl-video-song")?.value || "YouTube Campaign",
    artist: document.getElementById("cl-video-artist")?.value || "",
    youtube_url: selectedYouTubeVideoForCL.url || "",
    video_id: selectedYouTubeVideoForCL.id || "",
    analysis: out?.value || ""
  };

  const res = await fetch("/music/youtube/campaigns", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (status) status.textContent = data.success ? "YouTube analysis saved as campaign." : "Save failed.";
}

async function loadYouTubeAnalysisCampaigns() {
  const box = document.getElementById("youtube-picker-results");
  if (!box) return;

  box.innerHTML = "Loading saved YouTube campaigns...";

  const res = await fetch("/music/youtube/campaigns");
  const data = await res.json();

  if (!Array.isArray(data) || !data.length) {
    box.innerHTML = "No saved YouTube campaigns yet.";
    return;
  }

  box.innerHTML = data.slice().reverse().map((c, i) => {
    window["ytCampaign_" + i] = c;
    return `
      <div class="doc-card youtube-picker-card">
        <strong>${c.title}</strong><br>
        Artist: ${c.artist || "Unknown"}<br>
        Status: ${c.status || "Saved"}<br>
        <small>${c.youtube_url || ""}</small>
        <div class="command-buttons">
          <button onclick="loadSavedYouTubeCampaign(window.ytCampaign_${i})">📂 Open</button>
          <button onclick="buildSmartEditPlanFromCampaign(window.ytCampaign_${i})">🎬 Smart Edit Plan</button>
        </div>
      </div>
    `;
  }).join("");
}

function loadSavedYouTubeCampaign(c) {
  selectedYouTubeVideoForCL = {
    id: c.video_id,
    title: c.title,
    url: c.youtube_url
  };

  document.getElementById("cl-video-song").value = c.title || "";
  document.getElementById("cl-video-notes").value = `Saved YouTube campaign: ${c.youtube_url || ""}`;
  document.getElementById("cl-video-draft").value = c.analysis || "";
  document.getElementById("cl-video-status").textContent = "Saved campaign loaded.";

  if (c.video_id && typeof showYouTubePreviewInTV === "function") {
    showYouTubePreviewInTV(c.video_id);
  }
}

async function buildSmartEditPlanFromCampaign(c=null) {
  const out = document.getElementById("cl-video-draft");
  const status = document.getElementById("cl-video-status");

  const active = c || {
    title: document.getElementById("cl-video-song")?.value || "",
    artist: document.getElementById("cl-video-artist")?.value || "",
    analysis: out?.value || "",
  };

  if (out) out.value = "CL is building the smart edit plan...";
  if (status) status.textContent = "Building smart edit plan...";

  const res = await fetch("/music/video/smart-edit-plan", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      artist: active.artist || document.getElementById("cl-video-artist")?.value || "",
      title: active.title || document.getElementById("cl-video-song")?.value || "",
      notes: document.getElementById("cl-video-notes")?.value || "",
      analysis: active.analysis || ""
    })
  });

  const data = await res.json();
  if (out) out.value = data.answer || data.message || "No output.";
  if (status) status.textContent = data.success ? "Smart edit plan ready." : "Smart edit plan failed.";
}

// HARD FIX VIDEO PLAYBACK SWITCH
function showYouTubePreviewInTV(videoId) {
  const player = document.getElementById("cl-video-player");
  const iframe = document.getElementById("cl-youtube-embed-preview");

  if (player) {
    player.pause?.();
    player.src = "";
    player.style.display = "none";
  }

  if (iframe) {
    iframe.style.display = "block";
    iframe.src = `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`;
  }
}

function showUploadedVideoInTV(url) {
  const player = document.getElementById("cl-video-player");
  const iframe = document.getElementById("cl-youtube-embed-preview");

  if (iframe) {
    iframe.src = "";
    iframe.style.display = "none";
  }

  if (player) {
    player.style.display = "block";
    player.src = url;
    player.load();
  }
}

function clSetVideo(url, message) {
  clUploadedVideoUrl = url || "";
  showUploadedVideoInTV(clUploadedVideoUrl);
  const status = document.getElementById("cl-video-status");
  if (status) status.textContent = message || "Video loaded.";
}

// SIMPLE YOUTUBE LINK ANALYZE
function getYouTubeIdFromUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    if (u.pathname.includes("/shorts/")) return u.pathname.split("/shorts/")[1].split("/")[0];
  } catch(e) {}
  return "";
}

async function analyzeYouTubeLinkSimple() {
  const input = document.getElementById("cl-youtube-url-input");
  const status = document.getElementById("cl-video-status");
  const out = document.getElementById("cl-video-draft");

  const url = input?.value?.trim();
  const videoId = getYouTubeIdFromUrl(url);

  if (!url || !videoId) {
    if (status) status.textContent = "Paste a valid YouTube link first.";
    return;
  }

  selectedYouTubeVideoForCL = {
    id: videoId,
    title: document.getElementById("cl-video-song")?.value || "YouTube Video",
    url: url
  };

  if (typeof showYouTubePreviewInTV === "function") {
    showYouTubePreviewInTV(videoId);
  }

  if (status) status.textContent = "Analyzing YouTube link...";
  if (out) out.value = "CL is analyzing this YouTube video...";

  const res = await fetch("/music/youtube/analyze-video", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      video_id: videoId,
      title: selectedYouTubeVideoForCL.title,
      url: url,
      artist: document.getElementById("cl-video-artist")?.value || ""
    })
  });

  const data = await res.json();
  if (out) out.value = data.answer || data.message || "No output.";
  if (status) status.textContent = data.success ? "YouTube link analyzed." : "Analyze failed.";
}

// =========================
// YOUTUBE CAMPAIGN POST CARDS
// =========================

async function buildYouTubePostCardsFromCurrent() {
  const out = document.getElementById("cl-video-draft");
  const status = document.getElementById("cl-video-status");

  if (!selectedYouTubeVideoForCL) {
    alert("Analyze a YouTube video first.");
    return;
  }

  const body = {
    title: selectedYouTubeVideoForCL.title || document.getElementById("cl-video-song")?.value || "YouTube Campaign",
    artist: document.getElementById("cl-video-artist")?.value || "SolidWorld",
    youtube_url: selectedYouTubeVideoForCL.url || "",
    analysis: out?.value || ""
  };

  if (status) status.textContent = "Building 10 real post cards...";

  const res = await fetch("/music/youtube/post-cards", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (status) status.textContent = data.success ? "Post cards created." : "Post card build failed.";
  await loadYouTubePostCards();
}

async function loadYouTubePostCards() {
  const box = document.getElementById("post-drafts-list") || document.getElementById("cl-publishing-queue-list");
  if (!box) return;

  box.innerHTML = "Loading post cards...";

  const res = await fetch("/music/youtube/post-cards");
  const data = await res.json();

  if (!Array.isArray(data) || !data.length) {
    box.innerHTML = "No post cards yet.";
    return;
  }

  box.innerHTML = data.slice().reverse().map((c, i) => {
    window["ytPostCard_" + i] = c;
    return `
      <div class="doc-card cl-queue-card">
        <strong>${c.title}</strong><br>
        Platform: <b>${c.platform}</b><br>
        Status: ${c.status}<br>
        <p><b>Hook:</b> ${c.hook}</p>
        <p><b>Caption:</b> ${c.caption}</p>
        <p><b>Hashtags:</b> ${c.hashtags}</p>
        <div class="command-buttons">
          <button onclick="loadPostCardIntoDraftStudio(window.ytPostCard_${i})">✍️ Edit Draft</button>
          <button onclick="addPostCardToQueue(window.ytPostCard_${i})">📤 Add to Queue</button>
        </div>
      </div>
    `;
  }).join("");
}

function loadPostCardIntoDraftStudio(card) {
  const draft = document.getElementById("draft-studio-output") || document.getElementById("cl-video-draft");
  if (!draft) return;

  draft.value =
`TITLE:
${card.title}

PLATFORM:
${card.platform}

HOOK:
${card.hook}

CAPTION:
${card.caption}

HASHTAGS:
${card.hashtags}

SOURCE:
${card.youtube_url}`;

  const status = document.getElementById("cl-video-status");
  if (status) status.textContent = "Post card loaded into Draft Studio.";
}

async function addPostCardToQueue(card) {
  const body = {
    artist: card.artist,
    song: card.title,
    video_url: "",
    draft_text: `TITLE: ${card.title}\n\nHOOK: ${card.hook}\n\nCAPTION: ${card.caption}\n\nHASHTAGS: ${card.hashtags}\n\nSOURCE: ${card.youtube_url}`,
    platforms: [card.platform]
  };

  const res = await fetch("/music/publishing-queue", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();
  alert(data.success ? "Added to CL Publishing Queue." : "Queue failed.");
}

// =========================
// AI REWRITE POST CARDS
// =========================

async function rewritePostCardWithAI(cardIndex) {
  const card = window["ytPostCard_" + cardIndex];
  if (!card) {
    alert("Post card not found.");
    return;
  }

  const instruction = prompt(
    "How should CL rewrite it?",
    "Make it more viral, emotional, street, clean enough for platforms, and specific to SolidWorld."
  );

  if (!instruction) return;

  const res = await fetch("/music/youtube/post-card/rewrite", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ card, instruction })
  });

  const data = await res.json();

  const draft = document.getElementById("draft-studio-content") || document.getElementById("cl-video-draft");
  if (draft) draft.value = data.answer || "Rewrite failed.";

  const status = document.getElementById("cl-video-status");
  if (status) status.textContent = data.success ? "AI rewrite loaded into Draft Studio." : "Rewrite failed.";
}

// override card loader with rewrite button
async function loadYouTubePostCards() {
  const box = document.getElementById("cl-publishing-queue-list");
  if (!box) return;

  box.innerHTML = "Loading post cards...";

  const res = await fetch("/music/youtube/post-cards");
  const data = await res.json();

  if (!Array.isArray(data) || !data.length) {
    box.innerHTML = "No post cards yet.";
    return;
  }

  box.innerHTML = data.slice().reverse().map((c, i) => {
    window["ytPostCard_" + i] = c;
    return `
      <div class="doc-card cl-queue-card">
        <strong>${c.title}</strong><br>
        Platform: <b>${c.platform}</b><br>
        Status: ${c.status}<br>
        <p><b>Hook:</b> ${c.hook}</p>
        <p><b>Caption:</b> ${c.caption}</p>
        <p><b>Hashtags:</b> ${c.hashtags}</p>
        <div class="command-buttons">
          <button onclick="rewritePostCardWithAI(${i})">🤖 AI Rewrite</button>
          <button onclick="loadPostCardIntoDraftStudio(window.ytPostCard_${i})">✍️ Edit Draft</button>
          <button onclick="addPostCardToQueue(window.ytPostCard_${i})">📤 Add to Queue</button>
        </div>
      </div>
    `;
  }).join("");
}

// =========================
// REAL CL VIDEO GENERATOR
// =========================

async function makeCLContentVideos() {
  const status = document.getElementById("cl-video-status");
  const out = document.getElementById("cl-video-draft");
  const queueBox = document.getElementById("cl-publishing-queue-list");

  if (!clUploadedVideoUrl || !clUploadedVideoUrl.includes("/uploads/music_videos/")) {
    if (status) status.textContent = "Upload a real video first. YouTube preview cannot be edited yet.";
    alert("Upload the original video file first, then CL can generate edited MP4s.");
    return;
  }

  const artist = document.getElementById("cl-video-artist")?.value || "Artist";
  const hook = prompt("What big hook text should CL put on the video?", "WATCH THIS BEFORE THEY COUNT YOU OUT") || "WATCH THIS";

  if (status) status.textContent = "CL is generating finished videos...";
  if (out) out.value = "Making real edited MP4 videos with effects and text overlays...";

  const res = await fetch("/music/video/make-content", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      video_url: clUploadedVideoUrl,
      artist,
      hook,
      count: 5,
      clip_seconds: 15
    })
  });

  const data = await res.json();

  if (!data.success) {
    if (status) status.textContent = data.message || "Video generator failed.";
    if (out) out.value = data.message || "Video generator failed.";
    return;
  }

  if (status) status.textContent = data.message;

  if (out) {
    out.value = data.videos.map(v =>
`FINISHED VIDEO ${v.number}
Start: ${v.start}s
Length: ${v.duration}s
Video: ${location.origin}${v.url}`
    ).join("\n\n");
  }

  if (queueBox) {
    queueBox.innerHTML = data.videos.map(v => `
      <div class="doc-card cl-queue-card">
        <strong>Generated Video ${v.number}</strong><br>
        Start: ${v.start}s | Length: ${v.duration}s<br>
        <video controls playsinline src="${v.url}" class="queue-video-preview"></video>
        <div class="command-buttons">
          <button onclick="addGeneratedVideoToQueue('${v.url}', 'Generated Video ${v.number}')">📤 Add to Queue</button>
          <button onclick="navigator.clipboard.writeText('${location.origin}${v.url}')">Copy Link</button>
        </div>
      </div>
    `).join("");
  }
}

async function addGeneratedVideoToQueue(videoUrl, title) {
  const draft = document.getElementById("cl-video-draft")?.value || "";
  const body = {
    artist: document.getElementById("cl-video-artist")?.value || "Artist",
    song: title,
    video_url: videoUrl,
    draft_text: draft,
    platforms: ["YouTube Shorts", "TikTok", "Instagram Reels"]
  };

  const res = await fetch("/music/publishing-queue", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  const data = await res.json();
  alert(data.success ? "Generated video added to CL Publishing Queue." : "Queue failed.");
  await loadCLPublishingQueue();
}

// =========================
// MAKE ME CONTENT 2.0
// =========================

async function makeCLContentVideos2() {
  const status = document.getElementById("cl-video-status");
  const out = document.getElementById("cl-video-draft");
  const queueBox = document.getElementById("cl-publishing-queue-list");

  if (!clUploadedVideoUrl || !clUploadedVideoUrl.includes("/uploads/music_videos/")) {
    alert("Upload a real video file first. YouTube preview can be analyzed, but CL needs the MP4 to generate edited videos.");
    if (status) status.textContent = "Upload a real video first.";
    return;
  }

  const artist = document.getElementById("cl-video-artist")?.value || "Artist";
  const song = document.getElementById("cl-video-song")?.value || "Music Video";
  const hook = prompt("What hook text should CL put on the video?", "WATCH THIS BEFORE THEY COUNT YOU OUT") || "WATCH THIS";

  if (status) status.textContent = "Make Me Content 2.0 is creating videos + captions + hashtags...";
  if (out) out.value = "CL is generating finished videos and post packages...";

  const res = await fetch("/music/video/make-content-2", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      video_url: clUploadedVideoUrl,
      artist,
      song,
      hook,
      count: 5,
      clip_seconds: 15
    })
  });

  const data = await res.json();

  if (!data.success) {
    if (status) status.textContent = data.message || "Make Me Content 2.0 failed.";
    if (out) out.value = data.message || "Make Me Content 2.0 failed.";
    return;
  }

  if (status) status.textContent = data.message;

  if (out) {
    out.value = data.videos.map(v =>
`FINISHED VIDEO ${v.number}
Start: ${v.start}s
Length: ${v.duration}s
Video: ${location.origin}${v.url}

${v.post_package}`
    ).join("\n\n====================\n\n");
  }

  if (queueBox) {
    queueBox.innerHTML = data.videos.map(v => `
      <div class="doc-card cl-queue-card">
        <strong>Ready Video ${v.number}</strong><br>
        Start: ${v.start}s | Length: ${v.duration}s<br>
        <video controls playsinline src="${v.url}" class="queue-video-preview"></video>
        <pre>${v.post_package}</pre>
      </div>
    `).join("");
  }

  await loadCLPublishingQueue();
}

// =========================
// CL POSTING DESK
// =========================

async function updateQueueItem(id, patch) {
  const res = await fetch("/music/publishing-queue/update", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ id, patch })
  });

  const data = await res.json();
  if (!data.success) alert(data.message || "Update failed.");
  await loadCLPublishingQueue();
}

function editQueueItem(id) {
  const title = document.getElementById(`queue-title-${id}`)?.value || "";
  const draft = document.getElementById(`queue-draft-${id}`)?.value || "";

  updateQueueItem(id, {
    song: title,
    draft_text: draft,
    status: "Edited"
  });
}

async function loadCLPublishingQueue() {
  const box = document.getElementById("cl-publishing-queue-list");
  if (!box) return;

  box.innerHTML = "Loading Posting Desk...";

  const res = await fetch("/music/publishing-queue");
  const data = await res.json();

  if (!Array.isArray(data) || !data.length) {
    box.innerHTML = "No posts in Posting Desk yet.";
    return;
  }

  box.innerHTML = data.slice().reverse().map(item => `
    <div class="posting-desk-card">
      <div class="posting-desk-video">
        ${item.video_url ? `<video controls playsinline src="${item.video_url}"></video>` : `<div class="no-video-box">No video file yet</div>`}
      </div>

      <div class="posting-desk-info">
        <input id="queue-title-${item.id}" value="${(item.song || "Untitled").replace(/"/g, "&quot;")}" placeholder="Post title">

        <textarea id="queue-draft-${item.id}" placeholder="Caption / hashtags / platform copy">${item.draft_text || ""}</textarea>

        <div class="posting-meta">
          <span>Status: <b>${item.status || "Queued"}</b></span>
          <span>Platforms: ${(item.platforms || []).join(", ")}</span>
          <span>Source: ${item.source || "CL"}</span>
        </div>

        <div class="command-buttons posting-actions">
          <button onclick="editQueueItem('${item.id}')">💾 Save Edit</button>
          <button onclick="updateQueueItem('${item.id}', {status:'Approved'})">✅ Approve</button>
          <button onclick="updateQueueItem('${item.id}', {status:'Needs Edit'})">✍️ Needs Edit</button>
          <button onclick="postQueueItemToYouTube('${item.id}')">📤 YouTube Private</button>
          <button onclick="copyTextRaw(document.getElementById('queue-draft-${item.id}').value)">Copy</button>
        </div>
      </div>
    </div>
  `).join("");
}

// =========================
// CL QUEUE ACTIONS UPGRADE
// =========================

async function deleteQueueItem(id) {
  if (!confirm("Delete this queue item?")) return;

  const res = await fetch("/music/publishing-queue/delete", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ id })
  });

  const data = await res.json();
  alert(data.message || "Deleted.");
  await loadCLPublishingQueue();
}

function openQueueVideo(url) {
  if (!url) {
    alert("No video file found.");
    return;
  }
  window.open(url, "_blank");
}

function downloadQueueVideo(url) {
  if (!url) {
    alert("No video file found.");
    return;
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = url.split("/").pop() || "CL-video.mp4";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// override Posting Desk loader with full actions
async function loadCLPublishingQueue() {
  const box = document.getElementById("cl-publishing-queue-list");
  if (!box) return;

  box.innerHTML = "Loading Posting Desk...";

  const res = await fetch("/music/publishing-queue");
  const data = await res.json();

  if (!Array.isArray(data) || !data.length) {
    box.innerHTML = "No posts in Posting Desk yet.";
    return;
  }

  box.innerHTML = data.slice().reverse().map(item => {
    const safeTitle = (item.song || "Untitled").replace(/"/g, "&quot;");
    const safeDraft = item.draft_text || "";
    const video = item.video_url || "";

    return `
      <div class="posting-desk-card">
        <div class="posting-desk-video">
          ${video ? `<video controls playsinline src="${video}"></video>` : `<div class="no-video-box">No video file yet</div>`}
          <div class="command-buttons video-actions">
            <button onclick="openQueueVideo('${video}')">👁️ Watch</button>
            <button onclick="downloadQueueVideo('${video}')">⬇️ Download</button>
          </div>
        </div>

        <div class="posting-desk-info">
          <input id="queue-title-${item.id}" value="${safeTitle}" placeholder="Post title">

          <textarea id="queue-draft-${item.id}" placeholder="Caption / hashtags / platform copy">${safeDraft}</textarea>

          <div class="posting-meta">
            <span>Status: <b>${item.status || "Queued"}</b></span>
            <span>Platforms: ${(item.platforms || []).join(", ")}</span>
            <span>Source: ${item.source || "CL"}</span>
          </div>

          <div class="command-buttons posting-actions">
            <button onclick="editQueueItem('${item.id}')">💾 Save Edit</button>
            <button onclick="updateQueueItem('${item.id}', {status:'Approved'})">✅ Approve</button>
            <button onclick="updateQueueItem('${item.id}', {status:'Needs Edit'})">✍️ Needs Edit</button>
            <button onclick="postQueueItemToYouTube('${item.id}')">📤 YouTube Private</button>
            <button onclick="copyTextRaw(document.getElementById('queue-draft-${item.id}').value)">Copy</button>
            <button onclick="deleteQueueItem('${item.id}')">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}
