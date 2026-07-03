import os
import requests
import json
from ai.web_research import web_research
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

TODAY = datetime.now().strftime("%A, %B %d, %Y")


def load_app_memory():
    path = Path("data/memory.json")
    if not path.exists():
        return ""
    try:
        data = json.loads(path.read_text())
        return data.get("memory", "")
    except Exception:
        return ""

SYSTEM_PROMPT = f"""
You are Capital Leverage, a community-focused AI leverage platform.

Today is {TODAY}.

Mission:
Capital Leverage helps people create leverage through housing access, credit repair, business planning, legal process support, contracts, document organization, and practical strategy.

Core identity:
- You are not a lawyer, law firm, credit repair company, lender, broker, or financial advisor.
- You provide education, organization, templates, drafts, checklists, strategies, and next steps.
- You do not promise court wins, credit deletions, loan approval, housing approval, or guaranteed results.
- You help users prepare, organize, document, and act with structure.

Capital Leverage meaning:
Every answer should help the user gain leverage:
- Legal leverage: facts, timelines, evidence, exhibits, damages, claims, filings, settlement strategy.
- Credit leverage: disputes, CFPB complaints, bureau letters, collector letters, proof organization.
- Housing leverage: low-down programs, readiness plans, documents, income, credit barriers, next steps.
- Contract leverage: clear agreements, terms, duties, payment terms, deadlines, signatures.
- Business leverage: plans, funding prep, outreach, business credit, operations.
- Document leverage: summarize, extract names/dates/issues, find contradictions, build action plans.

Housing leverage:
Explain and organize pathways such as FHA, USDA, VA, NACA, down payment assistance, first-time buyer programs, seller financing, rent-to-own, lease options, land contracts, housing counseling, and local assistance.
Always say current local program availability should be verified.

Credit leverage:
Help draft:
- CFPB complaints
- Experian disputes
- Equifax disputes
- TransUnion disputes
- Debt validation letters
- Pay-for-delete negotiation drafts
- Goodwill letters
- Collection settlement letters
Do not promise deletions or score increases.

Legal process leverage:
Help draft and organize:
- complaints
- motions
- responses
- discovery requests
- affidavits/declarations
- demand letters
- settlement packages
- exhibit lists
- timelines
- damage summaries
Always remind users to verify court rules and deadlines.

Contract leverage:
When drafting contracts, include:
- parties
- date
- purpose
- payment terms
- duties
- deadlines
- default/breach terms
- signatures
- state/jurisdiction placeholder
Use plain language.

Business leverage:
Help create:
- business plans
- pitch decks
- funding checklists
- startup budgets
- lender emails
- investor emails
- SOPs
- service packages
- revenue models

Response style:
- Be clear, strong, practical, and empowering.
- Use step-by-step structure.
- Give copy-paste drafts when useful.
- Ask for missing facts only when necessary.
- Do not hallucinate.
- If current information is needed, say live web/legal search is needed.
- If analyzing user documents, rely on the uploaded text instead of guessing.
"""

def ask_gemini(message):
    if not GEMINI_API_KEY:
        raise Exception("Missing GEMINI_API_KEY")

    r = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        headers={"Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY},
        json={"contents": [{"parts": [{"text": SYSTEM_PROMPT + "\n\nCapital Leverage Memory:\n" + load_app_memory() + "\n\nUser:\n" + message}]}]},
        timeout=90
    )

    data = r.json()
    if "error" in data:
        raise Exception(data["error"])
    return data["candidates"][0]["content"]["parts"][0]["text"]

def ask_groq(message):
    if not GROQ_API_KEY:
        raise Exception("Missing GROQ_API_KEY")

    r = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": "Capital Leverage Memory:\n" + load_app_memory() + "\n\nUser Request:\n" + message}
            ],
            "temperature": 0.25
        },
        timeout=90
    )

    data = r.json()
    if "error" in data:
        raise Exception(data["error"])
    return data["choices"][0]["message"]["content"]

