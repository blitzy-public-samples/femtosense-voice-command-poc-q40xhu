#!/bin/bash

# deploy.sh
# This script is responsible for automating the deployment process of the Femtosense Voice Command Generation PoC system
# to AWS infrastructure using Terraform and Docker.

# Set strict mode
set -euo pipefail

# Global variables
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ENVIRONMENT=${1:-dev}
TERRAFORM_DIR="${SCRIPT_DIR}/../terraform"
DOCKER_COMPOSE_FILE="${SCRIPT_DIR}/../docker-compose.yml"

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        echo "Error: terraform is not installed. Please install terraform and try again."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        echo "Error: docker is not installed. Please install docker and try again."
        exit 1
    fi
    
    # Check if aws-cli is installed
    if ! command -v aws &> /dev/null; then
        echo "Error: aws-cli is not installed. Please install aws-cli and try again."
        exit 1
    fi
    
    echo "All prerequisites are met."
}

# Function to run tests
run_tests() {
    echo "Running tests..."
    if ! "${SCRIPT_DIR}/test.sh"; then
        echo "Error: Tests failed. Aborting deployment."
        exit 1
    fi
    echo "All tests passed successfully."
}

# Function to build images
build_images() {
    echo "Building Docker images..."
    if ! "${SCRIPT_DIR}/build.sh"; then
        echo "Error: Docker image build failed. Aborting deployment."
        exit 1
    fi
    echo "Docker images built successfully."
}

# Function to deploy infrastructure
deploy_infrastructure() {
    local environment=$1
    echo "Deploying infrastructure for environment: ${environment}"
    
    cd "${TERRAFORM_DIR}"
    
    # Initialize terraform
    terraform init
    
    # Select or create terraform workspace for environment
    terraform workspace select "${environment}" || terraform workspace new "${environment}"
    
    # Apply terraform configuration with auto-approve
    terraform apply -auto-approve -var="environment=${environment}"
    
    echo "Infrastructure deployment completed."
}

# Main execution function
main() {
    echo "Starting deployment process for Femtosense Voice Command Generation PoC..."
    
    # Change to script directory
    cd "${SCRIPT_DIR}"
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests
    run_tests
    
    # Build images
    build_images
    
    # Deploy infrastructure
    deploy_infrastructure "${ENVIRONMENT}"
    
    # Deploy Docker containers
    echo "Deploying Docker containers..."
    docker-compose -f "${DOCKER_COMPOSE_FILE}" up -d
    
    echo "Deployment completed successfully!"
}

# Execute main function
main "$@"