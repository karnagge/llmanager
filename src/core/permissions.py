from typing import Set
from src.core.logging import get_logger

logger = get_logger(__name__)

def matches_permission(required: str, granted: str) -> bool:
    """Check if a granted permission matches a required permission.
    
    Examples:
        - "admin:read" matches "admin:*"
        - "admin:write" matches "admin:*"
        - "user:read" does not match "admin:*"
        - "admin:read" matches "admin:read"
        - "admin:users:read:details" matches "admin:*:read:*"
        - "admin:roles:read" matches "admin:*"
    """
    # Full access wildcard
    if granted == "*":
        logger.debug("permission_match_success",
                    required=required,
                    granted=granted,
                    reason="full_access_wildcard")
        return True
    
    # Split into parts for comparison
    required_parts = required.split(":")
    granted_parts = granted.split(":")
    
    # Special case: direct match
    if required == granted:
        logger.debug("permission_match_success",
                    required=required,
                    granted=granted,
                    reason="exact_match")
        return True

    # Special case: simple wildcard suffix (e.g., "admin:*")
    if len(granted_parts) == 2 and granted_parts[1] == "*":
        matches = required_parts[0] == granted_parts[0]
        if matches:
            logger.debug("permission_match_success",
                        required=required,
                        granted=granted,
                        reason="simple_wildcard_suffix")
        return matches

    # If lengths are equal, do direct part-by-part comparison
    if len(required_parts) == len(granted_parts):
        matches = all(g == "*" or g == r for r, g in zip(required_parts, granted_parts))
        if matches:
            logger.debug("permission_match_success",
                        required=required,
                        granted=granted,
                        reason="part_by_part_match")
        else:
            logger.debug("permission_match_failed",
                        required=required,
                        granted=granted,
                        reason="no_matching_parts")
        return matches

    # Special case: complex patterns with wildcards (e.g., "admin:*:read:*")
    if "*" in granted_parts:
        # Track position in both required and granted parts
        req_pos = 0
        grant_pos = 0
        
        while grant_pos < len(granted_parts):
            # No more required parts to match
            if req_pos >= len(required_parts):
                return False
                
            if granted_parts[grant_pos] == "*":
                # Wildcard matches current required part
                req_pos += 1
                grant_pos += 1
            else:
                # Parts must match exactly
                if granted_parts[grant_pos] != required_parts[req_pos]:
                    return False
                req_pos += 1
                grant_pos += 1
                
        # Match succeeds if we consumed all required parts
        matches = req_pos >= len(required_parts)
        if matches:
            logger.debug("permission_match_success",
                        required=required,
                        granted=granted,
                        reason="complex_wildcard_match")
        else:
            logger.debug("permission_match_failed",
                        required=required,
                        granted=granted,
                        reason="incomplete_pattern_match")
        return matches
    
    logger.debug("permission_match_failed",
                required=required,
                granted=granted,
                reason="no_matching_pattern")
    return False

def check_permissions(required_permissions: Set[str], granted_permissions: Set[str]) -> bool:
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
    logger.debug("checking_permissions", 
                required=list(required_permissions), 
                granted=list(granted_permissions))

    for required in required_permissions:
        if not any(matches_permission(required, granted) for granted in granted_permissions):
            logger.warning("permission_check_failed",
                       required=required,
                       granted=list(granted_permissions))
            return False
    
    logger.debug("permission_check_success",
               required=list(required_permissions),
               granted=list(granted_permissions))
    return True