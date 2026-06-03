-- =====================================================================
-- Migration 0016 — View v_os_margem_real · "markup real" por OS
-- ALVO: TESTE primeiro. PROD só após validar + OK explícito do fundador.
-- Pré-requisito: 0005 (orcamento_itens.total_custo), 0009 (os_comercial),
--                0014 (estoque_movimentos / estoque_itens.custo_medio).
--
-- O QUE ENTREGA: agora que o estoque baixa material POR OS (saída vinculada
-- a os_comercial_id), dá para fechar a margem REAL de cada OS cruzando a
-- receita com os DOIS componentes de custo:
--   margem_real = receita − (custo dos itens do orçamento + custo do
--                 material baixado do estoque para a OS).
-- Não materializa nada — reflete a base ao vivo (subselects por OS).
--
-- CRÍTICO — security_invoker = true: a view roda com a permissão de QUEM a
-- consulta (não do dono/criador). Sem isso, a view ignoraria a RLS por
-- oficina de public.os_comercial (e das tabelas dos subselects) e um usuário
-- de uma oficina enxergaria a margem de TODAS as oficinas — vazamento
-- multi-tenant. Com security_invoker a view herda o isolamento das tabelas
-- base e cada oficina vê somente as próprias OS.
--
-- CAVEAT (honesto, MVP):
--   • custo_material usa o custo_medio ATUAL do item (a saída de estoque NÃO
--     guarda o custo do momento no MVP — ver 0014). Logo é uma APROXIMAÇÃO:
--     se o custo médio do item mudar depois (nova entrada com outro preço), a
--     margem histórica da OS acompanha o custo de hoje, não o da baixa.
--   • custo_itens (peças/mão de obra/insumo lançados NO ORÇAMENTO) e
--     custo_material (insumos consumidos do ESTOQUE, ex. tinta) são
--     componentes DISTINTOS no uso comum: o orçamento precifica o serviço, o
--     estoque registra o que saiu da prateleira. Somá-los NÃO é dupla
--     contagem — são origens diferentes. Se a oficina lançar o mesmo insumo
--     nos dois lugares, aí sim haveria sobreposição (responsabilidade do uso).
--
-- Idempotente (create or replace). Rollback: supabase/rollbacks/0016_rollback.sql
-- =====================================================================

create or replace view public.v_os_margem_real
  with (security_invoker = true) as   -- CRÍTICO: herda a RLS por oficina do os_comercial (sem isso vazaria entre oficinas)
select
  oc.oficina_id,
  oc.id              as os_id,
  oc.numero,
  oc.status,
  oc.valor_orcamento as valor,
  -- custo dos itens do orçamento (coluna gerada total_custo = qtd × custo_unit):
  coalesce((
    select sum(oi.total_custo)
    from public.orcamento_itens oi
    where oi.orcamento_id = oc.orcamento_id
  ), 0) as custo_itens,
  -- custo do material baixado do estoque para esta OS (saídas × custo_medio ATUAL):
  coalesce((
    select sum(m.quantidade * i.custo_medio)
    from public.estoque_movimentos m
    join public.estoque_itens i on i.id = m.item_id
    where m.os_comercial_id = oc.id
      and m.tipo = 'saida'
  ), 0) as custo_material,
  -- custo total = itens do orçamento + material do estoque:
  coalesce((
    select sum(oi.total_custo)
    from public.orcamento_itens oi
    where oi.orcamento_id = oc.orcamento_id
  ), 0)
  + coalesce((
    select sum(m.quantidade * i.custo_medio)
    from public.estoque_movimentos m
    join public.estoque_itens i on i.id = m.item_id
    where m.os_comercial_id = oc.id
      and m.tipo = 'saida'
  ), 0) as custo_total,
  -- margem real = receita − custo_total:
  oc.valor_orcamento - (
    coalesce((
      select sum(oi.total_custo)
      from public.orcamento_itens oi
      where oi.orcamento_id = oc.orcamento_id
    ), 0)
    + coalesce((
      select sum(m.quantidade * i.custo_medio)
      from public.estoque_movimentos m
      join public.estoque_itens i on i.id = m.item_id
      where m.os_comercial_id = oc.id
        and m.tipo = 'saida'
    ), 0)
  ) as margem_real,
  -- margem % sobre a receita (0 quando não há receita — evita divisão por zero):
  case
    when oc.valor_orcamento > 0 then round(
      ((oc.valor_orcamento - (
        coalesce((
          select sum(oi.total_custo)
          from public.orcamento_itens oi
          where oi.orcamento_id = oc.orcamento_id
        ), 0)
        + coalesce((
          select sum(m.quantidade * i.custo_medio)
          from public.estoque_movimentos m
          join public.estoque_itens i on i.id = m.item_id
          where m.os_comercial_id = oc.id
            and m.tipo = 'saida'
        ), 0)
      )) / oc.valor_orcamento) * 100, 1)
    else 0
  end as margem_pct
from public.os_comercial oc
where oc.status <> 'cancelada';

-- Fim da Migration 0016
