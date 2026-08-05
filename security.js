// security.js - TARIM OS V1.0 Beta - بوابة الدخول السيادية - الإمبراطور AL
const express=require('express'),fs=require('fs'),crypto=require('crypto');
const router=express.Router();

let AuthDB={users:{},otps:{},sessions:{}};
try{
  if(fs.existsSync('./auth-database.json')){
    AuthDB=JSON.parse(fs.readFileSync('./auth-database.json','utf8'));
  }
}catch(e){}

const KING_USER="AL";
const KING_PASS="Gooaz@$&-#"; // غيره في Render ENV مستقبلاً
const KING_EMAIL="king@tarimos.org";

// حماية حساب الملك - لا يحفظ pass_plain أبداً في الملف الجديد
if(!AuthDB.users[KING_USER]){
  AuthDB.users[KING_USER]={
    id:"KING_001",
    user:KING_USER,
    pass:crypto.createHash('sha256').update(KING_PASS).digest('hex'),
    email:KING_EMAIL,
    phone:"+967777000001",
    role:"KING",
    verified:true,
    created:Date.now()
  };
}

function saveAuth(){try{fs.writeFileSync('./auth-database.json',JSON.stringify(AuthDB,null,2));}catch(e){}}
function generateOTP(){return Math.floor(100000+Math.random()*900000).toString();}
function makeToken(){return crypto.randomBytes(32).toString('hex');}

// طلب كود
router.post('/auth/request-otp',(req,res)=>{
 const {user,email,phone}=req.body;
 if(!user||(!email&&!phone))return res.json({error:'أكمل البيانات - اسم المستخدم + إيميل أو جوال'});
 if(user===KING_USER)return res.json({error:'حساب الملك محمي 👑 - ادخل مباشرة بكلمة سر الملك'});
 const code=generateOTP(),id=email||phone;
 AuthDB.otps[id]={code,user,email:email||'',phone:phone||'',expires:Date.now()+5*60*1000,attempts:0};
 saveAuth();
 console.log(`📧 [TARIM OTP] كود ${id}: ${code}`);
 // في الإنتاج ترسل عبر SMS/Email - الآن نرجعه للتجربة
 res.json({ok:true,msg:`كود سيادي أرسل إلى ${id} - صالح 5 دقايق`,otp_for_dev:code});
});

// تأكيد كود + إنشاء حساب
router.post('/auth/verify-otp',(req,res)=>{
 const {email,phone,code,pass,user}=req.body;
 const id=email||phone,record=AuthDB.otps[id];
 if(!record)return res.json({error:'اطلب كود أولاً - اضغط طلب كود'});
 if(Date.now()>record.expires){delete AuthDB.otps[id];saveAuth();return res.json({error:'انتهى الكود - اطلب جديد'});}
 record.attempts++;
 if(record.code!==code){
   if(record.attempts>=3){delete AuthDB.otps[id];saveAuth();return res.json({error:'3 محاولات خطأ - اطلب كود جديد'});}
   saveAuth();return res.json({error:`كود خطأ - بقي ${3-record.attempts} محاولات`});
 }
 if(!pass||pass.length<4)return res.json({error:'كلمة المرور قصيرة - 4 أحرف على الأقل'});
 const userId='U_'+Date.now();
 AuthDB.users[record.user]={
   id:userId,
   user:record.user,
   pass:crypto.createHash('sha256').update(pass).digest('hex'),
   email:record.email,
   phone:record.phone,
   role:'user',
   verified:true,
   created:Date.now(),
   lastLogin:Date.now()
 };
 delete AuthDB.otps[id];
 const token=makeToken();
 AuthDB.sessions[token]={user:record.user,role:'user',created:Date.now()};
 saveAuth();
 console.log(`✅ مستخدم جديد: ${record.user}`);
 res.json({ok:true,user:record.user,role:'user',token});
});

// دخول
router.post('/auth/login',(req,res)=>{
 const {user,pass}=req.body;
 if(!user||!pass)return res.json({error:'أكمل اسم المستخدم وكلمة المرور'});
 // دخول الملك
 if(user===KING_USER||user===KING_EMAIL||user==="AL"){
   if(pass!==KING_PASS)return res.json({error:'سر الملك خطأ - تأكد من الرمز 👑'});
   const token=makeToken();AuthDB.sessions[token]={user:KING_USER,role:'KING',created:Date.now()};saveAuth();
   console.log(`👑 الملك AL دخل القلعة`);
   return res.json({ok:true,user:KING_USER,role:'KING',token});
 }
 let found=AuthDB.users[user]||Object.values(AuthDB.users).find(u=>u.email===user||u.phone===user);
 if(!found)return res.json({error:'غير موجود - أنشئ حساب جديد بالضغط على حساب جديد'});
 const hash=crypto.createHash('sha256').update(pass).digest('hex');
 if(found.pass!==hash)return res.json({error:'كلمة المرور خطأ'});
 found.lastLogin=Date.now();
 const token=makeToken();AuthDB.sessions[token]={user:found.user,role:found.role||'user',created:Date.now()};saveAuth();
 res.json({ok:true,user:found.user,role:found.role||'user',token});
});

router.post('/auth/google',(req,res)=>{
  // دخول Google السيادي - مؤقت
  const token=makeToken();
  const gUser='google_'+Date.now();
  AuthDB.sessions[token]={user:gUser,role:'user',created:Date.now()};
  saveAuth();
  res.json({ok:true,user:gUser,role:'user',token});
});

router.get('/auth/stats',(req,res)=>res.json({ok:true,users:Object.keys(AuthDB.users).length,king:KING_USER}));

module.exports=router;
