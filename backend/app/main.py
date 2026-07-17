from fastapi import FastAPI

app = FastAPI(title="Expert Decision Replay Platform")

@app.get("/")
def root():
    return {"message": "API is running"}