# app/core/exceptions.py
"""Custom application exceptions following Single Responsibility Principle"""


class ThermoLabelException(Exception):
    """Base exception for all ThermoLabel errors"""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ProjectNotFoundError(ThermoLabelException):
    """Raised when project is not found"""

    def __init__(self, project_id: str):
        super().__init__(
            f"Project with id '{project_id}' not found",
            status_code=404,
        )


class ValidationError(ThermoLabelException):
    """Raised when validation fails"""

    def __init__(self, message: str):
        super().__init__(message, status_code=422)


class DatabaseError(ThermoLabelException):
    """Raised when database operation fails"""

    def __init__(self, message: str):
        super().__init__(message, status_code=500)
