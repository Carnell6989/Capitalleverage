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
