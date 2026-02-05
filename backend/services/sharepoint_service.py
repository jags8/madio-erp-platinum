import httpx
import os
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SharePointService:
    """Microsoft SharePoint integration for document management"""
    
    def __init__(self):
        self.client_id = os.getenv('SHAREPOINT_CLIENT_ID')
        self.client_secret = os.getenv('SHAREPOINT_CLIENT_SECRET')
        self.tenant_id = os.getenv('SHAREPOINT_TENANT_ID')
        self.site_url = os.getenv('SHAREPOINT_SITE_URL', 'https://madio.sharepoint.com/sites/CRM')
        self.access_token = None
        self.token_expires_at = None
        self._site_id = None
        self._drive_id = None
    
    async def get_access_token(self) -> str:
        """Get or refresh Microsoft Graph API access token"""
        if self.access_token and self.token_expires_at and self.token_expires_at > datetime.now():
            return self.access_token
        
        token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': 'https://graph.microsoft.com/.default',
            'grant_type': 'client_credentials'
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(token_url, data=data)
                response.raise_for_status()
                token_data = response.json()
                
                self.access_token = token_data['access_token']
                expires_in = token_data.get('expires_in', 3600)
                self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 300)
                
                logger.info("SharePoint authentication successful")
                return self.access_token
        except Exception as e:
            logger.error(f"SharePoint authentication failed: {e}")
            raise Exception(f"SharePoint authentication failed: {str(e)}")
    
    async def _get_site_id(self, token: str) -> str:
        """Get SharePoint site ID from URL"""
        if self._site_id:
            return self._site_id
        
        parts = self.site_url.replace('https://', '').split('/')
        hostname = parts[0]
        site_path = '/'.join(parts[1:]) if len(parts) > 1 else ''
        
        url = f"https://graph.microsoft.com/v1.0/sites/{hostname}:/{site_path}"
        headers = {'Authorization': f'Bearer {token}'}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            self._site_id = response.json()['id']
            return self._site_id
    
    async def _get_drive_id(self, token: str, site_id: str) -> str:
        """Get default document library drive ID"""
        if self._drive_id:
            return self._drive_id
        
        url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive"
        headers = {'Authorization': f'Bearer {token}'}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            self._drive_id = response.json()['id']
            return self._drive_id
    
    async def upload_file(self, file_content: bytes, file_name: str, folder_path: str = "CRM_Documents") -> dict:
        """Upload file to SharePoint document library"""
        try:
            token = await self.get_access_token()
            site_id = await self._get_site_id(token)
            drive_id = await self._get_drive_id(token, site_id)
            
            folder_path = folder_path.strip('/')
            upload_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root:/{folder_path}/{file_name}:/content"
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/octet-stream'
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.put(upload_url, content=file_content, headers=headers)
                response.raise_for_status()
                file_data = response.json()
                
                logger.info(f"File uploaded to SharePoint: {file_name}")
                
                return {
                    'file_id': file_data['id'],
                    'file_name': file_data['name'],
                    'file_url': file_data.get('webUrl', ''),
                    'size': file_data.get('size', 0),
                    'created_at': file_data.get('createdDateTime', '')
                }
        except Exception as e:
            logger.error(f"File upload failed: {e}")
            raise Exception(f"SharePoint upload failed: {str(e)}")
    
    async def get_file(self, file_id: str) -> bytes:
        """Download file from SharePoint by file ID"""
        try:
            token = await self.get_access_token()
            site_id = await self._get_site_id(token)
            drive_id = await self._get_drive_id(token, site_id)
            
            download_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/items/{file_id}/content"
            headers = {'Authorization': f'Bearer {token}'}
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(download_url, headers=headers)
                response.raise_for_status()
                
                logger.info(f"File downloaded from SharePoint: {file_id}")
                return response.content
        except Exception as e:
            logger.error(f"File download failed: {e}")
            raise Exception(f"SharePoint download failed: {str(e)}")
    
    async def create_folder(self, folder_name: str, parent_path: str = "") -> dict:
        """Create folder in SharePoint"""
        try:
            token = await self.get_access_token()
            site_id = await self._get_site_id(token)
            drive_id = await self._get_drive_id(token, site_id)
            
            parent_path = parent_path.strip('/')
            url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root{':/' + parent_path if parent_path else ''}:/children"
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'name': folder_name,
                'folder': {},
                '@microsoft.graph.conflictBehavior': 'rename'
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=data, headers=headers)
                response.raise_for_status()
                
                logger.info(f"Folder created: {folder_name}")
                return response.json()
        except Exception as e:
            logger.error(f"Folder creation failed: {e}")
            raise Exception(f"Folder creation failed: {str(e)}")
    
    async def list_files(self, folder_path: str = "") -> list:
        """List files in a SharePoint folder"""
        try:
            token = await self.get_access_token()
            site_id = await self._get_site_id(token)
            drive_id = await self._get_drive_id(token, site_id)
            
            folder_path = folder_path.strip('/')
            url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root{':/' + folder_path if folder_path else ''}:/children"
            headers = {'Authorization': f'Bearer {token}'}
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                
                return response.json().get('value', [])
        except Exception as e:
            logger.error(f"List files failed: {e}")
            return []

sharepoint_service = SharePointService()
