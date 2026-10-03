export function hasPermission(user: any, permissionCode: string): boolean {
  if (!user) return false;
  if (user.is_superuser) return true;
  if (!user.role || !Array.isArray(user.role.permissions)) return false;

  const perms = new Set<string>(user.role.permissions.map((p: any) => p.code));

  // Exact match
  if (perms.has(permissionCode)) return true;

  // Module-level manage permission fallback (e.g. 'roles.manage' grants 'roles.view', 'roles.create')
  if (permissionCode.includes(".")) {
    const moduleName = permissionCode.split(".")[0];
    if (perms.has(`${moduleName}.manage`)) return true;
  }

  // Aliases
  const aliases: Record<string, string[]> = {
    "sadaqah.view": ["sadakah.view"],
    "sadaqah.create": ["sadakah.create"],
    "sadaqah.update": ["sadakah.update"],
    "sadaqah.delete": ["sadakah.delete"],
    "qard_hasan.repay": ["qard_hasan.repayment"],
    "qard_hasan.repayment": ["qard_hasan.repay"],
    "organization.view": ["settings.manage"],
    "organization.update": ["settings.manage"],
  };

  const codeAliases = aliases[permissionCode] || [];
  for (const alias of codeAliases) {
    if (perms.has(alias)) return true;
  }

  return false;
}

export function canAny(user: any, permissionCodes: string[]): boolean {
  return permissionCodes.some((code) => hasPermission(user, code));
}

export function canAll(user: any, permissionCodes: string[]): boolean {
  return permissionCodes.every((code) => hasPermission(user, code));
}
