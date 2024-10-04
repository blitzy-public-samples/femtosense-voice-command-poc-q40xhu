# This file defines the output values for the Terraform configuration of the Femtosense Voice Command Generation PoC system.
# It makes important resource information available for reference and use by other parts of the infrastructure.

# S3 Outputs
# Requirement: Scalable Data Management (1.1 SYSTEM OBJECTIVES/3. Scalable Data Management)
# Expose S3 bucket information for data access
output "s3_bucket_name" {
  description = "The name of the S3 bucket created for audio file storage"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = module.s3.bucket_arn
}

# Lambda Outputs
# Requirement: Cloud Infrastructure (5.1 DEPLOYMENT ENVIRONMENT)
# Provide resource identifiers for cross-module reference
output "lambda_function_name" {
  description = "The name of the Lambda function created for audio processing"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = module.lambda.function_arn
}

# IAM Outputs
# Requirement: Security Implementation (6.1 AUTHENTICATION AND AUTHORIZATION)
# Output IAM role ARNs for secure access configuration
output "lambda_execution_role_arn" {
  description = "The ARN of the IAM role used by the Lambda function"
  value       = module.iam.lambda_role_arn
}

output "lambda_execution_role_name" {
  description = "The name of the IAM role used by the Lambda function"
  value       = module.iam.lambda_role_name
}

# Sensitive Outputs
# These outputs contain sensitive information and are marked as sensitive to prevent accidental exposure
output "sensitive_config" {
  description = "Sensitive configuration values"
  value = {
    bucket_name = module.s3.bucket_name
    role_arn    = module.iam.lambda_role_arn
  }
  sensitive = true
}

# Conditional Outputs
# These outputs are only generated in non-production environments to aid in debugging
output "debug_info" {
  description = "Debugging information, only output in non-production environments"
  value = var.environment != "prod" ? {
    bucket_region = module.s3.bucket_region
    lambda_logs   = module.lambda.cloudwatch_log_group
  } : null
}

# Note: This output configuration provides essential information for other parts of the infrastructure
# while maintaining security by marking sensitive data appropriately. It also includes conditional
# outputs to support debugging in non-production environments.