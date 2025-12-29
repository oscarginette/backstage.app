#!/bin/bash

###############################################################################
# Rate Limiting Test Script
#
# Tests the rate limiting middleware implementation.
#
# Usage:
#   ./scripts/test-rate-limit.sh [endpoint] [count]
#
# Examples:
#   ./scripts/test-rate-limit.sh                      # Test default (60 req)
#   ./scripts/test-rate-limit.sh /api/auth/signup 6   # Test auth (5 req)
#   ./scripts/test-rate-limit.sh /api/contacts 61     # Test contacts
###############################################################################

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3002}"
ENDPOINT="${1:-/api/contacts}"
COUNT="${2:-61}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Rate Limiting Test"
echo "═══════════════════════════════════════════════════════════════"
echo "  Base URL: $BASE_URL"
echo "  Endpoint: $ENDPOINT"
echo "  Requests: $COUNT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if server is running
echo -e "${BLUE}Checking if server is running...${NC}"
if ! curl -s -f "$BASE_URL/api/pricing" > /dev/null 2>&1; then
    echo -e "${RED}✗ Server not responding at $BASE_URL${NC}"
    echo "  Please start the development server:"
    echo "    npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Statistics
SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0
ERROR_COUNT=0

# Run tests
echo -e "${BLUE}Sending $COUNT requests to $ENDPOINT...${NC}"
echo ""

for i in $(seq 1 "$COUNT"); do
    # Make request and capture headers + status
    RESPONSE=$(curl -s -w "\n%{http_code}\n%{header_json}" "$BASE_URL$ENDPOINT" 2>/dev/null)

    # Extract status code (second-to-last line)
    STATUS=$(echo "$RESPONSE" | tail -2 | head -1)

    # Extract headers (last line)
    HEADERS=$(echo "$RESPONSE" | tail -1)

    # Parse rate limit headers
    LIMIT=$(echo "$HEADERS" | grep -o '"x-ratelimit-limit":"[^"]*"' | cut -d'"' -f4)
    REMAINING=$(echo "$HEADERS" | grep -o '"x-ratelimit-remaining":"[^"]*"' | cut -d'"' -f4)
    RESET=$(echo "$HEADERS" | grep -o '"x-ratelimit-reset":"[^"]*"' | cut -d'"' -f4)
    RETRY_AFTER=$(echo "$HEADERS" | grep -o '"retry-after":"[^"]*"' | cut -d'"' -f4)

    # Determine result
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "400" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        printf "${GREEN}✓${NC} Request %3d: %s (Remaining: %s/%s)\n" "$i" "$STATUS" "$REMAINING" "$LIMIT"
    elif [ "$STATUS" = "429" ]; then
        RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
        printf "${YELLOW}⚠${NC} Request %3d: %s ${RED}RATE LIMITED${NC} (Retry-After: %ss)\n" "$i" "$STATUS" "$RETRY_AFTER"
    else
        ERROR_COUNT=$((ERROR_COUNT + 1))
        printf "${RED}✗${NC} Request %3d: %s (Error)\n" "$i" "$STATUS"
    fi

    # Small delay to avoid overwhelming the server
    sleep 0.05
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Results"
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}Successful:${NC}    $SUCCESS_COUNT"
echo -e "  ${YELLOW}Rate Limited:${NC}  $RATE_LIMITED_COUNT"
echo -e "  ${RED}Errors:${NC}        $ERROR_COUNT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Determine test outcome
if [ "$RATE_LIMITED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Rate limiting is working!${NC}"
    echo ""

    if [ -n "$LIMIT" ]; then
        echo "Rate limit details:"
        echo "  - Limit: $LIMIT requests"
        echo "  - Reset: $(date -r "$RESET" 2>/dev/null || echo "$RESET")"
        echo ""
    fi

    exit 0
else
    if [ "$SUCCESS_COUNT" -eq "$COUNT" ]; then
        echo -e "${YELLOW}⚠ Warning: Rate limiting may not be enabled${NC}"
        echo ""
        echo "Possible reasons:"
        echo "  1. UPSTASH_REDIS_REST_URL not set in .env.local"
        echo "  2. UPSTASH_REDIS_REST_TOKEN not set in .env.local"
        echo "  3. Request count ($COUNT) is below the rate limit"
        echo ""
        echo "Check the console for this warning:"
        echo '  "⚠️  Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set"'
        echo ""
        exit 1
    else
        echo -e "${RED}✗ Test failed with errors${NC}"
        exit 1
    fi
fi
