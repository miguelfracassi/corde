# Configuração (Supabase + Mercado Pago + Vercel)

1. **Supabase**: crie o projeto, rode `schema.sql` e depois o SQL de `delete_my_account` (abaixo) no SQL Editor.
2. **config.js**: cole a Project URL e a anon key (valores públicos).
3. **Vercel > Settings > Environment Variables** (secretos, nunca no código):
   - `SUPABASE_URL` = mesma URL
   - `SUPABASE_SERVICE_KEY` = service_role key (Supabase > API)
   - `MP_ACCESS_TOKEN` = access token de produção do Mercado Pago (conta com chave PIX cadastrada)
   - `SITE_URL` = https://seu-dominio.com (sem barra no final)
   - `ADMIN_PASSWORD` = senha do /admin
4. Supabase > Authentication > URL Configuration: Site URL e Redirect `https://seu-dominio.com/suacord`.
5. O webhook do PIX é configurado automaticamente em cada cobrança (`/api/webhook`).

```sql
create or replace function public.delete_my_account() returns void language sql security definer set search_path = public, auth as $$ delete from auth.users where id = auth.uid(); $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
```
