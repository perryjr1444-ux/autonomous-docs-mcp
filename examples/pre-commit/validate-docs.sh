#!/bin/bash
# Validate documentation files

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Get staged doc files
DOCS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(md|mdx)$' || true)

if [ -z "$DOCS" ]; then
  exit 0
fi

echo "Validating documentation files..."

for file in $DOCS; do
  if [ ! -f "$file" ]; then
    continue
  fi

  echo "  Checking $file..."

  # Check for frontmatter
  if ! head -n 1 "$file" | grep -q "^---$"; then
    echo -e "    ${RED}✗${NC} Missing frontmatter"
    ((ERRORS++))
  else
    # Check for required fields
    if ! grep -q "^title:" "$file"; then
      echo -e "    ${RED}✗${NC} Missing required field: title"
      ((ERRORS++))
    fi
    
    if ! grep -q "^description:" "$file"; then
      echo -e "    ${YELLOW}!${NC} Missing recommended field: description"
      ((WARNINGS++))
    fi
  fi

  # Check for broken internal links
  while IFS= read -r link; do
    target=$(echo "$link" | sed -n 's/.*](\([^)]*\)).*/\1/p')
    
    if [[ "$target" =~ ^/ ]] || [[ ! "$target" =~ :// ]]; then
      # Internal link
      target_file="docs/$target"
      if [ ! -f "$target_file" ] && [ ! -f "${target_file}.mdx" ] && [ ! -f "${target_file}.md" ]; then
        echo -e "    ${RED}✗${NC} Broken link: $target"
        ((ERRORS++))
      fi
    fi
  done < <(grep -o '\[.*\](.*)'  "$file" || true)

  # Check code blocks have language
  if grep -q '```$' "$file"; then
    echo -e "    ${YELLOW}!${NC} Code block without language specifier"
    ((WARNINGS++))
  fi

  # Check for hardcoded localhost URLs
  if grep -q 'http://localhost\|https://localhost' "$file"; then
    echo -e "    ${YELLOW}!${NC} Contains localhost URL"
    ((WARNINGS++))
  fi
done

echo ""
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}! Found $WARNINGS warning(s)${NC}"
fi

echo -e "${GREEN}✓ Validation passed${NC}"
exit 0
