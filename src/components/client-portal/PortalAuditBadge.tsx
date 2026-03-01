/**
 * PortalAuditBadge - Badge de auditoria ativa
 * Estilo exato do HTML de referência
 */

import { memo } from "react";

function PortalAuditBadgeComponent() {
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 flex items-center gap-3">
      <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
        verified_user
      </span>
      <div>
        <p className="text-sm font-medium text-white">Auditoria Ativa</p>
        <p className="text-xs text-gray-500">
          Este portal segue as normas de transparência SQUAD FILM. Seus dados estão seguros.
        </p>
      </div>
    </div>
  );
}

export const PortalAuditBadge = memo(PortalAuditBadgeComponent);
