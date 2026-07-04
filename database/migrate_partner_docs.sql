-- 1. Altera a constraint de status para incluir 'pending' e 'banned'
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('active', 'suspended', 'pending', 'banned'));

-- 2. Adiciona coluna para URL do CR file
alter table public.profiles add column if not exists cr_file_url text;

-- 3. Cria bucket de storage para documentos de parceiros
insert into storage.buckets (id, name, public)
values ('partner_docs', 'partner_docs', true)
on conflict (id) do nothing;

-- 4. Política: qualquer um pode ler arquivos do bucket (são públicos)
create policy "Public can read partner docs"
on storage.objects for select
using (bucket_id = 'partner_docs');

-- 5. Política: usuários autenticados podem fazer upload
create policy "Authenticated users can upload partner docs"
on storage.objects for insert
with check (bucket_id = 'partner_docs' and auth.role() = 'authenticated');