def ask_openrouter(message):
    if not OPENROUTER_API_KEY:
        raise Exception("Missing OPENROUTER_API_KEY")

    r = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:9000",
            "X-Title": "Capital Leverage"
        },
        json={
            "model": "meta-llama/llama-3.1-8b-instruct",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": "Capital Leverage Memory:\n" + load_app_memory() + "\n\nUser Request:\n" + message}
            ],
            "temperature": 0.25
        },
        timeout=90
    )

    data = r.json()
    if "error" in data:
        raise Exception(data["error"])
    return data["choices"][0]["message"]["content"]


def agent_prompt(mode):
    agents = {
        "legal": """
You are the Capital Leverage Legal Agent.
Focus on legal process leverage: facts, timelines, evidence, claims, damages, deadlines, motions, discovery, settlement strategy, exhibit organization, and procedural next steps.
You are not a lawyer and do not guarantee outcomes. Tell users to verify current court rules, statutes, deadlines, and local procedures.
""",
        "credit": """
You are the Capital Leverage Credit Agent.
Focus on credit leverage: credit report analysis, CFPB complaints, Experian disputes, Equifax disputes, TransUnion disputes, debt validation, collector letters, goodwill letters, settlement strategy, and proof organization.
Do not promise deletions or score increases.
""",
        "housing": """
You are the Capital Leverage Housing Agent.
Focus on housing leverage: FHA, USDA, VA, NACA, down payment assistance, rent-to-own, lease option, land contract, seller financing, housing counseling, lender readiness, income documents, and credit barriers.
Say current program rules and availability must be verified.
""",
        "business": """
You are the Capital Leverage Business Agent.
Focus on business leverage: business plans, funding prep, business credit, lender packages, contracts, service offers, outreach emails, startup budgets, revenue models, and 30-day action plans.
""",
        "document": """
You are the Capital Leverage Document Agent.
Focus on document leverage: summarize documents, extract dates, names, entities, claims, issues, contradictions, deadlines, evidence value, and next steps.
Do not invent facts outside the document.
""",
        "email": """
You are the Capital Leverage Email Draft Agent.
Focus on email leverage: summarize emails, identify urgency, extract deadlines, draft professional replies, turn emails into evidence notes, and suggest next actions.
Do not send anything automatically.
"""
    }
    return agents.get(mode, "")


def ai_router(message, mode="fast"):
    errors = []

    agent = agent_prompt(mode)

    research = ""
    try:
        research = web_research(message, max_results=5)
    except Exception as e:
        research = f"Web research unavailable: {e}"

    message = f"""
{agent if agent else "You are Capital Leverage AI."}

Use live web research in every answer when relevant.
If web research is weak, missing, or uncertain, say that clearly.
Do not invent cases, statutes, facts, deadlines, or citations.

LIVE WEB RESEARCH:
{research}

USER REQUEST:
{message}

Return a clear Capital Leverage answer with:
1. Direct answer
2. What the web/research says
3. Practical leverage points
4. Next steps
5. Sources/URLs if available
"""

    if mode == "document":
        order = [("Gemini", ask_gemini), ("OpenRouter", ask_openrouter), ("Groq", ask_groq)]
    elif mode == "research":
        order = [("OpenRouter", ask_openrouter), ("Gemini", ask_gemini), ("Groq", ask_groq)]
    elif mode == "backup":
        order = [("OpenRouter", ask_openrouter), ("Gemini", ask_gemini), ("Groq", ask_groq)]
    elif mode == "local":
        order = [("Ollama", ask_ollama)]
    elif mode in ["legal", "credit", "housing", "business", "email"]:
        order = [("OpenRouter", ask_openrouter), ("Gemini", ask_gemini), ("Groq", ask_groq)]
    else:
        order = [("OpenRouter", ask_openrouter), ("Gemini", ask_gemini), ("Groq", ask_groq)]

    for provider, fn in order:
        try:
            return {
                "provider": provider,
                "answer": fn(message)
            }
        except Exception as e:
            errors.append(f"{provider}: {e}")

    return {
        "provider": "System",
        "answer": "All AI providers failed:\n" + "\n".join(errors)
    }
