// nr1-common.js — utilitários compartilhados pelas páginas do dashboard NR1
// (index.html, falhas.html, detalhes.html, custo_envio_mensagem.html).
//
// Fonte ÚNICA destes helpers para que correções não divirjam entre páginas.
// Carregue este arquivo ANTES do <script> inline de cada página:
//   <script src="nr1-common.js"></script>
//
// NÃO usar em qualidade.html — aquela página consome o endpoint público
// nr1-quality-data e define seu próprio API_URL.

// Endpoint autenticado (Cloudflare Pages Function que injeta o token do n8n).
const API_URL = '/api/dashboard-data';

// Escapa texto para inserção segura em HTML (fecha XSS, inclusive via atributo).
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

// Converge o telefone para a forma BR de 13 dígitos "com 9" (idempotente).
function normalizarTelefone(telefone) {
    if (!telefone) return '';
    let numeros = String(telefone).replace(/\D/g, '');
    if (numeros.length === 12) return numeros.slice(0, 4) + '9' + numeros.slice(4);
    if (numeros.length === 13 && numeros[4] !== '9') return numeros.slice(0, 4) + '9' + numeros.slice(4);
    return numeros;
}

// Formata uma data ISO como dd/mm/aaaa hh:mm:ss (pt-BR); '-' se inválida/ausente.
function formatarData(dataISO) {
    if (!dataISO) return '-';
    try {
        const data = new Date(dataISO);
        if (isNaN(data.getTime())) return '-';
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
    } catch (e) { return '-'; }
}

// Dicionário canônico dos códigos de erro da Meta, alinhado à classificação do
// backend: RETRY=[130429,131000,131005,500] · DESCANSO=[131049] · NAO_WHATSAPP=[131026,130472]
// · LGPD=[131047,131048,132000,132001]. Mantê-lo aqui evita que index/falhas divirjam.
const explicacoesErros = {
    // DESCANSO — pacing/throttling da Meta; o número sai da fila e volta sozinho após 30 dias
    "131049": { titulo: "131049 — Limite de engajamento saudável (DESCANSO)", explicacao: "A Meta não entregou para preservar o engajamento saudável do usuário (pacing por muitas mensagens de marketing recentes). Classificado como DESCANSO: o número sai da fila e retorna automaticamente após 30 dias." },
    // RETRY — bloqueio temporário; o fluxo reenvia automaticamente depois
    "131000": { titulo: "131000 — Erro temporário (RETRY)", explicacao: "Falha genérica/temporária no envio. Classificado como RETRY: o fluxo tenta novamente automaticamente." },
    "131005": { titulo: "131005 — Erro temporário (RETRY)", explicacao: "Falha temporária no processamento. Classificado como RETRY." },
    "130429": { titulo: "130429 — Limite de taxa (RETRY)", explicacao: "Muitas mensagens em pouco tempo; a Meta limitou o envio. Classificado como RETRY: aguarda e reenvia." },
    "500":    { titulo: "500 — Erro interno (RETRY)", explicacao: "Erro interno no envio. Classificado como RETRY." },
    // NAO_WHATSAPP — número não recebe; NÃO reenviar
    "131026": { titulo: "131026 — Sem WhatsApp (não reenviar)", explicacao: "O número não possui conta ativa no WhatsApp ou não pode receber a mensagem. Classificado como NÃO WHATSAPP: não reenviar." },
    "130472": { titulo: "130472 — Usuário não elegível (não reenviar)", explicacao: "Número inelegível para receber (ex.: parte de experimento da Meta). Classificado como NÃO WHATSAPP: não reenviar." },
    // LGPD — bloqueio por restrição/consentimento
    "131047": { titulo: "131047 — Reengajamento necessário (LGPD)", explicacao: "Passou da janela de 24h / requer reengajamento. Tratado como bloqueio (LGPD)." },
    "131048": { titulo: "131048 — Restrição de envio (LGPD)", explicacao: "A Meta restringiu o envio ao destinatário. Tratado como bloqueio (LGPD)." },
    "132000": { titulo: "132000 — Bloqueio de envio (LGPD)", explicacao: "Envio bloqueado por restrição da Meta. Tratado como bloqueio (LGPD)." },
    "132001": { titulo: "132001 — Bloqueio de envio (LGPD)", explicacao: "Envio bloqueado por restrição da Meta. Tratado como bloqueio (LGPD)." }
};
