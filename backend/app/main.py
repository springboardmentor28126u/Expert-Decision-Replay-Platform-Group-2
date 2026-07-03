from fastapi import FastAPI

app = FastAPI(
    title="Python Expert Decision Replay Platform",
    description="Backend API for the Infosys Springboard Internship Project",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to Python Expert Decision Replay Platform"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }