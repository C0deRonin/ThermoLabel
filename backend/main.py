# main.py - Application entrypoint
"""ThermoLabel API - Main entry point"""

if __name__ == "__main__":
    import uvicorn
    from app import app

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
