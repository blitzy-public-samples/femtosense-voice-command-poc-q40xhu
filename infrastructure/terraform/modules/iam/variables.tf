# IAM Module Variables
# This file defines input variables for the IAM module in the Terraform configuration
# for the Femtosense Voice Command Generation PoC system.

# Project Identification Variables
variable "project_name" {
  type        = string
  description = "The name of the project, used for naming IAM resources"
}

variable "environment" {
  type        = string
  description = "The deployment environment (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Resource Reference Variables
variable "s3_bucket_arn" {
  type        = string
  description = "The ARN of the S3 bucket to be accessed by IAM roles"
}

# IAM Configuration Variables
variable "enable_cross_account_access" {
  type        = bool
  default     = false
  description = "Whether to create a role for cross-account access"
}

variable "trusted_account_ids" {
  type        = list(string)
  default     = []
  description = "List of AWS account IDs trusted for cross-account access"
}

variable "lambda_vpc_config" {
  type        = bool
  default     = true
  description = "Whether Lambda functions require VPC access"
}

# Tags
variable "tags" {
  type        = map(string)
  description = "Tags to be applied to IAM resources"
}

# Additional variables for enhanced security and compliance
variable "enable_mfa_delete" {
  type        = bool
  default     = false
  description = "Enable MFA delete for S3 bucket operations"
}

variable "enable_iam_user_groups" {
  type        = bool
  default     = true
  description = "Enable creation of IAM user groups for better access management"
}

variable "max_session_duration" {
  type        = number
  default     = 3600
  description = "Maximum session duration (in seconds) for IAM roles"
}

variable "enable_permission_boundaries" {
  type        = bool
  default     = false
  description = "Enable IAM permission boundaries for enhanced security"
}

# Note: This file addresses the following requirements:
# - Access Management (6.1 AUTHENTICATION AND AUTHORIZATION)
#   By defining variables for IAM role and policy configuration
# - Security Implementation (6.1 AUTHENTICATION AND AUTHORIZATION/Authorization Matrix)
#   Enabling customizable security parameters
# - Cloud Infrastructure (5.2 CLOUD SERVICES)
#   Providing configurable IAM parameters for AWS resources

# The variables defined here allow for flexible and reusable IAM resource creation,
# supporting different environments and security configurations.