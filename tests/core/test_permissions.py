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

def test_complex_scenarios():
    # Test multiple namespace wildcards
    required = {"admin:users:read", "admin:roles:write"}
    granted = {"admin:*"}
    assert check_permissions(required, granted) is True

    # Test multiple permissions needed
    required = {"admin:read", "system:write", "user:delete"}
    granted = {"admin:read", "system:*", "user:*"}
    assert check_permissions(required, granted) is True

    # Test insufficient permissions
    granted = {"admin:*", "system:read"}
    assert check_permissions(required, granted) is False

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