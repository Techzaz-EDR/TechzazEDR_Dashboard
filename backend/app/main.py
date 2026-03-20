from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import firebase_test, admin, examples, alerts, commands, agents

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200", 
        "http://127.0.0.1:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(firebase_test.router, prefix=settings.API_V1_STR, tags=["firebase"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(examples.router, prefix=settings.API_V1_STR, tags=["examples"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])
app.include_router(commands.router, prefix=f"{settings.API_V1_STR}/commands", tags=["commands"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["agents"])

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
