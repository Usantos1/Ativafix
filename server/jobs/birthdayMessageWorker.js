/**
 * Sincroniza a fila de aniversariantes do mês a partir de hoje.
 * Cada job fica agendado para o dia do aniversário no horário configurado.
 * @param {import('pg').Pool} pool
 */
export async function runBirthdayMessageSync(pool) {
  const service = await import('../services/birthdayMessageService.js');
  return service.syncBirthdayJobs(pool, null, { period: 'month' });
}

/**
 * Processa mensagens de aniversário já vencidas.
 * @param {import('pg').Pool} pool
 */
export async function runBirthdayMessageProcess(pool) {
  const service = await import('../services/birthdayMessageService.js');
  return service.processDueBirthdayMessages(pool, 30);
}

/**
 * Compatibilidade: sincroniza e envia mensagens de aniversário agendadas.
 * @param {import('pg').Pool} pool
 */
export async function runBirthdayMessageTick(pool) {
  const sync = await runBirthdayMessageSync(pool);
  const process = await runBirthdayMessageProcess(pool);
  return { sync, process };
}
