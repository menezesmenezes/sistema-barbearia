// ── Helpers para simplificar chamadas ───────────────────────
const DB = {
  async select(table, opts = {}) {
    let q = _sb.from(table).select(opts.select || '*');
    if (opts.eq)     Object.entries(opts.eq).forEach(([k,v]) => q = q.eq(k, v));
    if (opts.neq)    Object.entries(opts.neq).forEach(([k,v]) => q = q.neq(k, v));
    if (opts.ilike)  Object.entries(opts.ilike).forEach(([k,v]) => q = q.ilike(k, v));
    if (opts.order)  q = q.order(opts.order, { ascending: opts.asc ?? false });
    if (opts.limit)  q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  async insert(table, row) {
    const { data, error } = await _sb.from(table).insert(row).select().single();
    if (error) throw error;
    return data;
  },
  async update(table, row, match) {
    const { error } = await _sb.from(table).update(row).match(match);
    if (error) throw error;
  },
  async upsert(table, row, onConflict) {
    const { error } = await _sb.from(table).upsert(row, { onConflict });
    if (error) throw error;
  },
  async delete(table, match) {
    const { error } = await _sb.from(table).delete().match(match);
    if (error) throw error;
  },
  // Atalho para buscar uma configuração
  async getSetting(key) {
    const { data } = await _sb.from('settings').select('value').eq('key', key).single();
    return data?.value ?? null;
  },
  async setSetting(key, value) {
    const { error } = await _sb.from('settings').upsert({ key, value }, { onConflict: 'key' });
    if (error) throw error;
  }
};
