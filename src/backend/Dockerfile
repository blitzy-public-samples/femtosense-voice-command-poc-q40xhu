# Use an official Python runtime as a parent image
FROM python:3.7-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV WORKDIR=/app

# Install FFmpeg and other dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR ${WORKDIR}

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Make the entrypoint script executable
RUN chmod +x narakeet_generate_stt.py

# Run the application when the container launches
ENTRYPOINT ["python", "narakeet_generate_stt.py"]

# Use a non-root user for better security
RUN useradd -m appuser
USER appuser

# Expose any necessary ports
# Note: This is just a placeholder. Adjust if needed based on your application requirements.
# EXPOSE 8080

# Add labels for better maintainability
LABEL maintainer="Femtosense Development Team <dev@femtosense.com>"
LABEL version="1.0"
LABEL description="Femtosense Voice Command Generation PoC Backend"