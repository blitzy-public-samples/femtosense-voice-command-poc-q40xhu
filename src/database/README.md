# Database Component - Femtosense Voice Command Generation PoC

## Overview

This directory contains the database component for the Femtosense Voice Command Generation Proof of Concept (PoC) system. It implements a scalable data management solution using AWS S3 for long-term storage and local temporary storage for intermediate processing. The component is designed to handle the organization, storage, and retrieval of generated voice command data efficiently.

## Architecture

The database component utilizes a file-based storage approach with the following key features:

1. AWS S3 for long-term, scalable storage
2. Local temporary storage for intermediate processing
3. Structured file organization based on language, intent, and phrase variations
4. Metadata management for efficient data retrieval and management

## Setup Instructions

1. Install required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Configure AWS credentials:
   - Set up AWS CLI with appropriate credentials
   - Ensure the IAM role has necessary permissions for S3 operations

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required values, including AWS region and S3 bucket name

4. Run setup script:
   ```
   python setup.py
   ```

## Usage Guidelines

1. Importing the storage module:
   ```python
   from src.file_storage.storage_factory import StorageFactory
   
   storage = StorageFactory.get_storage()
   ```

2. Storing a file:
   ```python
   storage.store_file(file_path, destination_path, metadata)
   ```

3. Retrieving a file:
   ```python
   file_content = storage.get_file(file_path)
   ```

4. Listing files:
   ```python
   files = storage.list_files(prefix)
   ```

5. Deleting a file:
   ```python
   storage.delete_file(file_path)
   ```

## Component Structure

```
src/
├── models/
│   ├── metadata.py
│   ├── audio_file.py
│   └── voice_command.py
├── config/
│   ├── storage_config.py
│   └── voice_registry_config.py
├── utils/
│   ├── file_validator.py
│   └── path_generator.py
├── file_storage/
│   ├── local_storage.py
│   ├── s3_storage.py
│   └── storage_factory.py
├── data_access/
│   ├── audio_file_dao.py
│   └── voice_command_dao.py
└── voice_registry/
    ├── language_manager.py
    ├── voice_profile.py
    └── voice_registry.py
tests/
├── test_utils.py
├── test_file_storage.py
├── test_data_access.py
└── test_voice_registry.py
data/
├── language_mappings.json
└── voice_profiles.json
```

## Testing

Run the test suite using:

```
pytest tests/
```

## Contributing Guidelines

1. Follow PEP 8 style guide for Python code
2. Write unit tests for new functionality
3. Update documentation when making changes
4. Use type hints for better code readability
5. Create feature branches and submit pull requests for review

## Security Considerations

- API keys and sensitive information are stored in environment variables
- AWS S3 server-side encryption (AES-256) is used for data at rest
- TLS encryption is used for data in transit
- IAM roles and policies follow the principle of least privilege
- Regular security audits and penetration testing are conducted

## Performance Optimization

- Implement caching mechanisms for frequently accessed data
- Use AWS S3 transfer acceleration for improved upload/download speeds
- Optimize database queries and indexing for faster data retrieval
- Implement batch processing for large-scale operations

## Scalability

The database component is designed to scale horizontally:

- AWS S3 provides virtually unlimited storage capacity
- Multiple instances can be deployed behind a load balancer
- Separate read and write operations for improved performance

## Monitoring and Logging

- AWS CloudWatch is used for monitoring S3 access logs
- Custom metrics are implemented for tracking storage usage and performance
- Detailed logging is implemented for all critical operations
- Alerts are set up for unusual activity or approaching storage limits

## Disaster Recovery

- Regular backups of critical data are performed
- Cross-region replication is set up for S3 buckets
- Documented recovery procedures are in place
- Regular disaster recovery drills are conducted

For more detailed information on specific modules or functionalities, please refer to the inline documentation within each file.