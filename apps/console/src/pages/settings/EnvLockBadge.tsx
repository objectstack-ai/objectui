/**
 * <EnvLockBadge> — small chip indicating the value is pinned by env.
 */

import { Lock } from 'lucide-react';
import { Badge } from '@object-ui/components';

export interface EnvLockBadgeProps {
  /** The reason string carried in ResolvedSettingValue.lockedReason. */
  reason?: string;
  className?: string;
}

export function EnvLockBadge({ reason, className }: EnvLockBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`gap-1 border-amber-300 bg-amber-50 text-amber-900 ${className ?? ''}`}
      title={reason ?? 'Pinned by environment variable — cannot be edited from the UI.'}
    >
      <Lock className="h-3 w-3" />
      Locked by env
    </Badge>
  );
}
