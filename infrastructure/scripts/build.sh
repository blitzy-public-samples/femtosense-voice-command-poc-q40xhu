#!/bin/bash

# Build script for Femtosense Voice Command Generation PoC
# This script automates the build process for Docker images and other necessary build steps.

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

# Define the build number (use 'latest' if not provided)
BUILD_NUMBER=${BUILD_NUMBER:-latest}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed or not in the system PATH.${NC}"
        exit 1
    fi
}

# Function to check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed or not in the system PATH.${NC}"
        exit 1
    fi
}

# Function to build Docker images
build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose -f "$PROJECT_ROOT/infrastructure/docker-compose.yml" build --no-cache
}

# Function to tag Docker images
tag_images() {
    echo -e "${YELLOW}Tagging Docker images...${NC}"
    docker tag femtosense_api:latest femtosense_api:$BUILD_NUMBER
    docker tag femtosense_backend:latest femtosense_backend:$BUILD_NUMBER
    docker tag femtosense_database:latest femtosense_database:$BUILD_NUMBER
}

# Main execution
main() {
    echo -e "${GREEN}Starting build process for Femtosense Voice Command Generation PoC${NC}"
    
    # Check for Docker and Docker Compose
    check_docker
    check_docker_compose
    
    # Build images
    build_images
    
    # Tag images
    tag_images
    
    echo -e "${GREEN}Build process completed successfully.${NC}"
}

# Run the main function
main

# Exit with success status
exit 0