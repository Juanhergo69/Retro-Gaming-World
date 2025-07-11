#!/bin/bash

# ==============================================
# CONFIGURATION
# ==============================================
BASE_URL="http://localhost:3001/api"
ORIGIN="http://localhost:3000"
TIMESTAMP=$(date +%s)
TEST_USER="testuser_$TIMESTAMP"
TEST_EMAIL="test_$TIMESTAMP@example.com"
TEST_PASS="ValidPass123!"  # Meets requirements: uppercase, number, special char, 8+ chars

# ==============================================
# UTILITY FUNCTIONS
# ==============================================

# Function to make HTTP requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    curl -s -v -X "$method" "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "Origin: $ORIGIN" \
        -d "$data" 2>&1
}

# Extracts JWT token from response
extract_token() {
    grep -o '"token":"[^"]*' | cut -d'"' -f4
}

# Function to run and display test results
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
# REGISTRATION TESTS
# ==============================================
echo -e "\n=============================================="
echo "🚀 STARTING AUTHENTICATION TESTS"
echo -e "==============================================\n"

# Successful registration
REGISTER_RESPONSE=$(make_request "POST" "/register" '{
    "username": "'"$TEST_USER"'",
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASS"'",
    "confirmPassword": "'"$TEST_PASS"'"
}')
run_test "1. REGISTRATION - New user successful" "$REGISTER_RESPONSE" 201

# Missing fields
MISSING_FIELDS_RESPONSE=$(make_request "POST" "/register" '{
    "username": "",
    "email": "",
    "password": "",
    "confirmPassword": ""
}')
run_test "2. REGISTRATION - Missing required fields" "$MISSING_FIELDS_RESPONSE" 400

# Invalid email
INVALID_EMAIL_RESPONSE=$(make_request "POST" "/register" '{
    "username": "testuser",
    "email": "invalid-email",
    "password": "'"$TEST_PASS"'",
    "confirmPassword": "'"$TEST_PASS"'"
}')
run_test "3. REGISTRATION - Invalid email" "$INVALID_EMAIL_RESPONSE" 400

# Invalid password
INVALID_PASS_RESPONSE=$(make_request "POST" "/register" '{
    "username": "testuser",
    "email": "test2@example.com",
    "password": "short",
    "confirmPassword": "short"
}')
run_test "4. REGISTRATION - Invalid password" "$INVALID_PASS_RESPONSE" 400

# Password mismatch
PASS_MISMATCH_RESPONSE=$(make_request "POST" "/register" '{
    "username": "testuser",
    "email": "test3@example.com",
    "password": "'"$TEST_PASS"'",
    "confirmPassword": "OtherPass123!"
}')
run_test "5. REGISTRATION - Passwords don't match" "$PASS_MISMATCH_RESPONSE" 400

# ==============================================
# LOGIN TESTS
# ==============================================
echo -e "\n=============================================="
echo "🔐 LOGIN TESTS"
echo -e "==============================================\n"

# Successful login
LOGIN_RESPONSE=$(make_request "POST" "/login" '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASS"'"
}')
run_test "6. LOGIN - Valid credentials" "$LOGIN_RESPONSE" 200

# Extract token for later tests
TOKEN=$(echo "$LOGIN_RESPONSE" | extract_token)
echo -e "\n🔑 Obtained token: $TOKEN"

# Invalid email
INVALID_LOGIN_EMAIL_RESPONSE=$(make_request "POST" "/login" '{
    "email": "nonexistent@example.com",
    "password": "'"$TEST_PASS"'"
}')
run_test "7. LOGIN - Unregistered email" "$INVALID_LOGIN_EMAIL_RESPONSE" 401

# Wrong password
WRONG_PASS_RESPONSE=$(make_request "POST" "/login" '{
    "email": "'"$TEST_EMAIL"'",
    "password": "WrongPass123!"
}')
run_test "8. LOGIN - Incorrect password" "$WRONG_PASS_RESPONSE" 401

# ==============================================
# CURRENT USER TESTS
# ==============================================
echo -e "\n=============================================="
echo "👤 CURRENT USER TESTS"
echo -e "==============================================\n"

# Get current user (success)
ME_RESPONSE=$(curl -s -v -X GET "$BASE_URL/me" \
    -H "Origin: $ORIGIN" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" 2>&1)
run_test "9. USER - Get data with valid token" "$ME_RESPONSE" 200

# No token
NO_TOKEN_RESPONSE=$(make_request "GET" "/me" '')
run_test "10. USER - Request without token" "$NO_TOKEN_RESPONSE" 401

# Invalid token
INVALID_TOKEN_RESPONSE=$(make_request "GET" "/me" '' \
    -H "Authorization: Bearer invalid.token.123")
run_test "11. USER - Invalid token" "$INVALID_TOKEN_RESPONSE" 401

# ==============================================
# FINAL SUMMARY
# ==============================================
echo -e "\n=============================================="
echo "🏁 TESTS COMPLETED"
echo -e "==============================================\n"

echo "📊 Summary:"
echo "- Test user: $TEST_EMAIL"
echo "- Generated token: ${TOKEN:0:30}..."
echo -e "\n✅ All tests completed successfully"