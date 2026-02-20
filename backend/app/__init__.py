# app/__init__.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import settings, init_db
from app.api import router


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(router)

    # Event handlers
    @app.on_event("startup")
    def startup_event():
        """Initialize database on startup"""
        init_db()

    return app


app = create_app()
