#!/usr/bin/env python3
"""
run_bot.py — Legacy entry point.
The Hype Telegram Bot is now integrated into the FastAPI server.

To start both the API and the Bot, run:
  cd backend
  uv run uvicorn main:app --reload

This ensures shared database connections and consolidated logging.
"""
import sys
import subprocess

if __name__ == "__main__":
    print("NOTE: The bot is now integrated into FastAPI.")
    print("Running: uv run uvicorn main:app")
    try:
        subprocess.run(["uv", "run", "uvicorn", "main:app"], check=True)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)
