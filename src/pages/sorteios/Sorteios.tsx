import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModernLayout } from '@/components/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Copy, ExternalLink, Plus, Trash2, Trophy, Ticket, Users, DollarSign, Shuffle, Settings, ShieldCheck } from 'lucide-react';
import { from } from '@/integrations/db/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { currencyFormatters, dateFormatters } from '@/utils/formatters';
import { cancelRaffleCouponManually, cancelRaffleManually, executeManualRaffle, getOrCreateCurrentRaffle, replaceRaffleTemplateVariables } from '@/utils/raffleService';
import { useValuesVisibility } from '@/hooks/useValuesVisibility';
import { MASKED_VALUE } from '@/components/dashboard/FinancialCards';
import type { Raffle, RaffleAuditLog, RaffleCoupon, RafflePrizeTier, RaffleSettings } from '@/types/raffle';

const DEFAULT_COUPON_TEMPLATE =
  'Olá, {cliente}! 😊\n\nObrigado por comprar na {empresa}.\n\nVocê recebeu seus números da sorte:\n\n{numeros_da_sorte}\n\nO sorteio será realizado no dia {data_sorteio} às {horario_sorteio}.\n\nVocê pode acompanhar o resultado por aqui:\n\n{link_acompanhamento}\n\nBoa sorte!';

const DEFAULT_WINNER_TEMPLATE =
  'Parabéns, {cliente}! 🎉\n\nO seu número da sorte {numero_sorteado} ganhou o {posicao_premio} do sorteio {nome_sorteio} da {empresa}.\n\nPrêmio: {premio}.\nValidade: {validade_premio}.\nRetirada: {retirada_premio}.\n\nObrigado por comprar com a gente!';

const renderWhatsAppFormattedText = (text: string) =>
  text.split(/(\*[^*\n]+\*)/g).map((part, index) => {
    if (/^\*[^*\n]+\*$/.test(part)) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part.slice(1, -1)}
        </strong>
      );
    }
    return part;
  });

const ensureWinnerPrizeVariables = (template?: string | null) => {
  let message = template || DEFAULT_WINNER_TEMPLATE;
  if (!message.includes('{premio}')) {
    message += '\n\nPrêmio: {premio}.';
  }
  if (!message.includes('{posicao_premio}')) {
    message = message.replace('foi o ganhador', 'ganhou o {posicao_premio}');
  }
  if (!message.includes('{validade_premio}')) {
    message += '\nValidade: {validade_premio}.';
  }
  if (!message.includes('{retirada_premio}')) {
    message += '\nRetirada: {retirada_premio}.';
  }
  return message;
};

const ensureCouponTrackingVariables = (template?: string | null) => {
  let message = template || DEFAULT_COUPON_TEMPLATE;
  if (!message.includes('{horario_sorteio}')) {
    message = message.replace('{data_sorteio}', '{data_sorteio} às {horario_sorteio}');
  }
  if (!message.includes('{link_acompanhamento}')) {
    message += '\n\nVocê pode acompanhar o resultado por aqui:\n\n{link_acompanhamento}';
  }
  return message;
};

const raffleStatusLabel: Record<string, string> = {
  open: 'Aberto',
  closed: 'Encerrado',
  drawn: 'Sorteado',
  cancelled: 'Cancelado',
};

const couponStatusLabel: Record<string, string> = {
  valid: 'Válido',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  winner: 'Ganhador',
  expired: 'Expirado',
};

const orderTypeLabel: Record<string, string> = {
  sale: 'Venda',
  service_order: 'Ordem de Serviço',
};

const auditActionLabel: Record<string, string> = {
  raffle_created: 'Sorteio criado',
  raffle_updated: 'Sorteio atualizado',
  raffle_cancelled: 'Sorteio cancelado',
  raffle_inactivated: 'Sorteio inativado',
  raffle_activated: 'Sorteio ativado',
  raffle_drawn: 'Sorteio realizado',
  coupon_generated: 'Cupom gerado',
  coupon_cancelled: 'Cupom cancelado',
  coupon_cancel_blocked_winner: 'Cancelamento bloqueado: cupom vencedor',
  coupon_skipped_invalid_customer: 'Cupom ignorado: cliente inválido',
  winner_selected: 'Ganhador selecionado',
  settings_updated: 'Configuração atualizada',
};

const auditOriginLabel: Record<string, string> = {
  system: 'Sistema',
  manual: 'Manual',
  admin: 'Administrador',
  public: 'Página pública',
};

const validTabs = new Set(['visao-geral', 'configuracoes', 'cupons', 'participantes', 'auditoria']);
const TABLE_PAGE_SIZE = 50;

const humanizeIdentifier = (value?: string | null) => {
  if (!value) return '-';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
};

const DEFAULT_PRIZE_TIERS: RafflePrizeTier[] = [
  { position: 1, type: 'voucher', description: 'Vale-compra', value: 100 },
  { position: 2, type: 'voucher', description: 'Vale-compra', value: 70 },
  { position: 3, type: 'voucher', description: 'Vale-compra', value: 30 },
];

const normalizePrizeTiers = (tiers?: RafflePrizeTier[] | null): RafflePrizeTier[] => {
  const source = Array.isArray(tiers) && tiers.length > 0 ? tiers : DEFAULT_PRIZE_TIERS;
  return source
    .slice(0, 3)
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((tier, index) => {
      const defaultTier = DEFAULT_PRIZE_TIERS[index] || DEFAULT_PRIZE_TIERS[0];
      const type = tier.type === 'product' ? 'product' : 'voucher';
      return {
        position: index + 1,
        type,
        description: tier.description || (type === 'product' ? 'Produto' : 'Vale-compra'),
        value: type === 'product' ? 0 : Number(tier.value || defaultTier.value || 0),
      };
    })
    .filter((tier, index) => index === 0 || tier.type === 'product' || tier.value > 0);
};

const maskPhone = (value?: string | null) => {
  const digits = String(value || '').replace(/\D+/g, '');
  if (!digits) return '-';
  return `****-${digits.slice(-4)}`;
};

const maskDocument = (value?: string | null) => {
  const digits = String(value || '').replace(/\D+/g, '');
  if (!digits) return '-';
  return `${digits.slice(0, 5)}******`;
};

function TablePagination({
  page,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / TABLE_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * TABLE_PAGE_SIZE + 1;
  const end = Math.min(safePage * TABLE_PAGE_SIZE, totalItems);

  if (totalItems <= TABLE_PAGE_SIZE) {
    return (
      <div className="flex items-center justify-end border-t px-2 py-3 text-xs text-muted-foreground">
        {totalItems} registro(s)
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t px-2 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Mostrando {start}-{end} de {totalItems} registro(s)
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-full px-3 text-xs"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Anterior
        </Button>
        <span className="min-w-[88px] text-center">
          Página {safePage} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-full px-3 text-xs"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}

const sumUniqueSourceAmounts = (coupons: RaffleCoupon[]) => {
  const seen = new Set<string>();
  return coupons.reduce((sum, coupon) => {
    const sourceKey =
      coupon.sale_id ? `sale:${coupon.sale_id}` :
      coupon.service_order_id ? `os:${coupon.service_order_id}` :
      `coupon:${coupon.id}`;
    if (seen.has(sourceKey)) return sum;
    seen.add(sourceKey);
    return sum + Number(coupon.source_total_amount || 0);
  }, 0);
};

const createTrackingToken = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
};

const toBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return ['true', '1', 'sim', 'yes'].includes(value.trim().toLowerCase());
  return Boolean(value);
};

const formatPromptDateTime = (date = new Date(Date.now() + 2 * 60 * 1000)) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parsePromptDrawDate = (value: string) => {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/);
  if (!match) return null;
  const [, year, month, day, hour = '20', minute = '00'] = match;
  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    iso: `${year}-${month}-${day}T${hour}:${minute}:00-03:00`,
    dateOnly: `${year}-${month}-${day}`,
    date: parsed,
  };
};

