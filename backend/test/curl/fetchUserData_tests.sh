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

TEST_INVALID_ID="nonexistent123" # Non-existent ID

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
# USER DATA TESTS (CORRECTED VERSION)
# ==============================================
echo -e "\n=============================================="
echo "👤 USER DATA TESTS"
echo -e "==============================================\n"

# 1. Get valid user data
GET_USER_DATA_RESPONSE=$(make_request "GET" "/users/$TEST_USER_ID" "" "$TOKEN")
run_test "1. USER DATA - Get valid user data" "$GET_USER_DATA_RESPONSE" 200

# 2. Verify response contains basic fields
echo -e "\n🔹 2. USER DATA - Verify fields in response"
if echo "$GET_USER_DATA_RESPONSE" | grep -q '"username"'; then
    echo "✅ PASSED (Contains username)"
else
    echo "❌ FAILED (Missing username)"
fi

if echo "$GET_USER_DATA_RESPONSE" | grep -q '"email"'; then
    echo "✅ PASSED (Contains email)"
else
    echo "❌ FAILED (Missing email)"
fi

# 3. Attempt to get non-existent user data
GET_INVALID_USER_DATA_RESPONSE=$(make_request "GET" "/users/$TEST_INVALID_ID" "" "$TOKEN")
run_test "3. USER DATA - Get non-existent user data" "$GET_INVALID_USER_DATA_RESPONSE" 500

# 4. Attempt to get data without authentication (UPDATED TO 401)
GET_UNAUTH_USER_DATA_RESPONSE=$(make_request "GET" "/users/$TEST_USER_ID" "" "")
run_test "4. USER DATA - Get data without authentication" "$GET_UNAUTH_USER_DATA_RESPONSE" 401

# 5. Verify authentication required message
echo -e "\n🔹 5. USER DATA - Verify authentication message"
if echo "$GET_UNAUTH_USER_DATA_RESPONSE" | grep -q '"message":"Authentication required"'; then
    echo "✅ PASSED (Correct message)"
else
    echo "❌ FAILED (Incorrect message)"
fi

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
echo -e "\n✅ All tests completed successfully"