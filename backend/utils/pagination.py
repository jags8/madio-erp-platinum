from typing import Optional, Dict, Any
from bson import ObjectId

class Paginator:
    """Cursor-based pagination for MongoDB collections"""
    
    @staticmethod
    async def paginate(
        collection,
        query: Dict[str, Any],
        limit: int = 50,
        cursor: Optional[str] = None,
        sort_field: str = '_id',
        sort_direction: int = -1
    ) -> dict:
        """
        Paginate MongoDB query with cursor-based pagination
        
        Args:
            collection: MongoDB collection
            query: MongoDB query filter
            limit: Number of items per page (max 100)
            cursor: Cursor from previous page
            sort_field: Field to sort by
            sort_direction: 1 for ascending, -1 for descending
        
        Returns:
            dict with 'data' and 'pagination' metadata
        """
        # Enforce max limit
        limit = min(limit, 100)
        
        # Add cursor to query if provided
        if cursor:
            try:
                cursor_value = ObjectId(cursor) if sort_field == '_id' else cursor
                query[sort_field] = {'$lt' if sort_direction == -1 else '$gt': cursor_value}
            except:
                pass  # Invalid cursor, ignore
        
        # Fetch limit + 1 to check if there are more items
        items = await collection.find(query).sort(sort_field, sort_direction).limit(limit + 1).to_list(limit + 1)
        
        # Check if there are more items
        has_more = len(items) > limit
        if has_more:
            items = items[:limit]
        
        # Transform items
        for item in items:
            item['id'] = str(item['_id'])
            del item['_id']
        
        # Prepare pagination metadata
        next_cursor = None
        if items and has_more:
            last_item = items[-1]
            next_cursor = last_item['id']
        
        return {
            'data': items,
            'pagination': {
                'cursor': next_cursor,
                'has_more': has_more,
                'count': len(items),
                'limit': limit
            }
        }
