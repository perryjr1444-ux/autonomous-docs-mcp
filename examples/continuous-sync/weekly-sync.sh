#!/bin/bash
# Weekly documentation sync check

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel)"

# Load environment
if [ -f "$REPO_ROOT/.env" ]; then
  source "$REPO_ROOT/.env"
fi

# Configuration
DOCS_PATH="${DOCS_PATH:-$REPO_ROOT/docs}"
SOURCE_PATH="${SOURCE_PATH:-$REPO_ROOT/src}"
REPORT_PATH="${REPORT_PATH:-$REPO_ROOT/reports/sync-$(date +%Y-%m-%d).json}"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting documentation sync check..."

# Create reports directory
mkdir -p "$(dirname "$REPORT_PATH")"

# Run sync check
node "$SCRIPT_DIR/sync-checker.js" \
  --docs "$DOCS_PATH" \
  --source "$SOURCE_PATH" \
  --output "$REPORT_PATH"

SYNC_STATUS=$?

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync check complete. Status: $SYNC_STATUS"

# Send notification if configured
if [ -n "$SLACK_WEBHOOK" ] && [ $SYNC_STATUS -ne 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sending Slack notification..."
  node "$SCRIPT_DIR/notify-slack.js" --report "$REPORT_PATH"
fi

# Email notification (optional)
if [ -n "$EMAIL_TO" ] && [ $SYNC_STATUS -ne 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sending email notification..."
  
  SUBJECT="Documentation Sync Alert - $(date +%Y-%m-%d)"
  BODY="Documentation sync check found issues. See attached report."
  
  echo "$BODY" | mail -s "$SUBJECT" -A "$REPORT_PATH" "$EMAIL_TO"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync check workflow complete"

exit $SYNC_STATUS
