INSERT INTO tenants (id, name, quota_limit, config, is_active, current_quota_usage)
VALUES ('admin', 'Admin Tenant', 1000000, '{}', true, 0);

INSERT INTO api_keys (id, tenant_id, name, key_hash, permissions, is_active)
VALUES ('admin_key', 'admin', 'Admin Key', 'admin_hash', '{"scopes": ["admin:*"]}', true);
