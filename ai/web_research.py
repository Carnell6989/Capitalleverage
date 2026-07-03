import os
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv(".env", override=True)

def web_research(query, max_results=5):
    key = os.getenv("TAVILY_API_KEY")
    if not key:
        return "TAVILY_API_KEY is missing."

    client = TavilyClient(api_key=key)
    res = client.search(query, max_results=max_results)

    results = res.get("results", [])
    if not results:
        return "No web results found."

    lines = []
    for i, r in enumerate(results, 1):
        lines.append(f"{i}. {r.get('title','No title')}")
        lines.append(f"URL: {r.get('url','')}")
        lines.append(f"Summary: {r.get('content','')}")
        lines.append("")

    return "\n".join(lines)
