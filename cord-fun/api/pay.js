const{db,user,body,enc}=require('./_lib');
module.exports=async(req,res)=>{try{
  if(req.method!=='POST')return res.status(405).end();
  const u=await user(req);if(!u)return res.status(401).json({error:'Faça login.'});
  const{code}=body(req);
  const[inv]=await db(`invoices?code=eq.${enc(code||'')}&user_id=eq.${u.id}&select=*`);
  if(!inv)return res.status(404).json({error:'Fatura não encontrada.'});
  if(inv.status!=='pending')return res.status(400).json({error:'Esta fatura não está pendente.'});
  if(inv.pix_code&&inv.pix_at&&Date.now()-new Date(inv.pix_at)<20*3600e3)return res.json({pix_code:inv.pix_code,pix_qr:inv.pix_qr});
  const r=await fetch('https://api.mercadopago.com/v1/payments',{method:'POST',headers:{Authorization:'Bearer '+process.env.MP_ACCESS_TOKEN,'Content-Type':'application/json','X-Idempotency-Key':inv.code+'-'+Date.now()},
    body:JSON.stringify({transaction_amount:inv.amount_cents/100,description:inv.description,payment_method_id:'pix',external_reference:inv.code,notification_url:process.env.SITE_URL+'/api/webhook',payer:{email:u.email}})});
  const p=await r.json();if(!r.ok)throw new Error(p.message||'Erro no Mercado Pago');
  const t=p.point_of_interaction.transaction_data;
  await db(`invoices?id=eq.${inv.id}`,{method:'PATCH',body:JSON.stringify({pix_code:t.qr_code,pix_qr:t.qr_code_base64,pix_at:new Date().toISOString(),mp_payment_id:String(p.id)})});
  res.json({pix_code:t.qr_code,pix_qr:t.qr_code_base64});
}catch(e){res.status(500).json({error:e.message})}};
