"""Pagination utilities for API responses"""
from typing import List, TypeVar, Generic, Optional
from pydantic import BaseModel
from math import ceil

T = TypeVar('T')

class PaginationParams(BaseModel):
    """Standard pagination parameters"""
    page: int = 1
    per_page: int = 20
    
    @property
    def skip(self) -> int:
        return (self.page - 1) * self.per_page
    
    @property
    def limit(self) -> int:
        return self.per_page

class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated API response"""
    data: List[T]
    pagination: dict
    
    @classmethod
    def create(
        cls,
        data: List[T],
        page: int,
        per_page: int,
        total_count: int
    ):
        """Create paginated response with metadata"""
        total_pages = ceil(total_count / per_page) if per_page > 0 else 0
        
        return cls(
            data=data,
            pagination={
                "page": page,
                "per_page": per_page,
                "total_items": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        )

class CursorPaginationParams(BaseModel):
    """Cursor-based pagination for large datasets"""
    cursor: Optional[str] = None
    limit: int = 20

class CursorPaginatedResponse(BaseModel, Generic[T]):
    """Cursor-based paginated response"""
    data: List[T]
    pagination: dict
    
    @classmethod
    def create(
        cls,
        data: List[T],
        next_cursor: Optional[str] = None,
        has_more: bool = False
    ):
        return cls(
            data=data,
            pagination={
                "next_cursor": next_cursor,
                "has_more": has_more,
                "count": len(data)
            }
        )
