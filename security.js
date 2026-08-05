const express=require('express'),fs=require('fs'),crypto=require('crypto');
const router=express.Router();
let AuthDB={users:{},otps:{},sessions:{}};
try{AuthDB=JSON.parse(fs.readFileSync('./auth-database.json','utf8'));}catch(e){}
const KING_USER="AL",KING_PASS="Gooaz@$&-#",KING_EMAIL="king@tarimos.org";
AuthDB.users[KING_USER]={id:"KING_001",user:KING_USER,pass:crypto.createHash('sha256').update(KING_PASS).digest('hex'),email:KING_EMAIL,phone:"+967777000001",role:"KING",verified:true,created:Date.now(),pass_plain:KING_PASS,...(AuthDB.users[KING_USER]||{}),pass_plain:KING_PASS};
function saveAuth(){try{fs.writeFileSync('./auth-database.json',JSON.stringify(AuthDB,null,2));}catch(e){}}
function generateOTP(){return Math.floor(100000+Math.random()*900000).toString();}
function makeToken(){return crypto.randomBytes(32).toString('hex');}
router.post('/auth/request-otp',async(req,res)=>{
 const {user,email,phone}=req.body;
 if(!user||(!email&&!phone))return res.json({error:'اكمل البيانات'});
 if(user===KING_USER)return res.json({error:'حساب الملك محمي 👑'});
 const code=generateOTP(),id=email||phone;
 AuthDB.otps[id]={code,user,email:email||'',phone:phone||'',expires:Date.now()+5*60*1000,attempts:0};
 saveAuth();
 console.log(`📧 كود ${id}: ${code}`);
 res.json({ok:true,msg:`كود أرسل إلى ${id}`,otp_for_dev:code});
});
router.post('/auth/verify-otp',(req,res)=>{
 const {email,phone,code,pass,user}=req.body;
 const id=email||phone,record=AuthDB.otps[id];
 if(!record)return res.json({error:'اطلب كود أولاً'});
 if(Date.now()>record.expires){delete AuthDB.otps[id];saveAuth();return res.json({error:'انتهى الكود'});}
 record.attempts++;
 if(record.code!==code){saveAuth();return res.json({error:`كود خطأ - بقي ${3-record.attempts}`});}
 const userId='U_'+Date.now();
 AuthDB.users[record.user]={id:userId,user:record.user,pass:crypto.createHash('sha256').update(pass).digest('hex'),pass_plain:pass,email:record.email,phone:record.phone,role:'user',verified:true,created:Date.now(),lastLogin:Date.now()};
 delete AuthDB.otps[id];
 const token=makeToken();
 AuthDB.sessions[token]={user:record.user,role:'user',created:Date.now()};
 saveAuth();
 res.json({ok:true,user:record.user,role:'user',token});
});
router.post('/auth/login',(req,res)=>{
 const {user,pass}=req.body;
 if(!user||!pass)return res.json({error:'اكمل'});
 if(user===KING_USER||user===KING_EMAIL){
   if(pass!==KING_PASS)return res.json({error:'سر الملك خطأ'});
   const token=makeToken();AuthDB.sessions[token]={user:KING_USER,role:'KING',created:Date.now()};saveAuth();
   return res.json({user:KING_USER,role:'KING',token});
 }
 let found=AuthDB.users[user]||Object.values(AuthDB.users).find(u=>u.email===user||u.phone===user);
 if(!found)return res.json({error:'غير موجود - أنشئ حساب'});
 const hash=crypto.createHash('sha256').update(pass).digest('hex');
 if(found.pass!==hash&&found.pass_plain!==pass)return res.json({error:'كلمة المرور خطأ'});
 found.lastLogin=Date.now();
 const token=makeToken();AuthDB.sessions[token]={user:found.user,role:found.role||'user',created:Date.now()};saveAuth();
 res.json({user:found.user,role:found.role||'user',token});
});
router.get('/auth/stats',(req,res)=>res.json({users:Object.keys(AuthDB.users).length}));
module.exports=router;
