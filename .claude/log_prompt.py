import sys, json, datetime, pathlib
data = json.load(sys.stdin)
prompt = data.get("prompt", "")
log = pathlib.Path(__file__).resolve().parent.parent / "PROMPTS_VERBATIM.md"
with log.open("a", encoding="utf-8") as f:
    f.write(f"\n### {datetime.datetime.now():%Y-%m-%d %H:%M} — Claude Code\n```\n{prompt}\n```\n")
