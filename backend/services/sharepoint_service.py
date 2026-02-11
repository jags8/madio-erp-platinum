"""Microsoft SharePoint File Upload Service"""
import httpx
import msal
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from config.whatsapp_config import whatsapp_config

class SharePointService:
    """Microsoft SharePoint File Upload Service"""
    
    def __init__(self):
        self.config = whatsapp_config
        self.access_token = None
        self.token_expiry = None
    
    async def _get_access_token(self) -> str:
        """Get Microsoft Graph API access token"""
        
        if self.access_token and self.token_expiry:
            if datetime.now() < self.token_expiry:
                return self.access_token
        
        authority = f"https://login.microsoftonline.com/{self.config.SHAREPOINT_TENANT_ID}"
        
        app = msal.ConfidentialClientApplication(
            self.config.SHAREPOINT_CLIENT_ID,
            authority=authority,
            client_credential=self.config.SHAREPOINT_CLIENT_SECRET
        )
        
        result = app.acquire_token_for_client(
            scopes=["https://graph.microsoft.com/.default"]
        )
        
        if "access_token" in result:
            self.access_token = result["access_token"]
            self.token_expiry = datetime.now() + timedelta(seconds=3500)
            return self.access_token
        else:
            raise Exception(f"Failed to acquire token: {result.get('error_description')}")
    
    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        folder_path: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Upload file to SharePoint document library"""
        
        token = await self._get_access_token()
        
        upload_url = (
            f"https://graph.microsoft.com/v1.0/sites/{self.config.SHAREPOINT_SITE_ID}"
            f"/drive/root:{folder_path}/{filename}:/content"
        )
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                upload_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/octet-stream"
                },
                content=file_content
            )
            
            if response.status_code not in [200, 201]:
                raise Exception(f"SharePoint upload failed: {response.text}")
            
            file_data = response.json()
            
            if metadata:
                await self._update_file_metadata(
                    file_id=file_data["id"],
                    metadata=metadata,
                    token=token
                )
            
            return {
                "file_id": file_data["id"],
                "name": file_data["name"],
                "size": file_data["size"],
                "web_url": file_data["webUrl"],
                "created_at": file_data["createdDateTime"]
            }
    
    async def _update_file_metadata(
        self,
        file_id: str,
        metadata: Dict[str, Any],
        token: str
    ) -> None:
        """Update file metadata in SharePoint"""
        
        async with httpx.AsyncClient() as client:
            item_response = await client.get(
                f"https://graph.microsoft.com/v1.0/sites/{self.config.SHAREPOINT_SITE_ID}"
                f"/drive/items/{file_id}/listItem",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if item_response.status_code == 200:
                list_item_id = item_response.json()["id"]
                
                await client.patch(
                    f"https://graph.microsoft.com/v1.0/sites/{self.config.SHAREPOINT_SITE_ID}"
                    f"/lists/Documents/items/{list_item_id}/fields",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    },
                    json=metadata
                )
