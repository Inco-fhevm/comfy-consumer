#!/bin/sh

echo "Starting Comfy Consumer application..."

# Start metrics server in background
echo "Starting metrics server on port ${METRICS_PORT:-9090}..."
node metrics-server.js &
METRICS_PID=$!

# Function to handle shutdown
cleanup() {
    echo "Shutting down..."
    kill $METRICS_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start Next.js app
echo "Starting Next.js application on port ${PORT:-3000}..."
node server.js &
NEXTJS_PID=$!

# Wait for either process to exit
wait $NEXTJS_PID
