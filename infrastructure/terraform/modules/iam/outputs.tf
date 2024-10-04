# Outputs for IAM Module
# Requirements addressed:
# - Access Management (6.1 AUTHENTICATION AND AUTHORIZATION)
# - Lambda Integration (5.2 CLOUD SERVICES)
# - Cross-Module Communication (3.3 COMPONENT DIAGRAMS)

# Output the ARN of the IAM role created for Lambda function execution
output "lambda_execution_role_arn" {
  description = "The ARN of the IAM role created for Lambda function execution"
  value       = aws_iam_role.lambda_execution_role.arn
}

# Output the name of the IAM role created for Lambda function execution
output "lambda_execution_role_name" {
  description = "The name of the IAM role created for Lambda function execution"
  value       = aws_iam_role.lambda_execution_role.name
}

# Output the ARN of the IAM policy for S3 access
output "s3_access_policy_arn" {
  description = "The ARN of the IAM policy for S3 access"
  value       = aws_iam_policy.s3_access_policy.arn
}

# Output the ARN of the IAM policy for CloudWatch Logs access
output "cloudwatch_logs_policy_arn" {
  description = "The ARN of the IAM policy for CloudWatch Logs access"
  value       = aws_iam_policy.cloudwatch_logs_policy.arn
}

# Output the ARN of the IAM policy for VPC access
output "vpc_access_policy_arn" {
  description = "The ARN of the IAM policy for VPC access"
  value       = aws_iam_policy.vpc_access_policy.arn
}

# Output the ARN of the cross-account IAM role, if created
output "cross_account_role_arn" {
  description = "The ARN of the cross-account IAM role, if created"
  value       = var.enable_cross_account_access ? aws_iam_role.cross_account_role[0].arn : null
}

# Output usage example for Lambda module
output "lambda_role_usage_example" {
  description = "Example of how to use the Lambda execution role in other modules"
  value       = <<EOF
module "lambda" {
  source = "../lambda"
  
  execution_role_arn = module.iam.lambda_execution_role_arn
}
EOF
}