# Variables for the S3 module in the Femtosense Voice Command Generation PoC system

variable "bucket_name" {
  description = "The name of the S3 bucket to be created for storing audio files"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "Bucket name must be between 3 and 63 characters, start and end with a lowercase letter or number, and can contain lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "tags" {
  description = "Additional tags to be applied to the S3 bucket"
  type        = map(string)
  default     = {}
}

variable "versioning_enabled" {
  description = "Enable versioning for the S3 bucket"
  type        = bool
  default     = true
}

variable "lifecycle_rules" {
  description = "List of lifecycle rules to be applied to the bucket"
  type = list(object({
    enabled                 = bool
    id                      = string
    prefix                  = string
    tags                    = map(string)
    transition_days         = number
    transition_storage_class = string
  }))
  default = [
    {
      enabled                 = true
      id                      = "transition-to-ia"
      prefix                  = ""
      tags                    = {}
      transition_days         = 30
      transition_storage_class = "STANDARD_IA"
    }
  ]
}

variable "force_ssl_only" {
  description = "Force SSL-only access to the S3 bucket"
  type        = bool
  default     = true
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS configuration"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allowed_methods" {
  description = "List of allowed HTTP methods for CORS configuration"
  type        = list(string)
  default     = ["GET", "PUT", "POST"]
}

variable "cors_allowed_headers" {
  description = "List of allowed headers for CORS configuration"
  type        = list(string)
  default     = ["*"]
}

variable "cors_expose_headers" {
  description = "List of expose headers for CORS configuration"
  type        = list(string)
  default     = ["ETag"]
}

variable "cors_max_age_seconds" {
  description = "The time in seconds that browser can cache the response for a preflight request"
  type        = number
  default     = 3000
}