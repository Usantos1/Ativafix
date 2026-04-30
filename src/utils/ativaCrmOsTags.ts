export const ATIVA_CRM_OS_TAG_IDS = {
  EM_MANUTENCAO: 2716,
  MANUTENCAO_REALIZADA: 2717,
} as const;

function normalizeStatus(status?: string | null): string {
  return String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getAtivaCrmOsTagId(status?: string | null): number | undefined {
  const normalized = normalizeStatus(status);
  if (!normalized) return undefined;

  if (
    normalized === 'finalizada' ||
    normalized === 'entregue' ||
    normalized === 'entregue_faturada' ||
    normalized.includes('manutencao_finalizada')
  ) {
    return ATIVA_CRM_OS_TAG_IDS.MANUTENCAO_REALIZADA;
  }

  if (
    normalized === 'aberta' ||
    normalized === 'aprovado' ||
    normalized === 'em_andamento' ||
    normalized.includes('em_manutencao') ||
    normalized.includes('manutencao')
  ) {
    return ATIVA_CRM_OS_TAG_IDS.EM_MANUTENCAO;
  }

  return undefined;
}
