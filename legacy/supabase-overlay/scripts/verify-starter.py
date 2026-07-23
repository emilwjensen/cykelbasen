#!/usr/bin/env python3
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
required = [
    'AGENTS.md',
    'docs/PRODUCT_BRIEF.md',
    'docs/MVP_SCOPE.md',
    'docs/DATA_MODEL.md',
    'neon/migrations/202607230001_initial_marketplace.sql',
]

errors = []
for rel in required:
    if not (root / rel).exists():
        errors.append(f'Missing required file: {rel}')

skill_root = root / '.agents' / 'skills'
for skill_file in sorted(skill_root.glob('*/SKILL.md')):
    text = skill_file.read_text()
    match = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not match:
        errors.append(f'Missing YAML frontmatter: {skill_file}')
        continue
    frontmatter = match.group(1)
    name_match = re.search(r'^name:\s*(.+)$', frontmatter, re.M)
    desc_match = re.search(r'^description:\s*(.+)$', frontmatter, re.M)
    if not name_match or not desc_match:
        errors.append(f'Missing name or description: {skill_file}')
        continue
    name = name_match.group(1).strip()
    if name != skill_file.parent.name:
        errors.append(f'Skill name mismatch: {skill_file.parent.name} != {name}')
    if not re.fullmatch(r'[a-z0-9-]{1,64}', name):
        errors.append(f'Invalid skill name: {name}')

migration = (root / 'neon/migrations/202607230001_initial_marketplace.sql').read_text()
for marker in ['enable row level security', 'ownership-documents', 'listing-images', 'enforce_listing_publication']:
    if marker not in migration:
        errors.append(f'Migration missing marker: {marker}')

if errors:
    print('\n'.join(errors))
    sys.exit(1)

print(f'Validated {len(list(skill_root.glob("*/SKILL.md")))} skills and starter structure.')
