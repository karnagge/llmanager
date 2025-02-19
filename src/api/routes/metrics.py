import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import get_current_tenant_and_key
from src.core.database import get_tenant_db_session
from src.models.system import APIKey, Tenant
from src.models.tenant import User, UsageLog

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics(
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> dict:
    tenant, _ = tenant_key
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)

    async with get_tenant_db_session(tenant.id) as session:
        # Obter a contagem total de usuários
        users_result = await session.execute(
            select(func.count()).select_from(User)
        )
        total_users = users_result.scalar() or 0

        # Obter estatísticas de uso nas últimas 24 horas
        usage_stats = await session.execute(
            select(
                func.count().label("total_requests"),
                func.sum(UsageLog.total_tokens).label("total_tokens"),
                func.avg(
                    case(
                        (UsageLog.usage_data["error"].as_boolean(), 1),
                        else_=0
                    )
                ).label("error_rate")
            )
            .select_from(UsageLog)
            .where(UsageLog.timestamp >= last_24h)
        )
        stats = usage_stats.first()
        # Se não houver resultado, definindo valores padrão
        total_requests = int(stats.total_requests or 0) if stats else 0
        total_tokens = int(stats.total_tokens or 0) if stats else 0
        error_rate = (float(stats.error_rate or 0) * 100) if stats else 0.0

        return {
            "totalUsers": total_users,
            "totalRequests": total_requests,
            "totalTokens": total_tokens,
            "errorRate": error_rate,
            "trends": {
                "users": 0,      # Implementar cálculo de tendência posteriormente
                "requests": 0,
                "tokens": 0,
                "errors": 0
            },
            "graphs": {
                "requests": [],  # Implementar dados de séries temporais posteriormente
                "tokens": [],
                "errors": []
            }
        }

@router.get("/requests")
async def get_request_metrics(
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> dict:
    tenant, _ = tenant_key
    
    async with get_tenant_db_session(tenant.id) as session:
        # Get request counts per day for the last 7 days
        last_7_days = datetime.utcnow() - timedelta(days=7)
        result = await session.execute(
            select(
                func.date_trunc('day', UsageLog.timestamp).label('date'),
                func.count().label('count')
            )
            .where(UsageLog.timestamp >= last_7_days)
            .group_by('date')
            .order_by('date')
        )
        
        requests_data = [
            {"date": row.date.strftime("%Y-%m-%d"), "value": row.count}
            for row in result.all()
        ]
        
        return {
            "requests": requests_data
        }

@router.get("/tokens")
async def get_token_metrics(
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> dict:
    tenant, _ = tenant_key
    
    async with get_tenant_db_session(tenant.id) as session:
        # Get total tokens per day for the last 7 days
        last_7_days = datetime.utcnow() - timedelta(days=7)
        result = await session.execute(
            select(
                func.date_trunc('day', UsageLog.timestamp).label('date'),
                func.sum(UsageLog.total_tokens).label('total')
            )
            .where(UsageLog.timestamp >= last_7_days)
            .group_by('date')
            .order_by('date')
        )
        
        tokens_data = [
            {"date": row.date.strftime("%Y-%m-%d"), "value": int(row.total or 0)}
            for row in result.all()
        ]
        
        return {
            "tokens": tokens_data
        }

@router.get("/errors")
async def get_error_metrics(
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> dict:
    tenant, _ = tenant_key
    
    async with get_tenant_db_session(tenant.id) as session:
        # Obter taxa de erro por dia para os últimos 7 dias
        last_7_days = datetime.utcnow() - timedelta(days=7)
        result = await session.execute(
            select(
                func.date_trunc('day', UsageLog.timestamp).label('date'),
                func.avg(
                    case(
                        (UsageLog.usage_data["error"].as_boolean(), 1),
                        else_=0
                    )
                ).label('error_rate')
            )
            .where(UsageLog.timestamp >= last_7_days)
            .group_by('date')
            .order_by('date')
        )
        
        errors_data = [
            {
                "date": row.date.strftime("%Y-%m-%d"),
                "value": float(row.error_rate or 0) * 100
            }
            for row in result.all()
        ]
        
        return {
            "errors": errors_data
        }