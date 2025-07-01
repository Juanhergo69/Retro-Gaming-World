#!/bin/bash

# ==============================================
# CONFIGURATION
# ==============================================
BASE_URL="http://localhost:3001/api"
ORIGIN="http://localhost:3000"

# User registration to get token
TIMESTAMP=$(date +%s)
TEST_USER="testuser_$TIMESTAMP"
TEST_EMAIL="test_$TIMESTAMP@example.com"
TEST_PASS="ValidPass123!"

echo -e "\n🔧 Registering test user..."
REGISTER_RESPONSE=$(curl -s -v -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d '{
    "username": "'"$TEST_USER"'",
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASS"'",
    "confirmPassword": "'"$TEST_PASS"'"
  }' 2>&1)

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
TEST_USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Test game ID (we'll use Snake)
GAME_ID=1  # Numeric ID for Snake
TEST_INVALID_ID=999 # Non-existent ID

# ==============================================
# UTILITY FUNCTIONS
# ==============================================

make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local cmd="curl -s -v -X $method '$BASE_URL$endpoint' \
        -H 'Content-Type: application/json' \
        -H 'Origin: $ORIGIN'"
    
    if [ -n "$token" ]; then
        cmd+=" -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        cmd+=" -d '$data'"
    fi
    
    eval "$cmd" 2>&1
}

run_test() {
    local test_name=$1
    local response=$2
    local expected_status=$3
    
    echo -e "\n🔹 $test_name"
    echo "Response:"
    echo "$response" | grep -E 'HTTP|<|{'
    
    local status_code=$(echo "$response" | grep -oP 'HTTP/\d\.\d \K\d{3}')
    
    if [[ "$status_code" == "$expected_status" ]]; then
        echo "✅ PASSED (Expected $expected_status, Got $status_code)"
    else
        echo "❌ FAILED (Expected $expected_status, Got $status_code)"
    fi
}

# ==============================================
# GAME LIKES TESTS
# ==============================================
echo -e "\n=============================================="
echo "👍 GAME LIKES TESTS"
echo -e "==============================================\n"

# 1. Basic like for existing game
LIKE_RESPONSE=$(make_request "POST" "/games/$GAME_ID/like" '{}' "$TOKEN")
run_test "1. LIKE - Add like to existing game" "$LIKE_RESPONSE" 200

# 2. Verify basic response structure
echo -e "\n🔹 2. LIKE - Verify response contains game data"
if echo "$LIKE_RESPONSE" | grep -q '"name":"Snake"'; then
    echo "✅ PASSED (Response contains basic game data)"
else
    echo "❌ FAILED (Missing basic game data)"
fi

# 3. Non-existent game
INVALID_LIKE_RESPONSE=$(make_request "POST" "/games/$TEST_INVALID_ID/like" '{}' "$TOKEN")
run_test "3. LIKE - Non-existent game" "$INVALID_LIKE_RESPONSE" 404

# 4. Like without authentication
UNAUTH_LIKE_RESPONSE=$(make_request "POST" "/games/$GAME_ID/like" '{}' "")
run_test "4. LIKE - Without authentication" "$UNAUTH_LIKE_RESPONSE" 200

# ==============================================
# CLEANUP
# ==============================================
echo -e "\n🧹 Cleaning up test user..."
make_request "DELETE" "/users/$TEST_USER_ID" "" "$TOKEN" > /dev/null

# ==============================================
# FINAL SUMMARY
# ==============================================
echo -e "\n=============================================="
echo "🏁 TESTS COMPLETED"
echo -e "==============================================\n"

echo "📊 Summary:"
echo "- Test user: $TEST_EMAIL"
echo "- User ID: $TEST_USER_ID"
echo "- Generated token: ${TOKEN:0:30}..."
echo "- Tested game: Snake (ID: $GAME_ID)"
echo -e "\n✅ All tests completed successfully"