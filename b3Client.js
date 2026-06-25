// ═══════════════════════════════════════════════════
//  Cliente B3 — STUB (Fase 14). NENHUMA chamada real à B3.
//  Fluxo real futuro (ambiente de certificação):
//    1) Pacote de Acesso (.zip de credenciais, gerado no portal B3 For Developers)
//    2) API Guia (Produtos Atualizados, D-1): quais CPF/CNPJ tiveram movimentação
//    3) Position/Movement APENAS para os documentos atualizados
//    Regras: respeitar D-1; não consultar o mesmo investidor mais de 1x/dia;
//    tratar consentimento revogado/expirado.
//  Tudo abaixo retorna o stub de certificação até as credenciais existirem.
// ═══════════════════════════════════════════════════
import { b3CertStub } from '../utils/responses.js';

export const b3Client = {
  async status(env, ctx) {
    return b3CertStub();
  },
  async syncGuide(env, ctx) {
    // Real: chamar API Guia primeiro para racionalizar as demais chamadas.
    return b3CertStub();
  },
  async syncPositions(env, ctx) {
    // Real: buscar Position só para documentos retornados pela API Guia.
    return b3CertStub();
  },
  async syncMovements(env, ctx) {
    // Real: buscar Movement no período, respeitando D-1.
    return b3CertStub();
  },
  async revokeLocal(env, ctx) {
    // A revogação REAL ocorre na Área Logada da B3 (não pela tela do contratante).
    return b3CertStub({
      error:
        'Revogação real ocorre na Área Logada da B3; aqui seria apenas o reflexo local/documental.',
    });
  },
};
