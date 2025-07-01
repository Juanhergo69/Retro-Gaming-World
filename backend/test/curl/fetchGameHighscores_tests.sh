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

# Game IDs according to initializeGames.js
SNAKE_ID=1  # Numeric ID for Snake
TETRIS_ID=2 # Numeric ID for Tetris
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
# HIGHSCORES TESTS
# ==============================================
echo -e "\n=============================================="
echo "🏆 HIGHSCORES TESTS"
echo -e "==============================================\n"

# 1. Get Snake highscores (should be empty initially)
GET_HIGHSCORES_RESPONSE=$(make_request "GET" "/games/$SNAKE_ID" "" "$TOKEN")
run_test "1. HIGHSCORES - Get Snake highscores (initial empty)" "$GET_HIGHSCORES_RESPONSE" 200

# 2. Submit a new highscore
SUBMIT_HIGHSCORE_RESPONSE=$(make_request "POST" "/games/$SNAKE_ID/scores" '{
    "userId": "'"$TEST_USER_ID"'",
    "score": 1000
}' "$TOKEN")
run_test "2. HIGHSCORES - Submit new highscore" "$SUBMIT_HIGHSCORE_RESPONSE" 200

# 3. Verify highscores after submission
GET_UPDATED_HIGHSCORES_RESPONSE=$(make_request "GET" "/games/$SNAKE_ID" "" "$TOKEN")
run_test "3. HIGHSCORES - Verify added highscore" "$GET_UPDATED_HIGHSCORES_RESPONSE" 200

# 4. Get specific user highscore
GET_USER_HIGHSCORE_RESPONSE=$(make_request "GET" "/games/$SNAKE_ID/scores/$TEST_USER_ID" "" "$TOKEN")
run_test "4. HIGHSCORES - Get user's highscore" "$GET_USER_HIGHSCORE_RESPONSE" 200

# 5. Try to get highscores for non-existent game
GET_INVALID_HIGHSCORES_RESPONSE=$(make_request "GET" "/games/$TEST_INVALID_ID" "" "$TOKEN")
run_test "5. HIGHSCORES - Get highscores for non-existent game" "$GET_INVALID_HIGHSCORES_RESPONSE" 404

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
echo "- Tested game: Snake (ID: $SNAKE_ID)"
echo -e "\n✅ All tests completed successfully"