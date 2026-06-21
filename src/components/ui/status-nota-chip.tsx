/**
 * StatusNotaChip — chip de status FISCAL da nota, em um só lugar.
 *
 * Antes o mesmo mapa Record<StatusNota,{tone,icon}> vivia duplicado em os/page e
 * notas/page; aqui ele é a fonte única. Recebe só o `status` e resolve tom, ícone
 * e rótulo, delegando a aparência ao StatusChip (semáforo via tokens, sem cor crua).
 *
 * Semáforo (igual ao histórico):
 *  - autorizada            -> success (emitida com sucesso)
 *  - processando/rascunho  -> warning/neutro (em andamento, ainda não vale)
 *  - rejeitada/cancelada   -> danger (não vale fiscalmente)
 *
 * É client porque o consumidor (StatusChip + páginas) é client; mantém a fronteira
 * coerente sem forçar nada server-side.
 */

'use client';

import type { Icon } from '@phosphor-icons/react';
import {
  CheckCircle,
  HourglassMedium,
  PencilSimple,
  XCircle,
  Prohibit,
} from '@phosphor-icons/react';
import { STATUS_NOTA, type StatusNota } from '@/lib/supabase/notas';
import { StatusChip } from '@/components/ui/status-chip';

/** Tom do semáforo aceito pelo StatusChip. */
type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

/** Tom + ícone por status fiscal da nota. */
const map: Record<StatusNota, { tone: Tone; icon: Icon }> = {
  rascunho: { tone: 'neutral', icon: PencilSimple },
  processando: { tone: 'warning', icon: HourglassMedium },
  autorizada: { tone: 'success', icon: CheckCircle },
  rejeitada: { tone: 'danger', icon: XCircle },
  cancelada: { tone: 'danger', icon: Prohibit },
};

type StatusNotaChipProps = {
  /** Status fiscal da nota (define tom, ícone e rótulo). */
  status: StatusNota;
};

export function StatusNotaChip({ status }: StatusNotaChipProps) {
  const { tone, icon } = map[status];
  const label = STATUS_NOTA.find((x) => x.id === status)?.nome ?? status;
  return (
    <StatusChip tone={tone} icon={icon}>
      {label}
    </StatusChip>
  );
}
