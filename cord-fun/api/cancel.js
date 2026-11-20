const{db,user,body,enc}=require('./_lib');
module.exports=async(req,res)=>{try{
  const u=await user(req);if(!u)return res.status(401).json({error:'Faça login.'});
  const{subscription_id}=body(req);if(!subscription_id)return res.status(400).json({error:'Assinatura inválida.'});
  const hoje=new Date().toISOString().slice(0,10);
  const r=await db(`invoices?subscription_id=eq.${enc(subscription_id)}&user_id=eq.${u.id}&status=eq.pending&due_date=gte.${hoje}`,{method:'PATCH',body:JSON.stringify({status:'canceled'})});
  res.json({canceled:r.length});
}catch(e){res.status(500).json({error:e.message})}};
