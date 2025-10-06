import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/services/PermissionService";

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  wishlistId?: string;
  organizationId?: string;
  fallback?: ReactNode;
  role?: string | string[];
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  wishlistId,
  organizationId,
  fallback = null,
  role,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role: userRole,
    isLoading,
  } = usePermissions({ wishlistId, organizationId });

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Check role-based access
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (permissions) {
    const hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook-based permission checker for use in components
 */
export function usePermissionGate(
  permission: Permission,
  options: { wishlistId?: string; organizationId?: string } = {}
) {
  const { hasPermission, isLoading } = usePermissions(options);

  return {
    canAccess: hasPermission(permission),
    isLoading,
  };
}

/**
 * Higher-order component to wrap components with permission checking
 */
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  permission: Permission,
  options: {
    wishlistId?: string;
    organizationId?: string;
    fallback?: ReactNode;
  } = {}
) {
  const WrappedComponent = (props: T) => {
    return (
      <PermissionGate
        permission={permission}
        wishlistId={options.wishlistId}
        organizationId={options.organizationId}
        fallback={options.fallback}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };

  WrappedComponent.displayName = `withPermissions(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Convenience components for common permission checks
 */
export function CanRead({ children, ...props }: Omit<PermissionGateProps, "permission">) {
  return (
    <PermissionGate permission="wishlists:read" {...props}>
      {children}
    </PermissionGate>
  );
}

export function CanWrite({ children, ...props }: Omit<PermissionGateProps, "permission">) {
  return (
    <PermissionGate permission="wishlists:write" {...props}>
      {children}
    </PermissionGate>
  );
}

export function CanDelete({ children, ...props }: Omit<PermissionGateProps, "permission">) {
  return (
    <PermissionGate permission="wishlists:delete" {...props}>
      {children}
    </PermissionGate>
  );
}

export function CanShare({ children, ...props }: Omit<PermissionGateProps, "permission">) {
  return (
    <PermissionGate permission="wishlists:share" {...props}>
      {children}
    </PermissionGate>
  );
}

export function CanEditItems({ children, ...props }: Omit<PermissionGateProps, "permission">) {
  return (
    <PermissionGate permission="items:write" {...props}>
      {children}
    </PermissionGate>
  );
}

export function CanDeleteItems({ children, ...props }: Omit<PermissionGateProps, "permission">) {
  return (
    <PermissionGate permission="items:delete" {...props}>
      {children}
    </PermissionGate>
  );
}

export function CanMoveItems({ children, ...props }: Omit<PermissionGateProps, "permission">) {
  return (
    <PermissionGate permission="items:move" {...props}>
      {children}
    </PermissionGate>
  );
}

export function CanClaimItems({ children, ...props }: Omit<PermissionGateProps, "permission">) {
  return (
    <PermissionGate permission="items:claim" {...props}>
      {children}
    </PermissionGate>
  );
}

export function IsOwner({ children, ...props }: Omit<PermissionGateProps, "role">) {
  return <PermissionGate {...props}>{children}</PermissionGate>;
}

export function IsCollaborator({ children, ...props }: Omit<PermissionGateProps, "role">) {
  return (
    <PermissionGate role={["owner", "collaborator"]} {...props}>
      {children}
    </PermissionGate>
  );
}
