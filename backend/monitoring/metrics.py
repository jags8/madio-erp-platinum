"""Prometheus Metrics for Application Monitoring"""
import psutil
from time import time
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Request, Response

# HTTP Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# Application Metrics
active_users_gauge = Gauge(
    'active_users',
    'Number of currently active users'
)

database_query_duration = Histogram(
    'database_query_duration_seconds',
    'Database query duration',
    ['collection', 'operation']
)

# WhatsApp Metrics
whatsapp_messages_total = Counter(
    'whatsapp_messages_total',
    'Total WhatsApp messages',
    ['direction', 'type']
)

sharepoint_uploads_total = Counter(
    'sharepoint_uploads_total',
    'Total SharePoint uploads',
    ['status']
)

# System Metrics
cpu_usage_percent = Gauge('system_cpu_usage_percent', 'CPU usage percentage')
memory_usage_percent = Gauge('system_memory_usage_percent', 'Memory usage percentage')
disk_usage_percent = Gauge('system_disk_usage_percent', 'Disk usage percentage')

async def metrics_middleware(request: Request, call_next):
    """Middleware to track request metrics"""
    
    start_time = time()
    
    # Process request
    response = await call_next(request)
    
    # Record metrics
    duration = time() - start_time
    
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

def update_system_metrics():
    """Update system resource metrics"""
    cpu_usage_percent.set(psutil.cpu_percent())
    memory_usage_percent.set(psutil.virtual_memory().percent)
    disk_usage_percent.set(psutil.disk_usage('/').percent)

def get_metrics() -> Response:
    """Get Prometheus metrics"""
    update_system_metrics()
    return Response(content=generate_latest(), media_type="text/plain")
