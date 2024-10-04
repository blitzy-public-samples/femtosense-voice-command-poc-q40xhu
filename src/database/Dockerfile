# Use Python 3.7 slim version as the base image
FROM python:3.7-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the source code into the container
COPY src/ ./src/

# Copy the data files into the container
COPY data/ ./data/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Expose the port if needed (uncomment if your database component needs to expose a port)
# EXPOSE 5000

# Run the database component
CMD ["python", "src/main.py"]