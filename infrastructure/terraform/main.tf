# Primary Terraform configuration file for provisioning and managing AWS infrastructure resources
# required for the Femtosense Voice Command Generation PoC system.

# Provider configuration
provider "aws" {
  region = var.aws_region
}

# Random provider for generating unique identifiers
provider "random" {}

# S3 module for audio file storage
module "s3" {
  source      = "./modules/s3"
  bucket_name = "${var.project_name}-${var.environment}-audio-files"
  environment = var.environment
}

# Lambda module for serverless processing
module "lambda" {
  source        = "./modules/lambda"
  function_name = "${var.project_name}-${var.environment}-processor"
  environment   = var.environment
  s3_bucket_arn = module.s3.bucket_arn
}

# IAM module for resource access management
module "iam" {
  source             = "./modules/iam"
  project_name       = var.project_name
  environment        = var.environment
  s3_bucket_arn      = module.s3.bucket_arn
  lambda_function_arn = module.lambda.function_arn
}

# Local variables
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Terraform backend configuration for state management
terraform {
  backend "s3" {
    bucket = "femtosense-terraform-state"
    key    = "voice-command-poc/terraform.tfstate"
    region = "us-west-2"
  }
}

# Output values
output "s3_bucket_name" {
  value       = module.s3.bucket_name
  description = "Name of the S3 bucket created for audio file storage"
}

output "lambda_function_name" {
  value       = module.lambda.function_name
  description = "Name of the Lambda function created for processing"
}

output "iam_role_arn" {
  value       = module.iam.role_arn
  description = "ARN of the IAM role created for resource access"
}