const formatDateTimeLocalInput = (value?: string | null) => {
  if (!value) return '';
  const valueText = String(value);
  const match = valueText.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(valueText) || /(?:Z|[+-]\d{2}:?\d{2})\s*$/.test(valueText);
  if (match && !hasExplicitTimezone) {
    const [, year, month, day, hour, minute] = match;
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const formatRaffleDrawDateTime = (value?: string | null) => {
  if (!value) return '-';
  const valueText = String(value);
  const match = valueText.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(valueText) || /(?:Z|[+-]\d{2}:?\d{2})\s*$/.test(valueText);
  if (match && !hasExplicitTimezone) {
    const [, year, month, day, hour, minute] = match;
    return `${day}/${month}/${year} às ${hour}:${minute}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(',', ' às');
};

const parseDateTimeLocalDrawDate = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    iso: `${year}-${month}-${day}T${hour}:${minute}:00-03:00`,
    dateOnly: `${year}-${month}-${day}`,
    referenceMonth: Number(month),
    referenceYear: Number(year),
    drawTime: `${hour}:${minute}`,
  };
};

const emptySettings = (companyId?: string | null): Partial<RaffleSettings> => ({
  company_id: companyId || null,
  is_active: false,
  campaign_name: 'Sorteio Mensal Ativa FIX',
  amount_per_coupon: 10,
  initial_number: 100,
  draw_day_type: 'last_day_of_month',
  fixed_draw_day: null,
  draw_time: '20:00',
  auto_draw_enabled: false,
  send_coupon_message_enabled: true,
  ativa_crm_coupon_tag_id: 201,
  send_winner_message_enabled: true,
  seller_prize_enabled: false,
  seller_prize_value: 50,
  seller_prize_requires_no_absence: true,
  coupon_message_template: DEFAULT_COUPON_TEMPLATE,
  winner_message_template: DEFAULT_WINNER_TEMPLATE,
  prize_description: 'Vale-compra',
  prize_value: 100,
  prize_validity_days: 7,
  prize_redeem_instructions: 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.',
  prize_tiers: DEFAULT_PRIZE_TIERS,
  rounding_rule: 'complete_value',
});

const normalizeSettingsRow = (settingsData: any, companyId?: string | null): Partial<RaffleSettings> => {
  if (!settingsData) return emptySettings(companyId);
  return {
    ...settingsData,
    is_default_coupon_campaign: toBoolean(settingsData.is_default_coupon_campaign),
    coupon_message_template: ensureCouponTrackingVariables(settingsData.coupon_message_template),
    winner_message_template: ensureWinnerPrizeVariables(settingsData.winner_message_template),
    seller_prize_enabled: toBoolean(settingsData.seller_prize_enabled),
    seller_prize_value: Number(settingsData.seller_prize_value || 50),
    seller_prize_requires_no_absence: toBoolean(settingsData.seller_prize_requires_no_absence, true),
    ativa_crm_coupon_tag_id: Number(settingsData.ativa_crm_coupon_tag_id || 201),
    prize_description: settingsData.prize_description || 'Vale-compra',
    prize_value: Number(settingsData.prize_value || 100),
    prize_validity_days: Number(settingsData.prize_validity_days || 7),
    prize_redeem_instructions: settingsData.prize_redeem_instructions || 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.',
    prize_tiers: normalizePrizeTiers(settingsData.prize_tiers),
  };
};

export default function Sorteios() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [valuesVisible] = useValuesVisibility();
  const companyId = user?.company_id || null;
  const [activeTab, setActiveTab] = useState(() => (tab && validTabs.has(tab) ? tab : 'visao-geral'));
  const [settings, setSettings] = useState<Partial<RaffleSettings>>(() => emptySettings(companyId));
  const [settingsList, setSettingsList] = useState<RaffleSettings[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [coupons, setCoupons] = useState<RaffleCoupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<RaffleAuditLog[]>([]);
  const [clientesMap, setClientesMap] = useState<Record<string, any>>({});
  const [vendedoresMap, setVendedoresMap] = useState<Record<string, string>>({});
  const [couponSearch, setCouponSearch] = useState('');
  const [couponPage, setCouponPage] = useState(1);
  const [participantsPage, setParticipantsPage] = useState(1);
  const [companyName, setCompanyName] = useState('Empresa');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedRaffleDrawDate, setSelectedRaffleDrawDate] = useState('');
  const [previewType, setPreviewType] = useState<'coupon' | 'winner'>('winner');

  const currentRaffle = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const defaultSetting = settingsList.find((item) => item.is_default_coupon_campaign);
    return (
      (defaultSetting && raffles.find((r) => r.raffle_setting_id === defaultSetting.id && r.status === 'open')) ||
      raffles.find((r) => r.reference_month === month && r.reference_year === year && r.status === 'open') ||
      raffles[0]
    );
  }, [raffles, settingsList]);

  const settingsById = useMemo(
    () => Object.fromEntries(settingsList.map((item) => [item.id, item])) as Record<string, RaffleSettings>,
    [settingsList],
  );

  const configuredRaffle = useMemo(
    () => raffles.find((raffle) => settings.id && raffle.raffle_setting_id === settings.id) || null,
    [raffles, settings.id],
  );

  useEffect(() => {
    const nextTab = tab && validTabs.has(tab) ? tab : 'visao-geral';
    setActiveTab(nextTab);
  }, [tab]);

  useEffect(() => {
    setCouponPage(1);
  }, [couponSearch]);

  const validCoupons = useMemo(() => coupons.filter((c) => c.status === 'valid' || c.status === 'winner'), [coupons]);
  const eligibleAmountByRaffle = useMemo(() => {
    return Object.fromEntries(
      Array.from(new Set(validCoupons.map((coupon) => coupon.raffle_id))).map((raffleId) => [
        raffleId,
        sumUniqueSourceAmounts(validCoupons.filter((coupon) => coupon.raffle_id === raffleId)),
      ]),
    ) as Record<string, number>;
  }, [validCoupons]);
  const participants = useMemo(() => {
    const ids = new Set(validCoupons.map((c) => c.customer_id).filter(Boolean));
    return Array.from(ids).map((id) => {
      const customerCoupons = validCoupons.filter((c) => c.customer_id === id);
      return {
        customer_id: id as string,
        cliente: clientesMap[id as string],
        total_coupons: customerCoupons.length,
        total_amount: sumUniqueSourceAmounts(customerCoupons),
        numbers: customerCoupons.map((c) => c.coupon_number).join(', '),
      };
    });
  }, [clientesMap, validCoupons]);

  const filteredCoupons = useMemo(() => {
    const term = couponSearch.trim().toLowerCase();
    if (!term) return coupons;
    const digits = term.replace(/\D+/g, '');
    return coupons.filter((coupon) => {
      const cliente = coupon.customer_id ? clientesMap[coupon.customer_id] : null;
      const vendedor = coupon.generated_by_user_id ? vendedoresMap[coupon.generated_by_user_id] : '';
      return (
        String(coupon.coupon_number).includes(digits || term) ||
        String(cliente?.nome || '').toLowerCase().includes(term) ||
        String(vendedor || '').toLowerCase().includes(term) ||
        String(coupon.tracking_token || '').toLowerCase().includes(term)
      );
    });
  }, [clientesMap, couponSearch, coupons, vendedoresMap]);

  const paginatedCoupons = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / TABLE_PAGE_SIZE));
    const safePage = Math.min(Math.max(couponPage, 1), totalPages);
    return filteredCoupons.slice((safePage - 1) * TABLE_PAGE_SIZE, safePage * TABLE_PAGE_SIZE);
  }, [couponPage, filteredCoupons]);

  const paginatedParticipants = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(participants.length / TABLE_PAGE_SIZE));
    const safePage = Math.min(Math.max(participantsPage, 1), totalPages);
    return participants.slice((safePage - 1) * TABLE_PAGE_SIZE, safePage * TABLE_PAGE_SIZE);
  }, [participants, participantsPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / TABLE_PAGE_SIZE));
    if (couponPage > totalPages) setCouponPage(totalPages);
  }, [couponPage, filteredCoupons.length]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(participants.length / TABLE_PAGE_SIZE));
    if (participantsPage > totalPages) setParticipantsPage(totalPages);
  }, [participants.length, participantsPage]);

  const loadData = async (preferredSettingId?: string | null) => {
    setIsLoading(true);
    try {
      const { data: settingsRows } = await from('raffle_settings')
        .select('*')
        .eq('company_id', companyId)
        .order('is_default_coupon_campaign', { ascending: false })
        .order('updated_at', { ascending: false })
        .execute();

      if (companyId) {
        const { data: company } = await from('companies')
          .select('name')
          .eq('id', companyId)
          .maybeSingle()
          .execute();
        setCompanyName(company?.name || 'Empresa');
      }

      const normalizedSettings = ((settingsRows || []) as RaffleSettings[]).map((row) => normalizeSettingsRow(row, companyId) as RaffleSettings);
      setSettingsList(normalizedSettings);

      const { data: rafflesData } = await from('raffles')
        .select('*')
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false })
        .limit(24)
        .execute();
      setRaffles((rafflesData || []) as Raffle[]);

      const now = new Date();
      const selectedRaffle =
        (preferredSettingId && (rafflesData || []).find((raffle: Raffle) => raffle.raffle_setting_id === preferredSettingId)) ||
        (rafflesData || []).find((raffle: Raffle) =>
          normalizedSettings.some((item) => item.is_default_coupon_campaign && item.id === raffle.raffle_setting_id && raffle.status === 'open')
        ) ||
        (rafflesData || []).find((raffle: Raffle) => raffle.reference_month === now.getMonth() + 1 && raffle.reference_year === now.getFullYear() && raffle.status === 'open') ||
        (rafflesData || [])[0];
      const selectedSettings = normalizedSettings.find((item) => item.id === selectedRaffle?.raffle_setting_id)
        || normalizedSettings.find((item) => item.is_default_coupon_campaign)
        || normalizedSettings[0];
      setSettings(selectedSettings || emptySettings(companyId));
      setSelectedRaffleDrawDate(formatDateTimeLocalInput(selectedRaffle?.draw_date));

      const raffleIds = (rafflesData || []).map((r: Raffle) => r.id);
      let couponsData: RaffleCoupon[] = [];
      if (raffleIds.length > 0) {
        const { data } = await from('raffle_coupons')
          .select('*')
          .in('raffle_id', raffleIds)
          .order('coupon_number', { ascending: false })
          .limit(500)
          .execute();
        couponsData = (data || []) as RaffleCoupon[];
        couponsData = await ensureMissingTrackingTokens(couponsData);
        setCoupons(couponsData);
      } else {
        setCoupons([]);
      }

      const customerIds = Array.from(new Set(couponsData.map((c) => c.customer_id).filter(Boolean))) as string[];
      if (customerIds.length > 0) {
        const { data: clientes } = await from('clientes')
          .select('id, nome, telefone, whatsapp, cpf_cnpj, cep, email, data_nascimento')
          .in('id', customerIds)
          .execute();
        setClientesMap(Object.fromEntries((clientes || []).map((c: any) => [c.id, c])));
      } else {
        setClientesMap({});
      }

      const sellerIds = Array.from(new Set(couponsData.map((c) => c.generated_by_user_id).filter(Boolean))) as string[];
      const saleIds = Array.from(new Set(couponsData.map((c) => c.sale_id).filter(Boolean))) as string[];
      let salesMap: Record<string, { vendedor_id?: string | null; vendedor_nome?: string | null }> = {};
      if (saleIds.length > 0) {
        const { data: sales } = await from('sales')
          .select('id, vendedor_id, vendedor_nome')
          .in('id', saleIds)
          .execute();
        salesMap = Object.fromEntries((sales || []).map((sale: any) => [sale.id, sale]));
        (sales || []).forEach((sale: any) => {
          if (sale.vendedor_id) sellerIds.push(sale.vendedor_id);
        });
      }
      const uniqueSellerIds = Array.from(new Set(sellerIds));
      if (uniqueSellerIds.length > 0 || Object.keys(salesMap).length > 0) {
        const [profilesResult, usersResult] = uniqueSellerIds.length > 0
          ? await Promise.all([
              from('profiles')
                .select('user_id, display_name, full_name')
                .in('user_id', uniqueSellerIds)
                .execute(),
              from('users')
                .select('id, display_name, email')
                .in('id', uniqueSellerIds)
                .execute(),
            ])
          : [{ data: [] }, { data: [] }];
        const nextMap: Record<string, string> = {};
        Object.values(salesMap).forEach((sale: any) => {
          if (sale.vendedor_id && sale.vendedor_nome) nextMap[sale.vendedor_id] = sale.vendedor_nome;
        });
        (usersResult.data || []).forEach((seller: any) => {
          nextMap[seller.id] = nextMap[seller.id] || seller.display_name || seller.email || 'Vendedor';
        });
        (profilesResult.data || []).forEach((seller: any) => {
          nextMap[seller.user_id] = seller.display_name || seller.full_name || nextMap[seller.user_id] || 'Vendedor';
        });
        couponsData = couponsData.map((coupon) => {
          if (coupon.generated_by_user_id || !coupon.sale_id) return coupon;
          const sale = salesMap[coupon.sale_id];
          return sale?.vendedor_id ? { ...coupon, generated_by_user_id: sale.vendedor_id } : coupon;
        });
        setCoupons(couponsData);
        setVendedoresMap(nextMap);
      } else {
        setVendedoresMap({});
      }

      const { data: logs } = await from('raffle_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
        .execute();
      setAuditLogs((logs || []) as RaffleAuditLog[]);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar sorteios', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const ensureMissingTrackingTokens = async (rows: RaffleCoupon[]) => {
    if (!companyId) return rows;
    const groups = new Map<string, { raffleId: string; customerId: string; token: string }>();

    rows.forEach((coupon) => {
      if (!coupon.customer_id || !coupon.raffle_id) return;
      const key = `${coupon.raffle_id}:${coupon.customer_id}`;
      const existingGroup = groups.get(key);
      if (existingGroup) {
        if (coupon.tracking_token) existingGroup.token = coupon.tracking_token;
        return;
      }
      groups.set(key, {
        raffleId: coupon.raffle_id,
        customerId: coupon.customer_id,
        token: coupon.tracking_token || createTrackingToken(),
      });
    });

    const missingGroups = Array.from(groups.values()).filter((group) =>
      rows.some((coupon) =>
        coupon.raffle_id === group.raffleId &&
        coupon.customer_id === group.customerId &&
        !coupon.tracking_token
      )
    );

    for (const group of missingGroups) {
      const { error } = await from('raffle_coupons')
        .update({ tracking_token: group.token, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('raffle_id', group.raffleId)
        .eq('customer_id', group.customerId)
        .is('tracking_token', null)
        .execute();
      if (error) {
        console.warn('[Sorteio] Não foi possível preencher token de acompanhamento:', error);
        groups.delete(`${group.raffleId}:${group.customerId}`);
      }
    }

    return rows.map((coupon) => {
      if (coupon.tracking_token || !coupon.customer_id) return coupon;
      const group = groups.get(`${coupon.raffle_id}:${coupon.customer_id}`);
      return group ? { ...coupon, tracking_token: group.token } : coupon;
    });
  };

  const handleSaveSettings = async () => {
    if (!companyId) {
      toast({ title: 'Empresa não identificada', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const winnerMessageTemplate = ensureWinnerPrizeVariables(settings.winner_message_template);
      const couponMessageTemplate = ensureCouponTrackingVariables(settings.coupon_message_template);
      const parsedSelectedDrawDate = selectedRaffleDrawDate ? parseDateTimeLocalDrawDate(selectedRaffleDrawDate) : null;
      if (selectedRaffleDrawDate && !parsedSelectedDrawDate) {
        toast({ title: 'Data do sorteio inválida', description: 'Informe uma data e hora válidas para esta campanha.', variant: 'destructive' });
        return;
      }

      const payload = {
        company_id: companyId,
        is_active: !!settings.is_active,
        campaign_name: settings.campaign_name || 'Sorteio Mensal',
        amount_per_coupon: Number(settings.amount_per_coupon || 10),
        initial_number: Number(settings.initial_number || 100),
        draw_day_type: settings.draw_day_type || 'last_day_of_month',
        fixed_draw_day: settings.draw_day_type === 'fixed_day' ? Number(settings.fixed_draw_day || 1) : null,
        draw_time: parsedSelectedDrawDate?.drawTime || settings.draw_time || '20:00',
        auto_draw_enabled: !!settings.auto_draw_enabled,
        send_coupon_message_enabled: !!settings.send_coupon_message_enabled,
        is_default_coupon_campaign: settings.is_default_coupon_campaign === true || settingsList.length === 0,
        ativa_crm_coupon_tag_id: settings.ativa_crm_coupon_tag_id ? Number(settings.ativa_crm_coupon_tag_id) : null,
        send_winner_message_enabled: !!settings.send_winner_message_enabled,
        seller_prize_enabled: settings.seller_prize_enabled === true,
        seller_prize_value: Number(settings.seller_prize_value || 50),
        seller_prize_requires_no_absence: settings.seller_prize_requires_no_absence !== false,
        coupon_message_template: couponMessageTemplate,
        winner_message_template: winnerMessageTemplate,
        prize_description: settings.prize_description || 'Vale-compra',
        prize_value: Number(normalizePrizeTiers(settings.prize_tiers)[0]?.value || settings.prize_value || 100),
        prize_validity_days: Number(settings.prize_validity_days || 7),
        prize_redeem_instructions: settings.prize_redeem_instructions || 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.',
        prize_tiers: normalizePrizeTiers(settings.prize_tiers),
        rounding_rule: 'complete_value',
        updated_at: new Date().toISOString(),
      };

      let savedSettings: RaffleSettings | null = null;

      if (payload.is_default_coupon_campaign) {
        await from('raffle_settings')
          .update({ is_default_coupon_campaign: false, updated_at: new Date().toISOString() })
          .eq('company_id', companyId)
          .execute();
      }

      if (settings.id) {
        const { error } = await from('raffle_settings').update(payload).eq('id', settings.id).execute();
        if (error) throw error;
        savedSettings = { ...(settings as RaffleSettings), ...payload, id: settings.id };
      } else {
        const { data, error } = await from('raffle_settings').insert(payload).select().single();
        if (error) throw error;
        savedSettings = data as RaffleSettings;
        setSettings(savedSettings);
      }

      await from('raffle_audit_logs').insert({
        company_id: companyId,
        user_id: user?.id || null,
        action: settings.id ? 'settings_updated' : 'settings_created',
        origin: 'user',
        new_data: payload,
      });

      if (savedSettings) {
        const linkedRafflesForSettings = raffles.filter((raffle) => raffle.raffle_setting_id === savedSettings?.id);
        if (linkedRafflesForSettings.length > 0) {
          for (const raffle of linkedRafflesForSettings) {
            await from('raffles')
              .update({
                name: savedSettings.campaign_name || raffle.name,
                ...(parsedSelectedDrawDate ? {
                  draw_date: parsedSelectedDrawDate.iso,
                  start_date: parsedSelectedDrawDate.dateOnly,
                  end_date: parsedSelectedDrawDate.dateOnly,
                  reference_month: parsedSelectedDrawDate.referenceMonth,
                  reference_year: parsedSelectedDrawDate.referenceYear,
                } : {}),
                prize_description: savedSettings.prize_description || 'Vale-compra',
                prize_value: Number(savedSettings.prize_value || 100),
                prize_validity_days: Number(savedSettings.prize_validity_days || 7),
                prize_redeem_instructions: savedSettings.prize_redeem_instructions || 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.',
                prize_tiers: normalizePrizeTiers(savedSettings.prize_tiers),
                updated_at: new Date().toISOString(),
              })
              .eq('id', raffle.id)
              .execute();
          }
        } else if (savedSettings.is_active) {
          await getOrCreateCurrentRaffle(savedSettings, companyId);
        }
      }

      toast({ title: 'Configurações salvas' });
      await loadData(savedSettings?.id);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraw = async (raffle: Raffle) => {
    const validCouponsCount = coupons.filter((coupon) => coupon.raffle_id === raffle.id && coupon.status === 'valid').length;
    if (validCouponsCount <= 0) {
      toast({
        title: 'Nenhum cupom válido',
        description: 'Este sorteio ainda não possui cupons válidos para sortear.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(`Executar o sorteio "${raffle.name}"? Essa ação não pode ser refeita sem auditoria.`);
    if (!confirmed) return;

    setIsDrawing(true);
    try {
      const result = await executeManualRaffle({
        raffleId: raffle.id,
        companyId,
        userId: user?.id,
      });
      toast({
        title: 'Sorteio realizado',
        description: `${result.winners?.length || 1} prêmio(s) sorteado(s).`,
      });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao sortear', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsDrawing(false);
    }
  };

  const handleCancelCoupon = async (coupon: RaffleCoupon) => {
    if (coupon.status === 'winner') {
      toast({ title: 'Cupom vencedor', description: 'Cupom vencedor não pode ser cancelado por aqui.', variant: 'destructive' });
      return;
    }
    if (coupon.status === 'cancelled') return;
    const reason = window.prompt(`Motivo para cancelar o cupom #${coupon.coupon_number}:`, 'Cancelado manualmente');
    if (reason === null) return;
    try {
      await cancelRaffleCouponManually({
        companyId,
        couponId: coupon.id,
        userId: user?.id || null,
        reason: reason || 'Cancelado manualmente',
      });
      toast({ title: 'Cupom cancelado' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao cancelar cupom', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleCancelRaffle = async (raffle: Raffle) => {
    if (raffle.status === 'drawn') {
      toast({ title: 'Sorteio já realizado', description: 'Sorteio realizado não pode ser cancelado por aqui.', variant: 'destructive' });
      return;
    }
    const reason = window.prompt(`Motivo para cancelar o sorteio "${raffle.name}":`, 'Sorteio cancelado manualmente');
    if (reason === null) return;
    try {
      await cancelRaffleManually({
        raffleId: raffle.id,
        companyId,
        userId: user?.id || null,
        reason: reason || 'Sorteio cancelado manualmente',
      });
      toast({ title: 'Sorteio cancelado' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao cancelar sorteio', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const createRaffleFromBase = async (params: {
    baseRaffle?: Raffle | null;
    copyCoupons?: boolean;
  } = {}) => {
    if (!companyId) {
      toast({ title: 'Empresa não identificada', variant: 'destructive' });
      return;
    }

    const baseSettings = params.baseRaffle?.raffle_setting_id
      ? (settingsById[params.baseRaffle.raffle_setting_id] || settings)
      : settings;
    const baseName = params.baseRaffle
      ? `${params.baseRaffle.name} - Teste`
      : `${baseSettings.campaign_name || 'Sorteio Mensal'} - Teste`;
    const name = window.prompt('Nome do novo sorteio:', baseName);
    if (name === null) return;

    const dateInput = window.prompt('Data e hora do sorteio (AAAA-MM-DD HH:mm):', formatPromptDateTime());
    if (dateInput === null) return;
    const parsedDrawDate = parsePromptDrawDate(dateInput);
    if (!parsedDrawDate) {
      toast({ title: 'Data inválida', description: 'Use o formato AAAA-MM-DD HH:mm.', variant: 'destructive' });
      return;
    }

    const referenceMonth = parsedDrawDate.date.getMonth() + 1;
    const referenceYear = parsedDrawDate.date.getFullYear();
    const normalizedTiers = normalizePrizeTiers(params.baseRaffle?.prize_tiers || baseSettings.prize_tiers);

    setIsSaving(true);
    try {
      const settingsPayload = {
        company_id: companyId,
        is_active: toBoolean(baseSettings.is_active, true),
        is_default_coupon_campaign: false,
        campaign_name: name.trim() || baseName,
        amount_per_coupon: Number(baseSettings.amount_per_coupon || 10),
        initial_number: Number(baseSettings.initial_number || 100),
        draw_day_type: baseSettings.draw_day_type || 'last_day_of_month',
        fixed_draw_day: baseSettings.draw_day_type === 'fixed_day' ? Number(baseSettings.fixed_draw_day || 1) : null,
        draw_time: baseSettings.draw_time || `${String(parsedDrawDate.date.getHours()).padStart(2, '0')}:${String(parsedDrawDate.date.getMinutes()).padStart(2, '0')}`,
        auto_draw_enabled: !!baseSettings.auto_draw_enabled,
        send_coupon_message_enabled: !!baseSettings.send_coupon_message_enabled,
        ativa_crm_coupon_tag_id: baseSettings.ativa_crm_coupon_tag_id ? Number(baseSettings.ativa_crm_coupon_tag_id) : null,
        send_winner_message_enabled: !!baseSettings.send_winner_message_enabled,
        seller_prize_enabled: baseSettings.seller_prize_enabled === true,
        seller_prize_value: Number(baseSettings.seller_prize_value || 50),
        seller_prize_requires_no_absence: baseSettings.seller_prize_requires_no_absence !== false,
        coupon_message_template: ensureCouponTrackingVariables(baseSettings.coupon_message_template),
        winner_message_template: ensureWinnerPrizeVariables(baseSettings.winner_message_template),
        prize_description: params.baseRaffle?.prize_description || baseSettings.prize_description || 'Vale-compra',
        prize_value: Number(params.baseRaffle?.prize_value || baseSettings.prize_value || normalizedTiers[0]?.value || 100),
        prize_validity_days: Number(params.baseRaffle?.prize_validity_days || baseSettings.prize_validity_days || 7),
        prize_redeem_instructions: params.baseRaffle?.prize_redeem_instructions || baseSettings.prize_redeem_instructions || 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.',
        prize_tiers: normalizedTiers,
        rounding_rule: 'complete_value',
        updated_at: new Date().toISOString(),
      };
      const { data: createdSettings, error: settingsError } = await from('raffle_settings')
        .insert(settingsPayload)
        .select()
        .single();
      if (settingsError) throw settingsError;

      const { data: created, error } = await from('raffles')
        .insert({
          company_id: companyId,
          raffle_setting_id: createdSettings.id,
          name: name.trim() || baseName,
          reference_month: referenceMonth,
          reference_year: referenceYear,
          start_date: parsedDrawDate.dateOnly,
          end_date: parsedDrawDate.dateOnly,
          draw_date: parsedDrawDate.iso,
          status: 'open',
          total_coupons: 0,
          total_participants: 0,
          eligible_sales_amount: 0,
          prize_description: settingsPayload.prize_description,
          prize_value: settingsPayload.prize_value,
          prize_validity_days: settingsPayload.prize_validity_days,
          prize_redeem_instructions: settingsPayload.prize_redeem_instructions,
          prize_tiers: normalizedTiers,
        })
        .select()
        .single();
      if (error) throw error;

      let copiedCoupons: RaffleCoupon[] = [];
      if (params.baseRaffle && params.copyCoupons) {
        const sourceCoupons = coupons.filter((coupon) => coupon.raffle_id === params.baseRaffle?.id);
        const tokenByCustomer = new Map<string, string>();
        const duplicatedCoupons = sourceCoupons.map((coupon) => {
          const tokenKey = coupon.customer_id || coupon.id;
          if (!tokenByCustomer.has(tokenKey)) tokenByCustomer.set(tokenKey, createTrackingToken());
          return {
            company_id: coupon.company_id || companyId,
            raffle_id: created.id,
            customer_id: coupon.customer_id || null,
            sale_id: coupon.sale_id || null,
            service_order_id: coupon.service_order_id || null,
            order_type: coupon.order_type,
            coupon_number: coupon.coupon_number,
            tracking_token: tokenByCustomer.get(tokenKey),
            eligible_amount: Number(coupon.eligible_amount || baseSettings.amount_per_coupon || 0),
            source_total_amount: Number(coupon.source_total_amount || 0),
            status: 'valid',
            generated_by_user_id: coupon.generated_by_user_id || null,
            generated_at: new Date().toISOString(),
          };
        });

        if (duplicatedCoupons.length > 0) {
          const { data: insertedCoupons, error: couponError } = await from('raffle_coupons')
            .insert(duplicatedCoupons)
            .select()
            .execute();
          if (couponError) throw couponError;
          copiedCoupons = (insertedCoupons || []) as RaffleCoupon[];
          const participantsCount = new Set(copiedCoupons.map((coupon) => coupon.customer_id).filter(Boolean)).size;
          await from('raffles')
            .update({
              total_coupons: copiedCoupons.length,
              total_participants: participantsCount,
              eligible_sales_amount: sumUniqueSourceAmounts(copiedCoupons),
            })
            .eq('id', created.id)
            .execute();
        }
      }

      await from('raffle_audit_logs').insert({
        company_id: companyId,
        raffle_id: created.id,
        user_id: user?.id || null,
        action: params.baseRaffle ? 'raffle_duplicated' : 'raffle_created',
        origin: 'user',
        new_data: created,
        metadata: {
          base_raffle_id: params.baseRaffle?.id || null,
          copied_coupons: copiedCoupons.length,
          reference_month: referenceMonth,
          reference_year: referenceYear,
        },
      });

      toast({
        title: params.baseRaffle ? 'Sorteio duplicado' : 'Sorteio criado',
        description: copiedCoupons.length > 0 ? `${copiedCoupons.length} cupom(ns) copiados para teste.` : undefined,
      });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao criar sorteio', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInactivateRaffle = async (raffle: Raffle) => {
    if (raffle.status !== 'open') {
      toast({ title: 'Somente sorteios abertos podem ser inativados', variant: 'destructive' });
      return;
    }
    const confirm = window.confirm(`Inativar o sorteio "${raffle.name}"? Ele ficará encerrado e não será executado automaticamente.`);
    if (!confirm) return;

    try {
      const { error } = await from('raffles')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', raffle.id)
        .execute();
      if (error) throw error;
      await from('raffle_audit_logs').insert({
        company_id: companyId,
        raffle_id: raffle.id,
        user_id: user?.id || null,
        action: 'raffle_inactivated',
        origin: 'user',
        old_data: raffle,
        new_data: { status: 'closed' },
      });
      toast({ title: 'Sorteio inativado' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao inativar sorteio', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleActivateRaffle = async (raffle: Raffle) => {
    if (raffle.status === 'drawn') {
      toast({ title: 'Sorteio já realizado', description: 'Sorteio sorteado não pode voltar para aberto.', variant: 'destructive' });
      return;
    }
    if (raffle.status === 'open') return;

    const confirm = window.confirm(`Ativar novamente o sorteio "${raffle.name}"? Ele voltará para aberto e poderá ser sorteado.`);
    if (!confirm) return;

    try {
      const { error } = await from('raffles')
        .update({
          status: 'open',
          cancelled_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', raffle.id)
        .execute();
      if (error) throw error;

      if (raffle.raffle_setting_id) {
        await from('raffle_settings')
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', raffle.raffle_setting_id)
          .execute();
      }

      await from('raffle_audit_logs').insert({
        company_id: companyId,
        raffle_id: raffle.id,
        user_id: user?.id || null,
        action: 'raffle_activated',
        origin: 'user',
        old_data: raffle,
        new_data: { status: 'open' },
      });

      toast({ title: 'Sorteio ativado' });
      await loadData(raffle.raffle_setting_id);
    } catch (error: any) {
      toast({ title: 'Erro ao ativar sorteio', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleDeleteRaffle = async (raffle: Raffle) => {
    const typed = window.prompt(`Para excluir definitivamente "${raffle.name}", digite EXCLUIR:`);
    if (typed !== 'EXCLUIR') return;

    try {
      const settingId = raffle.raffle_setting_id || null;
      const wasDefault = !!(settingId && settingsById[settingId]?.is_default_coupon_campaign);

      const { error } = await from('raffles')
        .delete()
        .eq('id', raffle.id)
        .execute();
      if (error) throw error;

      if (settingId) {
        const { data: remainingRaffles } = await from('raffles')
          .select('id')
          .eq('raffle_setting_id', settingId)
          .limit(1)
          .execute();

        if (!remainingRaffles || remainingRaffles.length === 0) {
          await from('raffle_settings')
            .delete()
            .eq('id', settingId)
            .execute();
        }
      }

      if (wasDefault && companyId) {
        const { data: nextSettings } = await from('raffle_settings')
          .select('id')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .execute();
        if (nextSettings?.[0]?.id) {
          await from('raffle_settings')
            .update({ is_default_coupon_campaign: true, updated_at: new Date().toISOString() })
            .eq('id', nextSettings[0].id)
            .execute();
        }
      }

      await from('raffle_audit_logs').insert({
        company_id: companyId,
        user_id: user?.id || null,
        action: 'raffle_deleted',
        origin: 'user',
        old_data: raffle,
        metadata: { raffle_id: raffle.id, raffle_setting_id: settingId },
      });

      toast({ title: 'Sorteio excluído' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir sorteio', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleConfigureRaffle = async (raffle: Raffle) => {
    if (!companyId) {
      toast({ title: 'Empresa não identificada', variant: 'destructive' });
      return;
    }

    const raffleSettings = raffle.raffle_setting_id ? settingsById[raffle.raffle_setting_id] : null;
    const baseSettings = normalizeSettingsRow(raffleSettings || settings, companyId);
    const sharedSettingsCount = raffle.raffle_setting_id
      ? raffles.filter((item) => item.raffle_setting_id === raffle.raffle_setting_id).length
      : 0;

    if (!raffleSettings && !settings.id) {
      toast({ title: 'Configuração não encontrada para esta campanha', variant: 'destructive' });
      return;
    }

    if (!raffle.raffle_setting_id || sharedSettingsCount > 1) {
      setIsSaving(true);
      try {
        const clonedSettingsPayload = {
          company_id: companyId,
          is_active: raffle.status === 'open',
          is_default_coupon_campaign: false,
          campaign_name: raffle.name || baseSettings.campaign_name || 'Sorteio Mensal',
          amount_per_coupon: Number(baseSettings.amount_per_coupon || 10),
          initial_number: Number(baseSettings.initial_number || 100),
          draw_day_type: baseSettings.draw_day_type || 'last_day_of_month',
          fixed_draw_day: baseSettings.draw_day_type === 'fixed_day' ? Number(baseSettings.fixed_draw_day || 1) : null,
          draw_time: baseSettings.draw_time || '20:00',
          auto_draw_enabled: !!baseSettings.auto_draw_enabled,
          send_coupon_message_enabled: !!baseSettings.send_coupon_message_enabled,
          ativa_crm_coupon_tag_id: baseSettings.ativa_crm_coupon_tag_id ? Number(baseSettings.ativa_crm_coupon_tag_id) : null,
          send_winner_message_enabled: !!baseSettings.send_winner_message_enabled,
          seller_prize_enabled: baseSettings.seller_prize_enabled === true,
          seller_prize_value: Number(baseSettings.seller_prize_value || 50),
          seller_prize_requires_no_absence: baseSettings.seller_prize_requires_no_absence !== false,
          coupon_message_template: ensureCouponTrackingVariables(baseSettings.coupon_message_template),
          winner_message_template: ensureWinnerPrizeVariables(baseSettings.winner_message_template),
          prize_description: raffle.prize_description || baseSettings.prize_description || 'Vale-compra',
          prize_value: Number(raffle.prize_value || baseSettings.prize_value || 100),
          prize_validity_days: Number(raffle.prize_validity_days || baseSettings.prize_validity_days || 7),
          prize_redeem_instructions: raffle.prize_redeem_instructions || baseSettings.prize_redeem_instructions || 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.',
          prize_tiers: normalizePrizeTiers(raffle.prize_tiers || baseSettings.prize_tiers),
          rounding_rule: 'complete_value',
          updated_at: new Date().toISOString(),
        };

        const { data: createdSettings, error: settingsError } = await from('raffle_settings')
          .insert(clonedSettingsPayload)
          .select()
          .single();
        if (settingsError) throw settingsError;

        const { error: raffleError } = await from('raffles')
          .update({
            raffle_setting_id: createdSettings.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', raffle.id)
          .execute();
        if (raffleError) throw raffleError;

        await from('raffle_audit_logs').insert({
          company_id: companyId,
          raffle_id: raffle.id,
          user_id: user?.id || null,
          action: 'raffle_settings_detached',
          origin: 'user',
          metadata: {
            old_raffle_setting_id: raffle.raffle_setting_id || null,
            new_raffle_setting_id: createdSettings.id,
            shared_settings_count: sharedSettingsCount,
          },
        });

        const normalizedCreatedSettings = normalizeSettingsRow(createdSettings, companyId);
        setSettings(normalizedCreatedSettings);
        setSettingsList((previous) => [...previous, normalizedCreatedSettings as RaffleSettings]);
        setRaffles((previous) => previous.map((item) => (
          item.id === raffle.id ? { ...item, raffle_setting_id: createdSettings.id } : item
        )));
        setSelectedRaffleDrawDate(formatDateTimeLocalInput(raffle.draw_date));
        toast({ title: 'Configuração separada', description: 'Agora este sorteio tem configuração própria.' });
      } catch (error: any) {
        toast({ title: 'Erro ao separar configuração', description: error?.message || 'Tente novamente.', variant: 'destructive' });
        return;
      } finally {
        setIsSaving(false);
      }
    } else {
      setSettings(baseSettings);
      setSelectedRaffleDrawDate(formatDateTimeLocalInput(raffle.draw_date));
    }

    setActiveTab('configuracoes');
    navigate('/sorteios/configuracoes');
  };

  const handleSetDefaultCampaign = async (raffle: Raffle) => {
    if (raffle.status !== 'open') {
      toast({ title: 'Apenas campanhas abertas podem ser padrão', variant: 'destructive' });
      return;
    }
    if (!raffle.raffle_setting_id || !companyId) {
      toast({ title: 'Esta campanha não possui configuração vinculada', variant: 'destructive' });
      return;
    }
    try {
      await from('raffle_settings')
        .update({ is_default_coupon_campaign: false, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .execute();
      const { error } = await from('raffle_settings')
        .update({
          is_default_coupon_campaign: true,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', raffle.raffle_setting_id)
        .execute();
      if (error) throw error;
      await from('raffle_audit_logs').insert({
        company_id: companyId,
        raffle_id: raffle.id,
        user_id: user?.id || null,
        action: 'raffle_set_default_coupon_campaign',
        origin: 'user',
        metadata: { raffle_setting_id: raffle.raffle_setting_id },
      });
      toast({ title: 'Campanha padrão atualizada', description: 'As próximas vendas/OS gerarão cupons nesta campanha.' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao definir padrão', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleCreateCurrentRaffle = async () => {
    if (!settings.id || !companyId) {
      toast({ title: 'Salve as configurações antes de criar o sorteio', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await getOrCreateCurrentRaffle(settings as RaffleSettings, companyId);
      toast({ title: 'Sorteio do mês criado' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao criar sorteio', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrawCurrentRaffle = () => {
    if (!currentRaffle) {
      toast({ title: 'Crie o sorteio do mês antes de sortear', variant: 'destructive' });
      return;
    }
    handleDraw(currentRaffle);
  };

  const getCustomerName = (customerId?: string | null) => {
    if (!customerId) return '-';
    return clientesMap[customerId]?.nome || customerId;
  };

  const winnerPreview = useMemo(() => {
    const firstPrize = normalizePrizeTiers(settings.prize_tiers)[0] || DEFAULT_PRIZE_TIERS[0];
    const prizeValue = Number(firstPrize.value || 100);
    const validityDays = Number(settings.prize_validity_days ?? 7);
    const prizeText = firstPrize.type === 'product'
      ? (firstPrize.description || 'Produto')
      : `${firstPrize.description || settings.prize_description || 'Vale-compra'} de ${currencyFormatters.brl(prizeValue)}`;
    return replaceRaffleTemplateVariables(
      ensureWinnerPrizeVariables(settings.winner_message_template),
      {
        cliente: 'Maria Silva',
        numero_sorteado: 127,
        nome_sorteio: currentRaffle?.name || settings.campaign_name || 'Sorteio Mensal',
        empresa: companyName,
        telefone: '(99) 99999-9999',
        data_sorteio: dateFormatters.short(new Date().toISOString()),
        premio: prizeText,
        premio_tipo: firstPrize.type === 'product' ? 'Produto' : 'Vale-compra',
        premio_valor: firstPrize.type === 'product' ? '' : currencyFormatters.brl(prizeValue),
        posicao_premio: '1º prêmio',
        validade_premio: `${validityDays} dias`,
        retirada_premio: settings.prize_redeem_instructions || 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.',
        valor_total_compras: currencyFormatters.brl(100),
      },
    );
  }, [
    currentRaffle?.name,
    companyName,
    settings.campaign_name,
    settings.prize_description,
    settings.prize_redeem_instructions,
    settings.prize_tiers,
    settings.prize_validity_days,
    settings.winner_message_template,
  ]);

  const couponPreview = useMemo(() => {
    return replaceRaffleTemplateVariables(settings.coupon_message_template || DEFAULT_COUPON_TEMPLATE, {
      cliente: 'Maria Silva',
      telefone: '(99) 99999-9999',
      valor_total: currencyFormatters.brl(58),
      quantidade_cupons: 5,
      numeros_da_sorte: '100, 101, 102, 103, 104',
      data_sorteio: dateFormatters.short(currentRaffle?.draw_date || new Date().toISOString()),
      horario_sorteio: currentRaffle?.draw_date
        ? new Date(currentRaffle.draw_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
        : dateFormatters.time(new Date().toISOString()),
      nome_sorteio: currentRaffle?.name || settings.campaign_name || 'Sorteio Mensal',
      empresa: companyName,
      numero_os: '1234',
      numero_venda: '5678',
      link_acompanhamento: `${typeof window !== 'undefined' ? window.location.origin : 'https://app.ativafix.com'}/sorteio/acompanhar/exemplo`,
    });
  }, [
    currentRaffle?.draw_date,
    currentRaffle?.name,
    companyName,
    settings.campaign_name,
    settings.coupon_message_template,
  ]);

  const activePreview = previewType === 'coupon' ? couponPreview : winnerPreview;

  const getTrackingUrl = (token?: string | null) => {
    if (!token) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.ativafix.com';
    return `${origin}/sorteio/acompanhar/${token}`;
  };

  const copyTrackingLink = async (token?: string | null) => {
    const link = getTrackingUrl(token);
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado', description: 'O link de acompanhamento foi copiado.' });
  };

  const content = (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Sorteios
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistema de sorteio mensal com números da sorte por venda ou OS faturada.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <Card className="rounded-full border shadow-sm">
              <CardContent className="flex min-h-9 items-center gap-2 px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Sorteio atual</span>
                <span className="max-w-[220px] truncate text-xs font-semibold">{currentRaffle?.name || 'Ainda não criado'}</span>
                <Badge variant={currentRaffle?.status === 'drawn' ? 'default' : 'outline'} className="shrink-0 rounded-full px-2 py-0 text-[10px]">
                  {currentRaffle?.status ? raffleStatusLabel[currentRaffle.status] || currentRaffle.status : 'Sem sorteio'}
                </Badge>
              </CardContent>
            </Card>
            <Card className="rounded-full border shadow-sm">
              <CardContent className="flex min-h-9 items-center gap-2 px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Cupons</span>
                <span className="text-xs font-bold">{validCoupons.length}</span>
              </CardContent>
            </Card>
            <Card className="rounded-full border shadow-sm">
              <CardContent className="flex min-h-9 items-center gap-2 px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Participantes</span>
                <span className="text-xs font-bold">{participants.length}</span>
              </CardContent>
            </Card>
            <Card className="rounded-full border shadow-sm">
              <CardContent className="flex min-h-9 items-center gap-2 px-3 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Elegível</span>
                <span className="text-xs font-bold">{valuesVisible ? currencyFormatters.brl(currentRaffle ? (eligibleAmountByRaffle[currentRaffle.id] ?? currentRaffle.eligible_sales_amount ?? 0) : 0) : MASKED_VALUE}</span>
              </CardContent>
            </Card>
          </div>
          {!currentRaffle && settings.id && (
            <Button onClick={handleCreateCurrentRaffle} disabled={isSaving}>
              Criar sorteio do mês
            </Button>
          )}
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          navigate(value === 'visao-geral' ? '/sorteios' : `/sorteios/${value}`);
        }}
      >
        <TabsList className="flex h-auto flex-wrap rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50 p-1 shadow-sm dark:border-emerald-900 dark:from-emerald-950/50 dark:via-lime-950/30 dark:to-amber-950/30">
          <TabsTrigger className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow" value="visao-geral">Sorteios Mensais</TabsTrigger>
          <TabsTrigger className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow" value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow" value="cupons">Cupons Gerados</TabsTrigger>
          <TabsTrigger className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow" value="participantes">Clientes Participantes</TabsTrigger>
          <TabsTrigger className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow" value="auditoria">Relatórios e Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Shuffle className="h-5 w-5" /> Sorteios Mensais</CardTitle>
                <CardDescription>Crie, duplique para teste, inative ou execute sorteios quando houver cupons válidos.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => createRaffleFromBase()}
                  disabled={isSaving}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Novo teste
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateCurrentRaffle}
                  disabled={isSaving || !settings.id}
                  className="rounded-full"
                >
                  Criar sorteio do mês
                </Button>
                <Button
                  type="button"
                  onClick={handleDrawCurrentRaffle}
                  disabled={isDrawing || !currentRaffle || currentRaffle.status !== 'open'}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Sortear na mão
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Cupons</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Data sorteio</TableHead>
                    <TableHead>Vencedor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {raffles.map((raffle) => {
                    const raffleWinners = coupons
                      .filter((c) => c.raffle_id === raffle.id && c.status === 'winner')
                      .sort((a, b) => Number(a.prize_position || 99) - Number(b.prize_position || 99));
                    return (
                      <TableRow key={raffle.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <span>{raffle.name}</span>
                            {raffle.raffle_setting_id && settingsById[raffle.raffle_setting_id]?.is_default_coupon_campaign && (
                              <Badge className="w-fit rounded-full bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">
                                Campanha padrão
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{raffle.status}</Badge></TableCell>
                        <TableCell>{String(raffle.reference_month).padStart(2, '0')}/{raffle.reference_year}</TableCell>
                        <TableCell>{raffle.total_coupons}</TableCell>
                        <TableCell>{raffle.total_participants}</TableCell>
                        <TableCell>{formatRaffleDrawDateTime(raffle.draw_date)}</TableCell>
                        <TableCell>
                          {raffleWinners.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {raffleWinners.map((winner) => {
                                const cliente = winner.customer_id ? clientesMap[winner.customer_id] : null;
                                const phone = maskPhone(cliente?.whatsapp || cliente?.telefone);
                                const prize = winner.prize_type === 'product'
                                  ? (winner.prize_description || 'Produto')
                                  : currencyFormatters.brl(Number(winner.prize_value || 0));
                                return (
                                  <div key={`${winner.prize_position}-${winner.coupon_number}`} className="text-xs leading-tight">
                                    <p className="font-semibold">
                                      {winner.prize_position || 1}º #{winner.coupon_number} · {prize}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {cliente?.nome || 'Cliente'}{phone !== '-' ? ` (${phone})` : ''}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDraw(raffle)}
                              disabled={isDrawing || raffle.status !== 'open'}
                              className="rounded-full"
                            >
                              Sortear na mão
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfigureRaffle(raffle)}
                              disabled={!raffle.raffle_setting_id}
                              className="rounded-full"
                            >
                              Configurar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefaultCampaign(raffle)}
                              disabled={raffle.status !== 'open' || !raffle.raffle_setting_id || !!(raffle.raffle_setting_id && settingsById[raffle.raffle_setting_id]?.is_default_coupon_campaign)}
                              className="rounded-full"
                            >
                              Definir padrão
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createRaffleFromBase({ baseRaffle: raffle, copyCoupons: true })}
                              disabled={isSaving}
                              className="rounded-full"
                            >
                              <Copy className="mr-1 h-3.5 w-3.5" />
                              Duplicar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInactivateRaffle(raffle)}
                              disabled={raffle.status !== 'open'}
                              className="rounded-full"
                            >
                              Inativar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivateRaffle(raffle)}
                              disabled={raffle.status === 'open' || raffle.status === 'drawn'}
                              className="rounded-full"
                            >
                              Ativar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelRaffle(raffle)}
                              disabled={raffle.status === 'drawn' || raffle.status === 'cancelled'}
                              className="rounded-full"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRaffle(raffle)}
                              className="rounded-full text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {raffles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum sorteio mensal criado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracoes">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Card className="xl:col-span-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Configurações do Sorteio</CardTitle>
              <CardDescription>Configuração desta campanha. Apenas a campanha padrão gera cupons automaticamente em venda/OS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Sistema de sorteio ativo</Label>
                  <p className="text-xs text-muted-foreground">Quando desativado, esta campanha não gera cupom nem roda sorteio automático.</p>
                </div>
                <Switch checked={!!settings.is_active} onCheckedChange={(v) => setSettings((p) => ({ ...p, is_active: v }))} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Campanha padrão para gerar cupons</Label>
                  <p className="text-xs text-muted-foreground">
                    As vendas/OS usam somente a campanha marcada como padrão para criar números da sorte.
                  </p>
                </div>
                <Switch checked={!!settings.is_default_coupon_campaign} onCheckedChange={(v) => setSettings((p) => ({ ...p, is_default_coupon_campaign: v }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome da campanha</Label>
                  <Input value={settings.campaign_name || ''} onChange={(e) => setSettings((p) => ({ ...p, campaign_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Data e hora deste sorteio</Label>
                  <Input
                    type="datetime-local"
                    value={selectedRaffleDrawDate}
                    disabled={!configuredRaffle}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedRaffleDrawDate(value);
                      const time = value.match(/T(\d{2}:\d{2})$/)?.[1];
                      if (time) setSettings((previous) => ({ ...previous, draw_time: time }));
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {configuredRaffle ? 'Altera a data/hora real desta campanha.' : 'Crie ou selecione um sorteio para editar a data.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Valor base por cupom</Label>
                  <CurrencyInput
                    showCurrency
                    value={Number(settings.amount_per_coupon || 10)}
                    onChange={(value) => setSettings((p) => ({ ...p, amount_per_coupon: value || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número inicial</Label>
                  <Input type="number" min="1" value={settings.initial_number || 100} onChange={(e) => setSettings((p) => ({ ...p, initial_number: Number(e.target.value) || 100 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Dia do sorteio</Label>
                  <Select value={settings.draw_day_type || 'last_day_of_month'} onValueChange={(v: 'last_day_of_month' | 'fixed_day') => setSettings((p) => ({ ...p, draw_day_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_day_of_month">Último dia do mês</SelectItem>
                      <SelectItem value="fixed_day">Dia fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={settings.draw_time || '20:00'}
                    onChange={(e) => {
                      const time = e.target.value;
                      setSettings((p) => ({ ...p, draw_time: time }));
                      setSelectedRaffleDrawDate((previous) => previous ? `${previous.slice(0, 11)}${time}` : previous);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <div>
                    <Label>Prêmio do sorteio</Label>
                    <p className="text-xs text-muted-foreground">
                      Esse texto fica salvo no sorteio mensal e entra na variável {'{premio}'} da mensagem do ganhador.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo dos prêmios</Label>
                    <Input
                      value={settings.prize_description || 'Vale-compra'}
                      onChange={(e) => {
                        const description = e.target.value;
                        setSettings((p) => ({
                          ...p,
                          prize_description: description,
                          prize_tiers: normalizePrizeTiers(p.prize_tiers).map((tier) => ({ ...tier, description })),
                        }));
                      }}
                      placeholder="Vale-compra"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validade em dias</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.prize_validity_days ?? 7}
                      onChange={(e) => setSettings((p) => ({ ...p, prize_validity_days: Number(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label>Faixas de prêmio</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={normalizePrizeTiers(settings.prize_tiers).length >= 3}
                    onClick={() => setSettings((p) => {
                      const current = normalizePrizeTiers(p.prize_tiers);
                      const nextIndex = current.length;
                      const nextTier = DEFAULT_PRIZE_TIERS[nextIndex] || { position: nextIndex + 1, type: 'voucher', description: p.prize_description || 'Vale-compra', value: 30 };
                      return {
                        ...p,
                        prize_tiers: [
                          ...current,
                          {
                            ...nextTier,
                            position: current.length + 1,
                            description: nextTier.description || p.prize_description || 'Vale-compra',
                          },
                        ],
                      };
                    })}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Adicionar prêmio
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {normalizePrizeTiers(settings.prize_tiers).map((tier, tierIndex) => (
                    <div key={tier.position} className="space-y-2 rounded-2xl border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Label>{tier.position}º prêmio</Label>
                          {tierIndex > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 rounded-full p-0 text-destructive"
                              title="Remover prêmio"
                              onClick={() => setSettings((p) => {
                                const nextTiers = normalizePrizeTiers(p.prize_tiers)
                                  .filter((item) => item.position !== tier.position)
                                  .map((item, index) => ({ ...item, position: index + 1 }));
                                return {
                                  ...p,
                                  prize_value: nextTiers[0]?.value || 0,
                                  prize_tiers: nextTiers,
                                };
                              })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={tier.type === 'product' ? 'text-muted-foreground' : 'font-medium'}>Vale</span>
                          <Switch
                            checked={tier.type === 'product'}
                            onCheckedChange={(checked) => setSettings((p) => ({
                              ...p,
                              prize_tiers: normalizePrizeTiers(p.prize_tiers).map((item) =>
                                item.position === tier.position
                                  ? {
                                      ...item,
                                      type: checked ? 'product' : 'voucher',
                                      description: checked ? 'Produto' : 'Vale-compra',
                                      value: checked ? 0 : (DEFAULT_PRIZE_TIERS[tier.position - 1]?.value || 0),
                                    }
                                  : item
                              ),
                            }))}
                          />
                          <span className={tier.type === 'product' ? 'font-medium' : 'text-muted-foreground'}>Produto</span>
                        </div>
                      </div>
                      {tier.type === 'product' ? (
                        <Input
                          value={tier.description}
                          onChange={(e) => setSettings((p) => ({
                            ...p,
                            prize_tiers: normalizePrizeTiers(p.prize_tiers).map((item) =>
                              item.position === tier.position ? { ...item, description: e.target.value, value: 0 } : item
                            ),
                          }))}
                          placeholder="Ex.: Carregador, fone, película..."
                        />
                      ) : (
                        <CurrencyInput
                          showCurrency
                          value={Number(tier.value || 0)}
                          onChange={(value) => setSettings((p) => {
                            const nextTiers = normalizePrizeTiers(p.prize_tiers).map((item) =>
                              item.position === tier.position ? { ...item, type: 'voucher', description: settings.prize_description || 'Vale-compra', value: value || 0 } : item
                            );
                            return {
                              ...p,
                              prize_value: nextTiers[0]?.value || 0,
                              prize_tiers: nextTiers,
                            };
                          })}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Como retirar o prêmio</Label>
                  <Textarea
                    rows={3}
                    value={settings.prize_redeem_instructions || 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.'}
                    onChange={(e) => setSettings((p) => ({ ...p, prize_redeem_instructions: e.target.value }))}
                    placeholder="Ex.: Retirada presencial na loja em até 7 dias, apresentando documento e o número da sorte vencedor."
                  />
                </div>
                <p className="text-sm font-medium">
                  Prévia: {normalizePrizeTiers(settings.prize_tiers).map((tier) => tier.type === 'product' ? `${tier.position}º ${tier.description}` : `${tier.position}º ${currencyFormatters.brl(tier.value)}`).join(' · ')}. Válidos por {Number(settings.prize_validity_days ?? 7)} dias. {settings.prize_redeem_instructions || 'Retirada presencial na loja mediante apresentação de documento e número da sorte vencedor.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 border rounded-lg p-3">
                  <Switch checked={!!settings.auto_draw_enabled} onCheckedChange={(v) => setSettings((p) => ({ ...p, auto_draw_enabled: v }))} />
                  <span className="text-sm">Sorteio automático</span>
                </label>
                <label className="flex items-center gap-2 border rounded-lg p-3">
                  <Switch checked={!!settings.send_coupon_message_enabled} onCheckedChange={(v) => setSettings((p) => ({ ...p, send_coupon_message_enabled: v }))} />
                  <span className="text-sm">WhatsApp ao gerar cupom</span>
                </label>
                <label className="flex items-center gap-2 border rounded-lg p-3">
                  <Switch checked={!!settings.send_winner_message_enabled} onCheckedChange={(v) => setSettings((p) => ({ ...p, send_winner_message_enabled: v }))} />
                  <span className="text-sm">WhatsApp ao ganhador</span>
                </label>
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <div>
                  <Label htmlFor="ativa-crm-coupon-tag-id">ID da etiqueta no Ativa CRM para cupom</Label>
                  <p className="text-xs text-muted-foreground">
                    Essa etiqueta é aplicada no contato antes de enviar a mensagem com os números da sorte.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    id="ativa-crm-coupon-tag-id"
                    type="number"
                    min={1}
                    placeholder="Ex: 201"
                    value={settings.ativa_crm_coupon_tag_id ?? ''}
                    onChange={(e) => setSettings((p) => ({
                      ...p,
                      ativa_crm_coupon_tag_id: e.target.value ? Number(e.target.value) : null,
                    }))}
                  />
                  <div className="md:col-span-2 flex items-center rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    Atual: {settings.ativa_crm_coupon_tag_id || 'sem etiqueta'} {settings.ativa_crm_coupon_tag_id === 201 ? '- VENDA REALIZADA' : ''}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Prêmio para vendedor do cliente ganhador</Label>
                    <p className="text-xs text-muted-foreground">
                      Ative se o vendedor que atendeu o cliente vencedor também deve concorrer ao bônus interno.
                    </p>
                  </div>
                  <Switch
                    checked={!!settings.seller_prize_enabled}
                    onCheckedChange={(v) => setSettings((p) => ({
                      ...p,
                      seller_prize_enabled: v === true,
                      seller_prize_value: Number(p.seller_prize_value || 50),
                      seller_prize_requires_no_absence: p.seller_prize_requires_no_absence ?? true,
                    }))}
                  />
                </div>
                {settings.seller_prize_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Valor do prêmio do vendedor</Label>
                      <CurrencyInput
                        showCurrency
                        value={Number(settings.seller_prize_value || 50)}
                        onChange={(value) => setSettings((p) => ({ ...p, seller_prize_value: value || 0 }))}
                      />
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border p-3">
                      <Switch
                        checked={settings.seller_prize_requires_no_absence ?? true}
                        onCheckedChange={(v) => setSettings((p) => ({ ...p, seller_prize_requires_no_absence: v }))}
                      />
                      <span className="text-sm">Exigir nenhuma falta no mês</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Modelo da mensagem de cupom</Label>
                <Textarea rows={6} value={settings.coupon_message_template || ''} onChange={(e) => setSettings((p) => ({ ...p, coupon_message_template: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Variáveis: {'{cliente}'}, {'{valor_total}'}, {'{quantidade_cupons}'}, {'{numeros_da_sorte}'}, {'{data_sorteio}'}, {'{horario_sorteio}'}, {'{link_acompanhamento}'}, {'{nome_sorteio}'}, {'{empresa}'}, {'{numero_os}'}, {'{numero_venda}'}.</p>
              </div>

              <div className="space-y-2">
                <Label>Modelo da mensagem para ganhador</Label>
                <Textarea rows={5} value={settings.winner_message_template || ''} onChange={(e) => setSettings((p) => ({ ...p, winner_message_template: e.target.value }))} />
                <p className="text-xs text-muted-foreground">
                  Variáveis do ganhador: {'{cliente}'}, {'{numero_sorteado}'}, {'{nome_sorteio}'}, {'{empresa}'}, {'{posicao_premio}'}, {'{premio_tipo}'}, {'{premio}'}, {'{premio_valor}'}, {'{validade_premio}'}, {'{retirada_premio}'}.
                </p>
              </div>

              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </CardContent>
          </Card>

          <div className="xl:sticky xl:top-20 xl:col-span-4 self-start">
            <Card className="flex h-[calc(100vh-9rem)] min-h-[560px] w-full min-w-0 overflow-hidden rounded-[1.5rem] border bg-white shadow-sm dark:bg-slate-950">
              <div className="flex min-h-0 w-full flex-col">
              <CardHeader className="space-y-1.5 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Prévia no WhatsApp</CardTitle>
                  <div className="inline-flex shrink-0 rounded-full border bg-background p-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={previewType === 'coupon' ? 'default' : 'ghost'}
                      className="h-6 rounded-full px-2.5 text-[11px]"
                      onClick={() => setPreviewType('coupon')}
                    >
                      Cupom
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={previewType === 'winner' ? 'default' : 'ghost'}
                      className="h-6 rounded-full px-2.5 text-[11px]"
                      onClick={() => setPreviewType('winner')}
                    >
                      Ganhador
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs">Como as mensagens automáticas serão enviadas.</CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4 pt-0">
                <div className="relative aspect-[9/19] h-full max-h-[calc(100vh-15rem)] min-h-[430px] rounded-[2rem] bg-slate-950 p-1.5 shadow-xl ring-1 ring-slate-800">
                  <div className="absolute left-1/2 top-2.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-slate-800" />
                  <div className="flex h-full flex-col overflow-hidden rounded-[1.6rem] bg-[#efeae2]">
                    <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2.5 text-white">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">MS</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">Maria Silva</p>
                        <p className="text-[11px] text-white/75">online</p>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0.35)_75%,transparent_75%,transparent)] bg-[length:28px_28px] px-2.5 py-3">
                      <div className="mb-2 text-center">
                        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] text-slate-500 shadow-sm">Hoje</span>
                      </div>
                      <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-2.5 py-2 text-[11px] leading-snug text-slate-900 shadow-sm">
                        <p className="whitespace-pre-wrap break-words line-clamp-[14]">
                          {renderWhatsAppFormattedText(activePreview || 'Configure a mensagem para ver a prévia.')}
                        </p>
                        <div className="mt-1 flex justify-end gap-1 text-[10px] text-slate-500">
                          <span>20:00</span>
                          <span className="text-[#34b7f1]">✓✓</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#f0f2f5] px-2.5 py-1.5">
                      <div className="truncate rounded-full bg-white px-3 py-1.5 text-[11px] text-slate-500">
                        {previewType === 'coupon' ? 'Mensagem automática de cupom' : 'Mensagem automática do ganhador'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </div>
            </Card>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="cupons">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5" /> Cupons Gerados</CardTitle>
              <CardDescription>
                Cupons cancelados permanecem no histórico.
                {settings.seller_prize_enabled
                  ? ` Vendedor do cupom vencedor: bônus de ${currencyFormatters.brl(Number(settings.seller_prize_value || 50))}${settings.seller_prize_requires_no_absence ?? true ? ' se não tiver faltas no mês.' : '.'}`
                  : ' Prêmio para vendedor desativado nas configurações.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder="Pesquisar por cupom, cliente, vendedor ou token"
                  className="max-w-md rounded-full"
                />
                <span className="text-xs text-muted-foreground">
                  {filteredCoupons.length} de {coupons.length} cupom(ns)
                </span>
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Valor base</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acompanhamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCoupons.map((coupon) => {
                    const cliente = coupon.customer_id ? clientesMap[coupon.customer_id] : null;
                    const vendedor = coupon.generated_by_user_id ? vendedoresMap[coupon.generated_by_user_id] : null;
                    const trackingUrl = getTrackingUrl(coupon.tracking_token);
                    return (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-bold">#{coupon.coupon_number}</TableCell>
                        <TableCell>{cliente?.nome || '-'}</TableCell>
                        <TableCell>{valuesVisible ? (cliente?.whatsapp || cliente?.telefone || '-') : maskPhone(cliente?.whatsapp || cliente?.telefone)}</TableCell>
                        <TableCell>{vendedor || '-'}</TableCell>
                        <TableCell>{orderTypeLabel[coupon.order_type] || humanizeIdentifier(coupon.order_type)}</TableCell>
                        <TableCell>{valuesVisible ? currencyFormatters.brl(coupon.eligible_amount) : MASKED_VALUE}</TableCell>
                        <TableCell>{dateFormatters.short(coupon.generated_at)}</TableCell>
                        <TableCell>
                          <Badge variant={coupon.status === 'winner' ? 'default' : 'outline'}>
                            {couponStatusLabel[coupon.status] || humanizeIdentifier(coupon.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {trackingUrl ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full px-3 text-xs"
                                disabled={coupon.status !== 'valid'}
                                onClick={() => handleCancelCoupon(coupon)}
                              >
                                Cancelar
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyTrackingLink(coupon.tracking_token)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-full" asChild>
                                <a href={trackingUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full px-3 text-xs"
                                disabled={coupon.status !== 'valid'}
                                onClick={() => handleCancelCoupon(coupon)}
                              >
                                Cancelar
                              </Button>
                              <span className="self-center text-xs text-muted-foreground">Sem link</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredCoupons.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum cupom encontrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              <TablePagination page={couponPage} totalItems={filteredCoupons.length} onPageChange={setCouponPage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participantes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Clientes Participantes</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Total elegível</TableHead>
                    <TableHead>Cupons</TableHead>
                    <TableHead>Números</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParticipants.map((participant) => (
                    <TableRow key={participant.customer_id}>
                      <TableCell>{participant.cliente?.nome || participant.customer_id}</TableCell>
                      <TableCell>{valuesVisible ? (participant.cliente?.whatsapp || participant.cliente?.telefone || '-') : maskPhone(participant.cliente?.whatsapp || participant.cliente?.telefone)}</TableCell>
                      <TableCell>{valuesVisible ? (participant.cliente?.cpf_cnpj || '-') : maskDocument(participant.cliente?.cpf_cnpj)}</TableCell>
                      <TableCell>{valuesVisible ? currencyFormatters.brl(participant.total_amount) : MASKED_VALUE}</TableCell>
                      <TableCell>{participant.total_coupons}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{participant.numbers}</TableCell>
                    </TableRow>
                  ))}
                  {participants.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum participante.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination page={participantsPage} totalItems={participants.length} onPageChange={setParticipantsPage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Cupons cancelados</p><p className="text-2xl font-bold">{coupons.filter((c) => c.status === 'cancelled').length}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Cupons por venda</p><p className="text-2xl font-bold">{coupons.filter((c) => c.order_type === 'sale').length}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Cupons por OS</p><p className="text-2xl font-bold">{coupons.filter((c) => c.order_type === 'service_order').length}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Auditoria</CardTitle>
              <CardDescription>Eventos críticos ficam registrados para rastreabilidade.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Referência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{dateFormatters.short(log.created_at)}</TableCell>
                      <TableCell>{auditActionLabel[log.action] || humanizeIdentifier(log.action)}</TableCell>
                      <TableCell>{auditOriginLabel[log.origin] || humanizeIdentifier(log.origin)}</TableCell>
                      <TableCell>{log.sale_id || log.service_order_id || log.coupon_id || log.raffle_id || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum log registrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return <ModernLayout title="Sorteios" subtitle="Sistema de Sorteio Mensal">{content}</ModernLayout>;
}
