#!/usr/bin/env python3
"""Prints the usage of a claude-code-action run as Markdown, for the job summary.

Reads the execution file the action leaves on the runner (its `execution_file`
output, passed in EXECUTION_FILE): turns, duration, tokens, the cost at API
prices, and any tool calls that were denied (worth adding to --allowedTools in
claude.yml if the agent needed them). Never fails the job."""
import json
import os
import sys


def out(line=''):
    print(line)


path = os.environ.get('EXECUTION_FILE', '')
try:
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
except (OSError, ValueError) as e:
    out(f'### Claude usage\n\nNot available: could not read the execution file ({e}).')
    sys.exit(0)

messages = data if isinstance(data, list) else [data]
result = next((m for m in reversed(messages) if isinstance(m, dict) and m.get('type') == 'result'), None)
if not result:
    out('### Claude usage\n\nNot available: the run ended without a result.')
    sys.exit(0)

usage = result.get('usage') or {}
cost = result.get('total_cost_usd')
rows = [
    ('Outcome', result.get('subtype')),
    ('Turns', result.get('num_turns')),
    ('Duration', f"{result['duration_ms'] / 1000:.0f} s" if result.get('duration_ms') else None),
    ('Input tokens', usage.get('input_tokens')),
    ('Cache write tokens', usage.get('cache_creation_input_tokens')),
    ('Cache read tokens', usage.get('cache_read_input_tokens')),
    ('Output tokens', usage.get('output_tokens')),
    ('Cost at API prices', f'${cost:.2f}' if isinstance(cost, (int, float)) else None),
]

out('### Claude usage')
out()
out('| | |')
out('|---|---|')
for label, value in rows:
    if value is not None:
        out(f'| {label} | {value:,} |' if isinstance(value, int) else f'| {label} | {value} |')
out()

# per model, when the run used more than one (e.g. a smaller model for subtasks)
models = {name: m for name, m in (result.get('modelUsage') or {}).items()
          if isinstance(m, dict) and 'outputTokens' in m}
if len(models) > 1:
    out('| Model | Input | Cache read | Output | Cost |')
    out('|---|---:|---:|---:|---:|')
    for name, m in models.items():
        out(f"| {name} | {m.get('inputTokens', 0):,} | {m.get('cacheReadInputTokens', 0):,} "
            f"| {m.get('outputTokens', 0):,} | ${m.get('costUSD', 0):.2f} |")
    out()

denials = result.get('permission_denials') or []
if denials:
    out(f'**Denied tool calls ({len(denials)})**, not in `--allowedTools`:')
    out()
    for d in denials:
        tool = d.get('tool_name', '?')
        inp = d.get('tool_input') or {}
        detail = inp.get('command') or inp.get('file_path') or inp.get('url') or ''
        detail = ' '.join(str(detail).split())[:160].replace('`', "'")
        out(f'- `{tool}`' + (f': `{detail}`' if detail else ''))
    out()

out('With `CLAUDE_CODE_OAUTH_TOKEN` this is not billed per token: it counts toward the usage '
    'limits of the subscription that created the token (claude.ai → Settings → Usage).')
