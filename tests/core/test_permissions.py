import pytest
from src.core.permissions import check_permissions, matches_permission

def test_exact_permission_match():
    assert matches_permission("admin:read", "admin:read") is True
    assert matches_permission("user:write", "admin:read") is False

def test_wildcard_all_permissions():
    assert matches_permission("admin:read", "*") is True
    assert matches_permission("user:write", "*") is True
    assert matches_permission("any:permission", "*") is True

def test_namespace_wildcard():
    assert matches_permission("admin:read", "admin:*") is True
    assert matches_permission("admin:write", "admin:*") is True
    assert matches_permission("user:read", "admin:*") is False

def test_check_permissions_single():
    assert check_permissions({"admin:read"}, {"admin:read"}) is True
    assert check_permissions({"admin:read"}, {"admin:write"}) is False
    assert check_permissions({"admin:read"}, {"admin:*"}) is True
    assert check_permissions({"admin:read"}, {"*"}) is True

def test_check_permissions_multiple():
    required = {"admin:read", "user:write"}
    granted = {"admin:*", "user:*"}
    assert check_permissions(required, granted) is True

    granted = {"admin:read", "user:read"}
    assert check_permissions(required, granted) is False

def test_check_permissions_full_access():
    required = {"admin:read", "user:write", "system:delete"}
    granted = {"*"}
    assert check_permissions(required, granted) is True

def test_check_permissions_empty():
    assert check_permissions(set(), {"admin:*"}) is True
    assert check_permissions({"admin:read"}, set()) is False

def test_hierarchical_permissions():
    # Test that 'admin' role implies all admin permissions
    required = {"admin:users:read", "admin:roles:write", "admin:settings:delete"}
    granted = {"admin:*"}
    assert check_permissions(required, granted) is True

    # Test more specific permissions
    required = {"admin:users:read"}
    granted = {"admin:users:*"}
    assert check_permissions(required, granted) is True
    
    # Test permission boundaries
    required = {"admin:users:read"}
    granted = {"user:*"}
    assert check_permissions(required, granted) is False

def test_admin_wildcard():
    """Test admin wildcard permissions specifically"""
    # Test common admin permission patterns
    assert matches_permission("admin:read_tenant", "admin:*") is True
    assert matches_permission("admin:create_tenant", "admin:*") is True
    assert matches_permission("admin:update_tenant", "admin:*") is True
    assert matches_permission("admin:delete_tenant", "admin:*") is True

    # Test with set of permissions
    required = {"admin:read_tenant", "admin:create_tenant"}
    granted = {"admin:*"}
    assert check_permissions(required, granted) is True

def test_colon_separated_permissions():
    """Test permissions with multiple colons"""
    assert matches_permission("admin:users:read", "admin:users:*") is True
    assert matches_permission("admin:users:write", "admin:users:*") is True
    assert matches_permission("admin:roles:read", "admin:*") is True
    assert matches_permission("admin:settings:delete", "admin:*") is True

def test_full_access():
    """Test full access wildcard"""
    assert matches_permission("anything:can:go:here", "*") is True
    assert check_permissions({"admin:super:secret"}, {"*"}) is True

def test_complex_permission_scenarios():
    """Test more complex permission scenarios"""
    # Multiple wildcards in different positions
    assert matches_permission("admin:users:read:details", "admin:users:*:details") is True
    assert matches_permission("admin:users:read:details", "admin:*:read:*") is True
    
    # Admin namespace variations
    assert matches_permission("admin_api:read", "admin_api:*") is True
    assert matches_permission("admin-section:read", "admin-section:*") is True