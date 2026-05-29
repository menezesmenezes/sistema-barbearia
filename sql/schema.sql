-- ═══════════════════════════════════════════════════════════
--  BarberPro — Schema Supabase
--  Cole este SQL no SQL Editor do seu projeto Supabase
--  e clique em "Run"
-- ═══════════════════════════════════════════════════════════


-- ── 1. BARBEIROS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS barbers (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  spec       TEXT NOT NULL DEFAULT 'Barbeiro',
  phone      TEXT DEFAULT '',
  color      TEXT NOT NULL DEFAULT '#C9A84C',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. SERVIÇOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  price      NUMERIC(10,2) NOT NULL,
  duration   INTEGER NOT NULL,  -- em minutos
  icon       TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. CONFIGURAÇÕES DA BARBEARIA ───────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ── 4. AGENDAMENTOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id            BIGSERIAL PRIMARY KEY,
  client_name   TEXT NOT NULL,
  client_phone  TEXT NOT NULL,
  barber_id     BIGINT REFERENCES barbers(id) ON DELETE SET NULL,
  barber_name   TEXT NOT NULL,
  service_id    BIGINT REFERENCES services(id) ON DELETE SET NULL,
  service_name  TEXT NOT NULL,
  service_price NUMERIC(10,2) NOT NULL,
  date          DATE NOT NULL,
  time          TIME NOT NULL,
  note          TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente','confirmado','concluido','cancelado')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_appointments_date    ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_barber  ON appointments(barber_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status  ON appointments(status);

-- ── 5. BLOQUEIOS DE HORÁRIO ─────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  id         BIGSERIAL PRIMARY KEY,
  date       DATE NOT NULL,
  time       TIME,             -- NULL = dia inteiro bloqueado
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════
--  DADOS PADRÃO (seed)
-- ═══════════════════════════════════════════════════════════

-- Barbeiros iniciais
INSERT INTO barbers (name, spec, phone, color) VALUES
  ('Carlos Mendes', 'Degradê & Barba', '(11) 98888-0001', '#C9A84C'),
  ('Rafael Lima',   'Corte Clássico',  '(11) 98888-0002', '#5B8FD4'),
  ('Diego Costa',   'Navalhado',       '(11) 98888-0003', '#7DC47A')
ON CONFLICT DO NOTHING;

-- Serviços iniciais
INSERT INTO services (name, price, duration) VALUES
  ('Corte Simples',  35,  30),
  ('Corte Degradê',  50,  45),
  ('Barba',          30,  30),
  ('Corte + Barba',  70,  60),
  ('Hidratação',     40,  30),
  ('Sobrancelha',    15,  15)
ON CONFLICT DO NOTHING;

-- Configurações padrão
INSERT INTO settings (key, value) VALUES
  ('admin_password',   '1234'),
  ('shop_name_first',  'Barber'),
  ('shop_name_second', 'Pro'),
  ('schedule_open',    '09:00'),
  ('schedule_close',   '19:00'),
  ('schedule_interval','30'),
  ('schedule_days',    '[false,true,true,true,true,true,true]')
ON CONFLICT (key) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
--  Deixa as tabelas acessíveis via anon key (necessário para
--  o frontend funcionar sem autenticação de usuário).
--  Para produção real, adicione políticas mais restritivas.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE barbers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings     ENABLE ROW LEVEL SECURITY;

-- Leitura pública (clientes precisam ver barbeiros, serviços e horários)
CREATE POLICY "public_read_barbers"      ON barbers      FOR SELECT USING (true);
CREATE POLICY "public_read_services"     ON services     FOR SELECT USING (true);
CREATE POLICY "public_read_appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "public_read_blocks"       ON blocks       FOR SELECT USING (true);
CREATE POLICY "public_read_settings"     ON settings     FOR SELECT USING (true);

-- Escrita pública (clientes criam agendamentos; admin gerencia tudo pelo mesmo frontend)
-- Em produção você pode restringir isso com auth.role() = 'authenticated' para admin
CREATE POLICY "public_insert_appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_appointments" ON appointments FOR UPDATE USING (true);
CREATE POLICY "public_delete_appointments" ON appointments FOR DELETE USING (true);

CREATE POLICY "public_insert_barbers" ON barbers FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_barbers" ON barbers FOR DELETE USING (true);

CREATE POLICY "public_insert_services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_services" ON services FOR DELETE USING (true);

CREATE POLICY "public_insert_blocks"  ON blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_blocks"  ON blocks FOR DELETE USING (true);

CREATE POLICY "public_update_settings" ON settings FOR UPDATE USING (true);
