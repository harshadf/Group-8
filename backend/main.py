from fastapi import FastAPI

from datetime import datetime, timezone

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": datetime.now(timezone.utc).isoformat() }