import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

TODAY = datetime.now().strftime("%A, %B %d, %Y")

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
        json={"contents": [{"parts": [{"text": SYSTEM_PROMPT + "\n\nUser:\n" + message}]}]},
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
                {"role": "user", "content": message}
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
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            "temperature": 0.25
        },
        timeout=90
    )

    data = r.json()
    if "error" in data:
        raise Exception(data["error"])
    return data["choices"][0]["message"]["content"]

def ai_router(message, mode="fast"):
    errors = []

    if mode == "document":
        order = [("Gemini", ask_gemini), ("Groq", ask_groq), ("OpenRouter", ask_openrouter)]
    elif mode == "backup":
        order = [("OpenRouter", ask_openrouter), ("Gemini", ask_gemini), ("Groq", ask_groq)]
    else:
        order = [("Groq", ask_groq), ("Gemini", ask_gemini), ("OpenRouter", ask_openrouter)]

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
