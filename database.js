// database.js - TARIM OS V1.0 Beta - قاعدة البيانات السيادية - الذاكرة المؤقتة
const fs=require('fs');

let FeedDB={posts:[],follows:{},likes:{},users:[]};

try{
  if(fs.existsSync('./feed-database.json')){
    FeedDB=JSON.parse(fs.readFileSync('./feed-database.json','utf8'));
    console.log('📦 تم تحميل قاعدة البيانات:', FeedDB.posts.length, 'فيديو');
  }
}catch(e){
  console.log('📦 قاعدة بيانات جديدة - تريم تنزل الميدان');
}

function saveFeed(){
  try{
    fs.writeFileSync('./feed-database.json', JSON.stringify(FeedDB,null,2));
  }catch(e){ console.log('Save error', e.message); }
}

module.exports={FeedDB,saveFeed};
