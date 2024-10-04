# Output values for the S3 module
# These outputs expose important information about the created S3 bucket
# to other Terraform modules and the root configuration.

# Output: bucket_name
# Description: The name of the created S3 bucket
# Purpose: Allows other modules to reference the bucket by name
output "bucket_name" {
  description = "The name of the created S3 bucket"
  value       = aws_s3_bucket.audio_files.id
}

# Output: bucket_arn
# Description: The Amazon Resource Name (ARN) of the created S3 bucket
# Purpose: Useful for creating IAM policies or other AWS resources that need to reference the bucket
output "bucket_arn" {
  description = "The ARN of the created S3 bucket"
  value       = aws_s3_bucket.audio_files.arn
}

# Output: bucket_domain_name
# Description: The domain name of the created S3 bucket
# Purpose: Can be used for configuring DNS or other services that need to reference the bucket URL
output "bucket_domain_name" {
  description = "The domain name of the created S3 bucket"
  value       = aws_s3_bucket.audio_files.bucket_domain_name
}

# Output: bucket_regional_domain_name
# Description: The regional domain name of the created S3 bucket
# Purpose: Provides a region-specific endpoint for the bucket, which can be useful for certain configurations
output "bucket_regional_domain_name" {
  description = "The regional domain name of the created S3 bucket"
  value       = aws_s3_bucket.audio_files.bucket_regional_domain_name
}

# Note: These outputs address the following requirements:
# - Scalable Data Management (1.1 SYSTEM OBJECTIVES/3. Scalable Data Management)
#   By exposing S3 bucket details, we enable integration with other services
# - Infrastructure Flexibility (5.1 DEPLOYMENT ENVIRONMENT)
#   These outputs enable cross-module resource referencing, enhancing flexibility

# Additional information:
# - These outputs will be used by the root module (infrastructure/terraform/main.tf) 
#   to pass bucket information to other modules
# - The IAM module may use these outputs to create appropriate policies for bucket access
# - The Lambda module might use these to configure environment variables for S3 interaction
# - None of these outputs are marked as sensitive since they don't contain confidential information