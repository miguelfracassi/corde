const U=process.env.SUPABASE_URL,K=process.env.SUPABASE_SERVICE_KEY;
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
exports.U=U;exports.H=H;
exports.db=async(path,opt={})=>{const r=await fetch(U+'/rest/v1/'+path,{...opt,headers:{...H,Prefer:'return=representation',...(opt.headers||{})}});const t=await r.text();if(!r.ok)throw new Error(t);return t?JSON.parse(t):[]};
exports.user=async req=>{const t=(req.headers.authorization||'').replace('Bearer ','');if(!t)return null;const r=await fetch(U+'/auth/v1/user',{headers:{apikey:K,Authorization:'Bearer '+t}});return r.ok?r.json():null};
exports.body=req=>{try{return typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{})}catch{return{}}};
exports.enc=encodeURIComponent;
