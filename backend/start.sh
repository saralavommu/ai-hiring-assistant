#!/bin/bash

# Start the background polling worker in the background
python polling_worker.py &

# Start the FastAPI application in the foreground
uvicorn app.main:app --host 0.0.0.0 --port $PORT
