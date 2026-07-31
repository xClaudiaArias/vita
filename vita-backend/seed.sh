#!/bin/bash
# Seeds the vita database with test data: a user, a resume, a job posting,
# and an application linking them together. Run from inside vita-backend/.

set -e

echo "Creating test user..."
USER_ID=$(psql vita -U postgres -t -A -c \
  "INSERT INTO users (email, password_hash, name) VALUES ('jamie@example.com', 'placeholder_hash', 'Jamie Alvarez') RETURNING id;" \
  | head -n 1 | tr -d '[:space:]')
echo "  user_id: $USER_ID"

echo "Creating test resume..."
RESUME_RESPONSE=$(curl -s -X POST http://localhost:4000/resumes \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"label\": \"Product Design\",
    \"sections\": [
      { \"type\": \"summary\", \"bullets\": [\"Product designer with 6 years leading 0-to-1 product strategy.\"] },
      { \"type\": \"experience\", \"bullets\": [\"Led design for a new internal tool from concept to launch.\"] }
    ]
  }")
RESUME_ID=$(echo "$RESUME_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$RESUME_ID" ]; then
  echo "  FAILED. Raw response was:"
  echo "$RESUME_RESPONSE"
  exit 1
fi
echo "  resume_id: $RESUME_ID"

echo "Creating test job posting..."
JOB_RESPONSE=$(curl -s -X POST http://localhost:4000/job-postings \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Notion",
    "role_title": "Senior Product Designer",
    "raw_description": "We are looking for a senior product designer with 0-to-1 experience and strong design systems background."
  }')
JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "  FAILED. Raw response was:"
  echo "$JOB_RESPONSE"
  exit 1
fi
echo "  job_posting_id: $JOB_ID"

echo "Creating test application..."
APP_RESPONSE=$(curl -s -X POST http://localhost:4000/applications \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"job_posting_id\": \"$JOB_ID\",
    \"resume_id\": \"$RESUME_ID\",
    \"status\": \"applied\"
  }")
echo "  application: $APP_RESPONSE"

echo ""
echo "Done. Save these for testing:"
echo "  user_id:        $USER_ID"
echo "  resume_id:      $RESUME_ID"
echo "  job_posting_id: $JOB_ID"