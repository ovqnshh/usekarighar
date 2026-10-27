/**
 * Project Lifecycle State Machine (Part A4)
 * Single source of truth for all project status transitions.
 */

export type ProjectLifecycleStatus =
  | "DRAFT"
  | "SEARCHING"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SETTLED"
  | "CANCELLED"
  | "DISPUTED"
  | "REWORK_SCHEDULED";

export type ProjectActorRole = "customer" | "karigar" | "admin" | "system";

export interface StateTransitionRule {
  allowedFrom: ProjectLifecycleStatus[];
  allowedRoles: ProjectActorRole[];
  requiresStartOtp?: boolean;
  requiresEndOtp?: boolean;
  requiresBeforePhoto?: boolean;
  requiresAfterPhoto?: boolean;
  requiresEscrowSettlement?: boolean;
}

export const PROJECT_TRANSITIONS: Record<ProjectLifecycleStatus, StateTransitionRule> = {
  DRAFT: {
    allowedFrom: [],
    allowedRoles: ["customer"],
  },
  SEARCHING: {
    allowedFrom: ["DRAFT"],
    allowedRoles: ["customer", "system"],
  },
  ASSIGNED: {
    allowedFrom: ["SEARCHING"],
    allowedRoles: ["karigar", "system", "admin"],
  },
  EN_ROUTE: {
    allowedFrom: ["ASSIGNED"],
    allowedRoles: ["karigar"],
  },
  ARRIVED: {
    allowedFrom: ["EN_ROUTE", "ASSIGNED"],
    allowedRoles: ["karigar"],
  },
  IN_PROGRESS: {
    allowedFrom: ["ARRIVED"],
    allowedRoles: ["karigar"],
    requiresStartOtp: true,
    requiresBeforePhoto: true,
  },
  COMPLETED: {
    allowedFrom: ["IN_PROGRESS"],
    allowedRoles: ["karigar"],
    requiresEndOtp: true,
    requiresAfterPhoto: true,
  },
  SETTLED: {
    allowedFrom: ["COMPLETED", "DISPUTED"],
    allowedRoles: ["system", "admin", "customer"],
    requiresEscrowSettlement: true,
  },
  CANCELLED: {
    allowedFrom: ["DRAFT", "SEARCHING", "ASSIGNED", "EN_ROUTE", "ARRIVED"],
    allowedRoles: ["customer", "karigar", "admin", "system"],
  },
  DISPUTED: {
    allowedFrom: ["COMPLETED", "SETTLED"],
    allowedRoles: ["customer", "admin"],
  },
  REWORK_SCHEDULED: {
    allowedFrom: ["DISPUTED"],
    allowedRoles: ["admin", "system"],
  },
};

export class IllegalStateTransitionError extends Error {
  constructor(
    public fromStatus: ProjectLifecycleStatus,
    public toStatus: ProjectLifecycleStatus,
    public role: ProjectActorRole,
    details?: string
  ) {
    super(
      `Illegal transition from '${fromStatus}' to '${toStatus}' by role '${role}'. ${details || ""}`
    );
    this.name = "IllegalStateTransitionError";
  }
}

/**
 * Pure state transition validator
 */
export function validateStateTransition(params: {
  fromStatus: ProjectLifecycleStatus;
  toStatus: ProjectLifecycleStatus;
  actorRole: ProjectActorRole;
  hasStartOtpVerified?: boolean;
  hasEndOtpVerified?: boolean;
  hasBeforePhoto?: boolean;
  hasAfterPhoto?: boolean;
}) {
  const rule = PROJECT_TRANSITIONS[params.toStatus];
  if (!rule) {
    throw new IllegalStateTransitionError(params.fromStatus, params.toStatus, params.actorRole, "Unknown target state.");
  }

  // 1. Validate previous state
  if (!rule.allowedFrom.includes(params.fromStatus)) {
    throw new IllegalStateTransitionError(
      params.fromStatus,
      params.toStatus,
      params.actorRole,
      `State '${params.fromStatus}' is not allowed to transition to '${params.toStatus}'. Allowed origins: ${rule.allowedFrom.join(", ")}`
    );
  }

  // 2. Validate actor permissions
  if (!rule.allowedRoles.includes(params.actorRole)) {
    throw new IllegalStateTransitionError(
      params.fromStatus,
      params.toStatus,
      params.actorRole,
      `Role '${params.actorRole}' is not authorized to trigger '${params.toStatus}'. Allowed roles: ${rule.allowedRoles.join(", ")}`
    );
  }

  // 3. Enforce evidence constraints
  if (rule.requiresStartOtp && !params.hasStartOtpVerified) {
    throw new IllegalStateTransitionError(
      params.fromStatus,
      params.toStatus,
      params.actorRole,
      "Start-OTP verification is mandatory to transition to IN_PROGRESS."
    );
  }

  if (rule.requiresBeforePhoto && !params.hasBeforePhoto) {
    throw new IllegalStateTransitionError(
      params.fromStatus,
      params.toStatus,
      params.actorRole,
      "A BEFORE photo is strictly mandatory before commencing IN_PROGRESS work."
    );
  }

  if (rule.requiresEndOtp && !params.hasEndOtpVerified) {
    throw new IllegalStateTransitionError(
      params.fromStatus,
      params.toStatus,
      params.actorRole,
      "End-OTP verification is mandatory to transition to COMPLETED."
    );
  }

  if (rule.requiresAfterPhoto && !params.hasAfterPhoto) {
    throw new IllegalStateTransitionError(
      params.fromStatus,
      params.toStatus,
      params.actorRole,
      "An AFTER photo is strictly mandatory to transition to COMPLETED."
    );
  }

  return true;
}
