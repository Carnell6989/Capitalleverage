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
