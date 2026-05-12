#!/bin/bash

# Test FAB Hierarchy Check API endpoints

BASE_URL="http://localhost:8080"

echo "Testing FAB Hierarchy Check endpoints..."
echo "====================================="

# Test 1: Simple test endpoint
echo -e "\n1. Testing simple test endpoint:"
curl -s "$BASE_URL/api/fab/hierarchy/test" | jq .

# Test 2: Count test
echo -e "\n2. Testing count test:"
curl -s "$BASE_URL/api/fab/hierarchy/count-test" | jq .

# Test 3: Entity test
echo -e "\n3. Testing entity test:"
curl -s "$BASE_URL/api/fab/hierarchy/entity-test" | jq .

# Test 4: Simple JSON test
echo -e "\n4. Testing simple JSON test:"
curl -s "$BASE_URL/api/fab/hierarchy/simple-test" | jq .

# Test 5: Actual hierarchy check with sample data
echo -e "\n5. Testing hierarchy check with sample data (plant=2222, dept=SANJ):"
curl -s "$BASE_URL/api/fab/hierarchy/check?plantCode=2222&departmentCode=SANJ" | jq .

# Test 6: Hierarchy check with non-existent data
echo -e "\n6. Testing hierarchy check with non-existent data:"
curl -s "$BASE_URL/api/fab/hierarchy/check?plantCode=9999&departmentCode=TEST" | jq .

echo -e "\n====================================="
echo "Test completed."
