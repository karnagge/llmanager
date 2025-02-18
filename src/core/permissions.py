def matches_permission(required: str, granted: str) -> bool:
    """Check if a granted permission matches a required permission.
    
    Examples:
        - "admin:read" matches "admin:*"
        - "admin:write" matches "admin:*"
        - "user:read" does not match "admin:*"
        - "admin:read" matches "admin:read"
    """
    if granted == "*":  # Full access
        return True
        
    if granted.endswith(":*"):
        # Check if the required permission starts with the granted namespace
        granted_namespace = granted.rsplit(":", 1)[0]
        return required.startswith(granted_namespace + ":")
    
    return required == granted

def check_permissions(required_permissions: set[str], granted_permissions: set[str]) -> bool:
    """Check if granted permissions satisfy required permissions.
    
    Args:
        required_permissions: Set of required permissions
        granted_permissions: Set of granted permissions
    
    Returns:
        bool: True if all required permissions are satisfied
    
    Examples:
        >>> check_permissions({"admin:read"}, {"admin:*"})
        True
        >>> check_permissions({"user:write"}, {"admin:*"})
        False
        >>> check_permissions({"admin:read", "user:write"}, {"*"})
        True
    """
    for required in required_permissions:
        if not any(matches_permission(required, granted) for granted in granted_permissions):
            return False
    return True