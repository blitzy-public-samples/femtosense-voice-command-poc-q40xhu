# IAM Module for Femtosense Voice Command Generation PoC

# Requirements addressed:
# - Access Management (6.1 AUTHENTICATION AND AUTHORIZATION)
# - Security Implementation (6.1 AUTHENTICATION AND AUTHORIZATION/Authorization Matrix)
# - Lambda Execution (5.2 CLOUD SERVICES)
# - S3 Access Control (6.2 DATA SECURITY)

# Import required providers
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

# Define local variables
locals {
  project_name = var.project_name
  environment  = var.environment
}

# IAM role for Lambda function execution
resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.project_name}-${local.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${local.project_name}-lambda-role"
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}

# S3 access policy for Lambda
resource "aws_iam_policy" "s3_access_policy" {
  name = "${local.project_name}-${local.environment}-s3-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${var.s3_bucket_arn}",
          "${var.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

# CloudWatch logs policy for Lambda
resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name = "${local.project_name}-${local.environment}-cloudwatch-logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# VPC access policy for Lambda
resource "aws_iam_policy" "vpc_access_policy" {
  name = "${local.project_name}-${local.environment}-vpc-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach S3 access policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_s3" {
  policy_arn = aws_iam_policy.s3_access_policy.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# Attach CloudWatch logs policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_cloudwatch" {
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# Attach VPC access policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  policy_arn = aws_iam_policy.vpc_access_policy.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# Optional cross-account access role
resource "aws_iam_role" "cross_account_role" {
  count = var.enable_cross_account_access ? 1 : 0

  name = "${local.project_name}-${local.environment}-cross-account"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.trusted_account_id
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = var.external_id
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${local.project_name}-cross-account"
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}

# Outputs
output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution IAM role"
  value       = aws_iam_role.lambda_execution_role.arn
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account IAM role"
  value       = var.enable_cross_account_access ? aws_iam_role.cross_account_role[0].arn : null
}