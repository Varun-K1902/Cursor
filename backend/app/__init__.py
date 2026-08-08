from fastapi import FastAPI

# Re-export app for `uvicorn app.main:app`
from app.main import app

__all__ = ["app", "FastAPI"]
