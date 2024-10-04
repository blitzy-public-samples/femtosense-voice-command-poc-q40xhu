# Output values for the AWS Lambda module in the Femtosense Voice Command Generation PoC system

# The ARN of the Lambda function
output "function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.voice_command_processor.arn
}

# The name of the Lambda function
output "function_name" {
  description = "The name of the Lambda function"
  value       = aws_lambda_function.voice_command_processor.function_name
}

# The invoke ARN of the Lambda function
output "function_invoke_arn" {
  description = "The invoke ARN of the Lambda function"
  value       = aws_lambda_function.voice_command_processor.invoke_arn
}

# The ARN of the Lambda execution role
output "execution_role_arn" {
  description = "The ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

# The name of the Lambda execution role
output "execution_role_name" {
  description = "The name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.name
}

# Additional output for CloudWatch log group
output "cloudwatch_log_group_name" {
  description = "The name of the CloudWatch Log Group for the Lambda function"
  value       = aws_cloudwatch_log_group.lambda_log_group.name
}

# Output for the Lambda function's version
output "function_version" {
  description = "The version of the Lambda function"
  value       = aws_lambda_function.voice_command_processor.version
}

# Output for the Lambda function's last modified date
output "last_modified" {
  description = "The date this resource was last modified"
  value       = aws_lambda_function.voice_command_processor.last_modified
}

# Output for the Lambda function's source code hash
output "source_code_hash" {
  description = "Base64-encoded representation of the Lambda function's deployment package hash"
  value       = aws_lambda_function.voice_command_processor.source_code_hash
}

# Output for the Lambda function's qualified ARN
output "qualified_arn" {
  description = "The qualified ARN of the Lambda function"
  value       = aws_lambda_function.voice_command_processor.qualified_arn
}