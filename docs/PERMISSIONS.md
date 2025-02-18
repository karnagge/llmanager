# Permission System

## Overview

The permission system uses a hierarchical structure with wildcards support. Permissions are structured as `namespace:action` or `namespace:resource:action`.

## Permission Format

Permissions follow these formats:
- `namespace:action` (e.g., `admin:read`)
- `namespace:resource:action` (e.g., `admin:users:create`)
- Wildcards: `namespace:*` or `*`

## Examples

### Basic Permissions
```
admin:read        # Can read admin resources
admin:write       # Can write admin resources
user:create       # Can create users
```

### Wildcard Permissions
```
admin:*           # Full admin access (all admin actions)
user:*           # Full user access (all user actions)
*                # Full system access (all permissions)
```

### Hierarchical Permissions
```
admin:users:read      # Can read user data in admin context
admin:roles:write     # Can modify roles in admin context
system:logs:delete    # Can delete system logs
```

## Permission Rules

1. **Exact Match**
   - `admin:read` matches only `admin:read`

2. **Wildcard Match**
   - `admin:*` matches `admin:read`, `admin:write`, etc.
   - `*` matches everything

3. **Hierarchy Rules**
   - `admin:*` matches `admin:users:read`, `admin:roles:write`, etc.
   - `admin:users:*` matches all user-related admin actions

## Usage in API Keys

When creating API keys, specify permissions like this:

```json
{
  "name": "Admin API Key",
  "permissions": {
    "scopes": [
      "admin:*",      // Full admin access
      "user:read",    // Can read user data
      "metrics:view"  // Can view metrics
    ]
  }
}
```

## Common Permission Sets

1. **Admin Access**
   ```json
   {
     "scopes": ["admin:*"]
   }
   ```

2. **Read-Only Access**
   ```json
   {
     "scopes": [
       "user:read",
       "metrics:view",
       "logs:read"
     ]
   }
   ```

3. **User Management**
   ```json
   {
     "scopes": [
       "user:read",
       "user:create",
       "user:update",
       "user:delete"
     ]
   }
   ```

4. **Full System Access**
   ```json
   {
     "scopes": ["*"]
   }
   ```

## Checking Permissions

The system automatically checks permissions for protected endpoints:

```python
@router.get("/admin/users", dependencies=[Depends(check_permissions({"admin:users:read"}))])
async def list_users():
    # This endpoint requires admin:users:read permission
    ...
```

## Best Practices

1. Use specific permissions over wildcards when possible
2. Group related permissions under the same namespace
3. Use hierarchical permissions for better organization
4. Document required permissions in API documentation
5. Regularly audit API key permissions

## Permission Namespaces

Common namespaces in the system:
- `admin`: Administrative actions
- `user`: User management
- `metrics`: System metrics
- `logs`: System logs
- `billing`: Billing operations
- `system`: System operations
- `chat`: Chat completion operations

## Security Considerations

1. Always use the principle of least privilege
2. Regularly rotate API keys
3. Audit permission usage
4. Monitor failed permission checks
5. Document permission changes