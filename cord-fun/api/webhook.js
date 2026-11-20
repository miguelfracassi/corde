/* O Mercado Pago avisa aqui. Nunca confiamos no aviso: consultamos o pagamento direto na API deles. */
const{db,body,enc}=require('./_lib');
module.exports=async(req,res)=>{try{
  const b=body(req);const id=(b.data&&b.data.id)||(req.query&&(req.query['data.id']||req.query.id));
  if(id){
    const p=await(await fetch('https://api.mercadopago.com/v1/payments/'+enc(id),{headers:{Authorization:'Bearer '+process.env.MP_ACCESS_TOKEN}})).json();
    if(p.status==='approved'&&p.external_reference)
      await db(`invoices?code=eq.${enc(p.external_reference)}&status=eq.pending&amount_cents=eq.${Math.round(p.transaction_amount*100)}`,
        {method:'PATCH',body:JSON.stringify({status:'paid',paid_at:new Date().toISOString(),mp_payment_id:String(p.id)})});
  }
  res.status(200).end('ok');
}catch(e){res.status(500).end()}};
