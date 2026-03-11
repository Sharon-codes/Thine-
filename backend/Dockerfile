# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for audio processing and C compilation
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    g++ \
    gfortran \
    libsndfile1 \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the Whisper model so it's ready in the image
RUN python -c "import whisper; whisper.load_model('base.en')"

# Copy the rest of the backend code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
