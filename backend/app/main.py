"""AIBA prototype API — persists the canonical process model.

Flow and Functional Preview are never stored separately; clients derive both
from this single model.
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).resolve().parent.parent / "aiba.db"


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS processes (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              model_json TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


class ProcessCreate(BaseModel):
    name: str = "Untitled process"
    model: dict[str, Any] | None = None


class ProcessUpdate(BaseModel):
    name: str | None = None
    model: dict[str, Any]


class ProcessSummary(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str
    frozen: bool = False
    step_count: int = 0


class ProcessRecord(BaseModel):
    id: str
    name: str
    model: dict[str, Any]
    created_at: str
    updated_at: str


app = FastAPI(title="AIBA", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "product": "AIBA"}


@app.get("/processes", response_model=list[ProcessSummary])
def list_processes() -> list[ProcessSummary]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, name, model_json, created_at, updated_at FROM processes ORDER BY updated_at DESC"
        ).fetchall()
    out: list[ProcessSummary] = []
    for row in rows:
        model = json.loads(row["model_json"])
        out.append(
            ProcessSummary(
                id=row["id"],
                name=row["name"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                frozen=bool(model.get("frozen")),
                step_count=len(model.get("steps") or []),
            )
        )
    return out


@app.post("/processes", response_model=ProcessRecord)
def create_process(body: ProcessCreate) -> ProcessRecord:
    pid = body.model.get("id") if body.model else None
    pid = pid or f"proc_{uuid.uuid4().hex[:10]}"
    now = utcnow()
    model = body.model or {
        "id": pid,
        "name": body.name,
        "domainHint": "general",
        "statements": [],
        "people": [],
        "things": [],
        "rules": [],
        "actions": [],
        "steps": [],
        "challenges": [],
        "selectedStepId": None,
        "frozen": False,
        "createdAt": now,
        "updatedAt": now,
    }
    model["id"] = pid
    model["name"] = body.name or model.get("name") or "Untitled process"
    with connect() as conn:
        conn.execute(
            "INSERT INTO processes (id, name, model_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (pid, model["name"], json.dumps(model), now, now),
        )
        conn.commit()
    return ProcessRecord(id=pid, name=model["name"], model=model, created_at=now, updated_at=now)


@app.get("/processes/{process_id}", response_model=ProcessRecord)
def get_process(process_id: str) -> ProcessRecord:
    with connect() as conn:
        row = conn.execute(
            "SELECT id, name, model_json, created_at, updated_at FROM processes WHERE id = ?",
            (process_id,),
        ).fetchone()
    if not row:
        raise HTTPException(404, "Process not found")
    return ProcessRecord(
        id=row["id"],
        name=row["name"],
        model=json.loads(row["model_json"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@app.put("/processes/{process_id}", response_model=ProcessRecord)
def put_process(process_id: str, body: ProcessUpdate) -> ProcessRecord:
    with connect() as conn:
        row = conn.execute("SELECT id FROM processes WHERE id = ?", (process_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Process not found")
        now = utcnow()
        model = body.model
        model["id"] = process_id
        model["updatedAt"] = now
        name = body.name or model.get("name") or "Untitled process"
        model["name"] = name
        conn.execute(
            "UPDATE processes SET name = ?, model_json = ?, updated_at = ? WHERE id = ?",
            (name, json.dumps(model), now, process_id),
        )
        conn.commit()
        created = conn.execute(
            "SELECT created_at FROM processes WHERE id = ?", (process_id,)
        ).fetchone()["created_at"]
    return ProcessRecord(
        id=process_id, name=name, model=model, created_at=created, updated_at=now
    )


@app.delete("/processes/{process_id}")
def delete_process(process_id: str) -> dict[str, str]:
    with connect() as conn:
        cur = conn.execute("DELETE FROM processes WHERE id = ?", (process_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Process not found")
    return {"status": "deleted"}
