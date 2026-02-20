# app/repositories/base.py
"""Base repository - Open/Closed Principle"""
from typing import Generic, TypeVar, List, Optional
from sqlalchemy.orm import Session

T = TypeVar("T")


class Repository(Generic[T]):
    """Base repository for database operations"""

    def __init__(self, db: Session, model_class: type):
        self.db = db
        self.model_class = model_class

    def get_by_id(self, id: any) -> Optional[T]:
        """Get single item by id"""
        return self.db.query(self.model_class).filter(self.model_class.id == id).first()

    def get_all(self) -> List[T]:
        """Get all items"""
        return self.db.query(self.model_class).all()

    def create(self, obj: T) -> T:
        """Create new item"""
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, id: any, **kwargs) -> Optional[T]:
        """Update item"""
        obj = self.get_by_id(id)
        if obj:
            for key, value in kwargs.items():
                setattr(obj, key, value)
            self.db.commit()
            self.db.refresh(obj)
        return obj

    def delete(self, id: any) -> bool:
        """Delete item"""
        obj = self.get_by_id(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False
