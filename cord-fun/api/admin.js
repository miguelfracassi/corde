const crypto=require('crypto');
const{U,H,db,body}=require('./_lib');
const fails={};
module.exports=async(req,res)=>{try{
  const ip=String(req.headers['x-forwarded-for']||'x').split(',')[0],f=fails[ip]||{n:0,t:0};
  if(f.n>=5&&Date.now()-f.t<600000)return res.status(429).json({error:'Muitas tentativas. Aguarde 10 minutos.'});
  const b=body(req),pw=process.env.ADMIN_PASSWORD;
  const a=Buffer.from(String(b.password||'')),k=Buffer.from(pw||'');
  if(!pw||a.length!==k.length||!crypto.timingSafeEqual(a,k)){fails[ip]={n:f.n+1,t:Date.now()};return res.status(401).json({error:'Senha incorreta.'})}
  fails[ip]={n:0,t:0};
  const int=(v,min,max)=>{v=Number(v);if(!Number.isInteger(v)||v<min||v>max)throw new Error('Valor inválido.');return v};
  switch(b.action){
   case'ping':return res.json({ok:true});
   case'users':{const r=await(await fetch(U+'/auth/v1/admin/users?per_page=200',{headers:H})).json();
     return res.json((r.users||[]).map(x=>({id:x.id,email:x.email,name:x.user_metadata&&x.user_metadata.full_name,phone:x.user_metadata&&x.user_metadata.phone,created:x.created_at})))}
   case'products':return res.json(await db('products?order=created_at.desc'));
   case'product_create':{const n=String(b.name||'').trim();if(!n)throw new Error('Nome obrigatório.');
     return res.json(await db('products',{method:'POST',body:JSON.stringify({name:n,description:b.description||null,price_cents:int(b.price_cents,1,100000000)})}))}
   case'invoices':return res.json(await db('invoices?order=due_date.desc&limit=300&select=code,user_id,description,amount_cents,due_date,status,subscription_id'));
   case'invoice_create':{
     const months=int(b.months||1,1,60),cents=int(b.amount_cents,1,100000000);
     if(!/^\d{4}-\d{2}-\d{2}$/.test(b.first_due||''))throw new Error('Data inválida.');
     const sub=months>1?crypto.randomUUID():null,rows=[];
     for(let i=0;i<months;i++){const d=new Date(b.first_due+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+i);const due=d.toISOString().slice(0,10);
       if(b.cancel_at&&due>b.cancel_at)break;
       rows.push({code:crypto.randomBytes(6).toString('hex'),user_id:b.user_id,subscription_id:sub,product_id:b.product_id||null,description:String(b.description||'').trim()||'Fatura',amount_cents:cents,due_date:due,cancel_at:b.cancel_at||null})}
     if(!rows.length)throw new Error('A data de cancelamento é anterior ao primeiro vencimento.');
     return res.json(await db('invoices',{method:'POST',body:JSON.stringify(rows)}))}
   case'upload':{const buf=Buffer.from(String(b.data||''),'base64');
     if(buf.length<100||buf.length>3e6||buf[0]!==0xFF||buf[1]!==0xD8)throw new Error('Envie uma imagem JPEG de até 3 MB.');
     const name=crypto.randomBytes(10).toString('hex')+'.jpg';
     const r=await fetch(U+'/storage/v1/object/blog/'+name,{method:'POST',headers:{apikey:H.apikey,Authorization:H.Authorization,'Content-Type':'image/jpeg'},body:buf});
     if(!r.ok)throw new Error('Falha ao enviar imagem (o bucket "blog" existe?).');
     return res.json({url:U+'/storage/v1/object/public/blog/'+name})}
   case'posts':return res.json(await db('posts?order=created_at.desc&select=id,slug,title,author_name,created_at'));
   case'post_create':{
     const title=String(b.title||'').trim(),desc=String(b.description||'').trim(),author=String(b.author_name||'').trim();
     if(!title||!desc||!author)throw new Error('Título, texto e autor são obrigatórios.');
     const https=v=>v&&String(v).startsWith('https://')?String(v):null;
     const base=title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'post';
     let slug=base,n=1;while((await db('posts?slug=eq.'+encodeURIComponent(slug)+'&select=id')).length)slug=base+'-'+(++n);
     return res.json(await db('posts',{method:'POST',body:JSON.stringify({slug,title,description:desc,author_name:author,cover_url:https(b.cover_url),author_photo:https(b.author_photo)})}))}
   case'post_delete':return res.json(await db('posts?id=eq.'+encodeURIComponent(String(b.id||'')),{method:'DELETE'}));
   default:return res.status(400).json({error:'Ação inválida.'});
  }
}catch(e){res.status(500).json({error:e.message})}};
