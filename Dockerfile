# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for audio processing and C compilation
# We need these for librosa (scipy) and whisper
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    g++ \
    gfortran \
    libsndfile1 \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face runs as user 1000, so we set that up to be safe
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements and install python dependencies
COPY --chown=user backend/requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt

# Pre-download the Whisper model so it's baked into the image
RUN python -c "import whisper; whisper.load_model('base.en')"

# Copy the rest of the backend code
COPY --chown=user backend/ .

# Hugging Face MUST run on port 7860
EXPOSE 7860

# Start the application on 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
