# This file defines the input variables for the AWS Lambda module in the Femtosense Voice Command Generation PoC system,
# allowing for flexible and configurable Lambda function deployments.

# Requirements addressed:
# - Serverless Processing (5.2 CLOUD SERVICES): Define configurable parameters for Lambda function
# - Scalable Data Management (1.1 SYSTEM OBJECTIVES/3. Scalable Data Management): Enable flexible Lambda resource allocation
# - Security Implementation (6.1 AUTHENTICATION AND AUTHORIZATION): Configure secure Lambda execution environment

# Required variables

variable "function_name" {
  type        = string
  description = "The name of the Lambda function"
}

variable "environment" {
  type        = string
  description = "The deployment environment (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Optional variables with defaults

variable "runtime" {
  type        = string
  description = "The runtime environment for the Lambda function"
  default     = "python3.7"
}

variable "memory_size" {
  type        = number
  description = "The amount of memory to allocate to the Lambda function (MB)"
  default     = 1024
  validation {
    condition     = var.memory_size >= 128 && var.memory_size <= 10240
    error_message = "Memory size must be between 128 MB and 10240 MB."
  }
}

variable "timeout" {
  type        = number
  description = "The maximum execution time for the Lambda function (seconds)"
  default     = 300
  validation {
    condition     = var.timeout >= 1 && var.timeout <= 900
    error_message = "Timeout must be between 1 and 900 seconds."
  }
}

variable "vpc_config" {
  type = object({
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  description = "VPC configuration for the Lambda function"
  default     = null
}

variable "s3_bucket_name" {
  type        = string
  description = "The name of the S3 bucket for storing audio files"
}

variable "s3_bucket_arn" {
  type        = string
  description = "The ARN of the S3 bucket for Lambda permissions"
}

# Additional variables inferred from main.tf

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs for VPC configuration"
  default     = []
}

variable "security_group_ids" {
  type        = list(string)
  description = "List of security group IDs for VPC configuration"
  default     = []
}

# Variable categories:
# - Function Identification: function_name, environment
# - Runtime Configuration: runtime, memory_size, timeout
# - Network Configuration: vpc_config, subnet_ids, security_group_ids
# - S3 Integration: s3_bucket_name, s3_bucket_arn