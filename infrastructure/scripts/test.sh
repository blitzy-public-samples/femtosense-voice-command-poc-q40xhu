#!/bin/bash

# Test script for Femtosense Voice Command Generation PoC
# This script automates the testing process for all components, ensuring quality and reliability.

# Exit immediately if a command exits with a non-zero status
set -e

# Define color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Define the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Define the root directory of the project
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Define the test results directory
TEST_RESULTS_DIR="${PROJECT_ROOT}/test-results"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed or not in the system PATH.${NC}"
        exit 1
    fi
    
    # Check if pytest is installed
    if ! command -v pytest &> /dev/null; then
        echo -e "${RED}Error: pytest is not installed or not in the system PATH.${NC}"
        exit 1
    fi
    
    # Check if npm is installed (for API tests)
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed or not in the system PATH.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All prerequisites are met.${NC}"
}

# Function to run API tests
run_api_tests() {
    echo -e "${YELLOW}Running API tests...${NC}"
    cd "${PROJECT_ROOT}/src/api"
    npm install
    npm test -- --coverage
    mv coverage "${TEST_RESULTS_DIR}/api_coverage"
}

# Function to run backend tests
run_backend_tests() {
    echo -e "${YELLOW}Running backend tests...${NC}"
    cd "${PROJECT_ROOT}/src/backend"
    pytest tests/ --cov=src --cov-report=html:${TEST_RESULTS_DIR}/backend_coverage
}

# Function to run database tests
run_database_tests() {
    echo -e "${YELLOW}Running database tests...${NC}"
    cd "${PROJECT_ROOT}/src/database"
    pytest tests/ --cov=src --cov-report=html:${TEST_RESULTS_DIR}/database_coverage
}

# Function to run integration tests
run_integration_tests() {
    echo -e "${YELLOW}Running integration tests...${NC}"
    
    # Start services using docker-compose
    docker-compose -f "${PROJECT_ROOT}/infrastructure/docker-compose.yml" up -d
    
    # Wait for services to be ready (you might need to implement a more robust check)
    sleep 10
    
    # Run integration tests
    pytest "${PROJECT_ROOT}/tests/integration" --cov=src --cov-report=html:${TEST_RESULTS_DIR}/integration_coverage
    
    # Tear down docker-compose services
    docker-compose -f "${PROJECT_ROOT}/infrastructure/docker-compose.yml" down
}

# Function to run security tests
run_security_tests() {
    echo -e "${YELLOW}Running security tests...${NC}"
    
    # Run OWASP ZAP scan (assuming it's installed and in PATH)
    if command -v zap-cli &> /dev/null; then
        zap-cli quick-scan --self-contained --start-options "-config api.disablekey=true" http://localhost:3000
    else
        echo -e "${RED}Warning: OWASP ZAP is not installed. Skipping security scan.${NC}"
    fi
    
    # Run npm audit for API dependencies
    cd "${PROJECT_ROOT}/src/api"
    npm audit
    
    # Run safety check for Python dependencies
    safety check -r "${PROJECT_ROOT}/src/backend/requirements.txt"
    safety check -r "${PROJECT_ROOT}/src/database/requirements.txt"
}

# Main execution function
main() {
    echo -e "${GREEN}Starting test process for Femtosense Voice Command Generation PoC${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Create test results directory
    mkdir -p "${TEST_RESULTS_DIR}"
    
    # Run tests for each component
    run_api_tests
    run_backend_tests
    run_database_tests
    run_integration_tests
    run_security_tests
    
    echo -e "${GREEN}All tests completed successfully.${NC}"
    echo -e "${YELLOW}Test results and coverage reports are available in: ${TEST_RESULTS_DIR}${NC}"
}

# Run the main function
main

# Exit with success status
exit 0