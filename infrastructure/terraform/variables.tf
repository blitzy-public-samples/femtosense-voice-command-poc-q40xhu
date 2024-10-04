# AWS Configuration Variables
variable "aws_region" {
  type        = string
  default     = "us-west-2"
  description = "The AWS region to deploy resources in"
}

variable "aws_account_id" {
  type        = string
  description = "The AWS account ID for resource creation"
}

# Project Variables
variable "project_name" {
  type        = string
  default     = "femtosense-voice-command"
  description = "The name of the project, used for resource naming and tagging"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "The deployment environment (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# S3 Configuration
variable "s3_bucket_name" {
  type        = string
  description = "The name of the S3 bucket for storing audio files"
}

# Lambda Configuration
variable "lambda_runtime" {
  type        = string
  default     = "python3.7"
  description = "The runtime for Lambda functions"
}

variable "lambda_timeout" {
  type        = number
  default     = 300
  description = "The timeout for Lambda functions in seconds"
}

# Voice Generation Configuration
variable "voice_languages" {
  type        = list(string)
  default     = ["korean", "english", "japanese"]
  description = "List of supported languages for voice generation"
}

variable "voice_profiles_per_language" {
  type        = number
  default     = 10
  description = "Minimum number of voice profiles required per language"
}

# Additional variables for scalability and flexibility
variable "enable_versioning" {
  type        = bool
  default     = true
  description = "Enable versioning for S3 bucket"
}

variable "enable_encryption" {
  type        = bool
  default     = true
  description = "Enable server-side encryption for S3 bucket"
}

variable "lambda_memory_size" {
  type        = number
  default     = 1024
  description = "Memory size for Lambda functions in MB"
}

variable "api_rate_limit" {
  type        = number
  default     = 100
  description = "API rate limit per minute"
}

# Tags
variable "tags" {
  type = map(string)
  default = {
    "Project"     = "Femtosense Voice Command Generation PoC"
    "ManagedBy"   = "Terraform"
    "Environment" = "dev"
  }
  description = "Default tags to be applied to all resources"
}

# Conditional variable for production environment
variable "enable_multi_region" {
  type        = bool
  default     = false
  description = "Enable multi-region deployment for production environment"
}

# Variable for adjusting the number of Lambda concurrent executions
variable "lambda_concurrent_executions" {
  type        = number
  default     = 100
  description = "Number of concurrent Lambda executions allowed"
}

# Variable for CloudWatch log retention
variable "cloudwatch_log_retention_days" {
  type        = number
  default     = 30
  description = "Number of days to retain CloudWatch logs"
}

# Variable for enabling enhanced monitoring
variable "enable_enhanced_monitoring" {
  type        = bool
  default     = false
  description = "Enable enhanced monitoring for Lambda functions"
}