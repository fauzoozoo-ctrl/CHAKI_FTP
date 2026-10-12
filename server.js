const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// LOCAL fallback + Supabase config
const STORAGE = path.join(__dirname, 'storage');
fs.ensureDirSync(STORAGE);

// ADD YOUR SUPABASE DETAILS HERE AFTER CREATING PROJECT
const SUPABASE_URL = process.env.SUPABASE_URL || ''; // e.g. https://xxxxx.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_KEY || ''; // anon key
const USE_SUPABASE = SUPABASE_URL && SUPABASE_KEY;

app.use(cors());
app.use(express.json({limit:'50mb'}));

console.log(`Storage Mode: ${USE_SUPABASE ? 'SUPABASE PERMANENT ∞' : 'LOCAL (Add Supabase for permanent)'}`);

// Helper to upload to Supabase
async function uploadToSupabase(filename, buffer){
  if(!USE_SUPABASE) return false;
  try{
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/chaki-ftp/${filename}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/octet-stream'
      },
      body: buffer
    });
    return res.ok;
  }catch(e){ console.log('Supabase error', e); return false; }
}

app.get('/api/stats',(req,res)=>{
  const files=fs.readdirSync(STORAGE);
  let total=0; files.forEach(f=>{ try{ total+=fs.statSync(path.join(STORAGE,f)).size }catch(e){} });
  res.json({
    status: USE_SUPABASE ? 'LIVE PERMANENT ∞ SUPABASE' : 'LIVE LOCAL (Add Supabase for permanent)',
    project:'prj-db4so1flot8c73csl1fg',
    url:'https://chaki-ftp-server3.onrender.com',
    region: USE_SUPABASE ? 'Mumbai ap-south-1 PERMANENT' : 'Singapore (Add Supabase)',
    storage: USE_SUPABASE ? '∞ PERMANENT 25GB FREE' : 'Ephemeral - Add Supabase env vars',
    mode: USE_SUPABASE ? 'PERMANENT' : 'TEMPORARY',
    files:files.length,
    totalSize:(total/1024/1024).toFixed(2)+' MB'
  });
});

app.get('/api/files', async (req,res)=>{
  if(USE_SUPABASE){
    try{
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/chaki-ftp`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, 'Content-Type':'application/json'},
        body: JSON.stringify({limit:1000})
      });
      const data = await r.json();
      return res.json(data.map(f=>({name:f.name,size:f.metadata?.size||0,sizeMB:((f.metadata?.size||0)/1024/1024).toFixed(2),url:`${SUPABASE_URL}/storage/v1/object/public/chaki-ftp/${f.name}`, permanent:true})));
    }catch(e){ console.log(e); }
  }
  // fallback local
  const files=fs.readdirSync(STORAGE).map(f=>{
    const stat=fs.statSync(path.join(STORAGE,f));
    return {name:f,size:stat.size,sizeMB:(stat.size/1024/1024).toFixed(2),url:`/files/${f}`, permanent:false};
  });
  res.json(files);
});

app.post('/api/upload', express.raw({type:'*/*',limit:'500mb'}), async (req,res)=>{
  const name=req.headers['x-file-name']||`file-${Date.now()}.bin`;
  // Try Supabase first
  if(USE_SUPABASE){
    const ok = await uploadToSupabase(name, req.body);
    if(ok){
      console.log(`Uploaded PERMANENT: ${name}`);
      return res.json({ok:true,file:name,url:`${SUPABASE_URL}/storage/v1/object/public/chaki-ftp/${name}`,permanent:true,message:'Stored PERMANENT ∞ Supabase Mumbai'});
    }
  }
  // Fallback local
  fs.writeFileSync(path.join(STORAGE,name),req.body);
  console.log(`Uploaded LOCAL: ${name}`);
  res.json({ok:true,file:name,url:`/files/${name}`,permanent:false,message: USE_SUPABASE ? 'Supabase failed, stored local' : 'Stored local - Add Supabase for permanent'});
});

app.get('/files/:name',(req,res)=>{
  const file=path.join(STORAGE,req.params.name);
  if(fs.existsSync(file)) res.download(file);
  else res.status(404).json({error:'File not found - if using Supabase, use public URL'});
});

app.delete('/api/files/:name', async (req,res)=>{
  if(USE_SUPABASE){
    await fetch(`${SUPABASE_URL}/storage/v1/object/chaki-ftp/${req.params.name}`, {
      method:'DELETE',
      headers:{'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY}
    });
  }
  const file=path.join(STORAGE,req.params.name);
  if(fs.existsSync(file)) fs.removeSync(file);
  res.json({ok:true});
});

app.get('/',(req,res)=>{
  const files=fs.readdirSync(STORAGE);
  let total=0; files.forEach(f=>{ try{ total+=fs.statSync(path.join(STORAGE,f)).size }catch(e){} });
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHAKI FTP Permanent</title><style>body{background:#0B0F1A;color:#fff;font-family:system-ui;padding:20px;max-width:1000px;margin:0 auto}.card{background:#151A2A;padding:20px;border-radius:12px;margin:15px 0;border:1px solid #2A3050}.btn{background:#4F46E5;color:#fff;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;margin:5px}.badge{background:${USE_SUPABASE?'#10B981':'#EF4444'};padding:4px 10px;border-radius:20px;font-size:12px}.file{background:#1E2538;padding:12px;border-radius:8px;margin:6px 0;display:flex;justify-content:space-between;flex-wrap:wrap}pre{background:#000;padding:12px;border-radius:8px;overflow:auto;font-size:12px}</style></head><body><h1>🚀 CHAKI FTP - ${USE_SUPABASE?'PERMANENT ∞':'TEMPORARY'} Storage</h1><div class="card" style="border-color:${USE_SUPABASE?'#10B981':'#EF4444'}"><h3>${USE_SUPABASE?'✅ PERMANENT MODE':'⚠️ TEMPORARY MODE'}: ${USE_SUPABASE?'Supabase Mumbai ap-south-1':'Local (files delete on restart)'}</h3><p>📍 ${USE_SUPABASE?'Mumbai Permanent 25GB FREE':'Singapore Temporary'} | Project: prj-db4so1flot8c73csl1fg</p><p>💾 Files: ${files.length} | Storage: ${USE_SUPABASE?'∞ PERMANENT':'Ephemeral - Add Supabase'}</p><span class="badge">${USE_SUPABASE?'PERMANENT ∞':'TEMPORARY - ADD SUPABASE'}</span> ${USE_SUPABASE?'<span class="badge" style="background:#0EA5E9">MUMBAI</span>':''}</div>${!USE_SUPABASE?`<div class="card" style="border-color:#EF4444"><h3>⚠️ Add Permanent Storage Now</h3><p>Your files delete when Render restarts! Fix in 1 minute:</p><ol><li>Create Supabase project in Mumbai</li><li>Add 2 env vars in Render: SUPABASE_URL and SUPABASE_KEY</li><li>Redeploy - Files become permanent!</li></ol><pre>Render Dashboard -> chaki-ftp-server3 -> Environment -> Add:
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_KEY = eyJhbGciOi...

Then Manual Deploy</pre></div>`:''}<div class="card"><h3>📤 Upload - ${USE_SUPABASE?'Permanent':'Temporary'}</h3><input type="file" id="fileInput" style="padding:10px;background:#0B0F1A;border:1px solid #2A3050;border-radius:6px;color:#fff;width:100%;max-width:400px"><br><br><button class="btn" onclick="uploadFile()">⬆️ Upload ${USE_SUPABASE?'Permanent ∞':'Temp'}</button><button class="btn" style="background:#0EA5E9" onclick="location.reload()">🔄 Refresh</button><p id="status" style="margin-top:15px;font-weight:bold"></p></div><div class="card"><h3>📁 Files (${files.length})</h3><div id="list">Loading...</div></div><script>async function loadFiles(){ const r=await fetch('/api/files'); const files=await r.json(); document.getElementById('list').innerHTML=files.length?files.map(f=>`<div class="file"><div><strong>\${f.name}</strong><br><small>\${f.sizeMB} MB \${f.permanent?'| PERMANENT ∞':''}</small></div><div><a href="\${f.url}" target="_blank"><button class="btn" style="background:#10B981;padding:6px 12px">Download</button></a><button class="btn" style="background:#EF4444;padding:6px 12px" onclick="delFile('\${f.name}')">Delete</button></div></div>`).join(''):'No files yet'; } loadFiles(); async function uploadFile(){ const input=document.getElementById('fileInput'); if(!input.files[0]){alert('Select file');return} const file=input.files[0]; document.getElementById('status').innerText='Uploading '+file.name+'...'; try{ const res=await fetch('/api/upload',{method:'POST',body:await file.arrayBuffer(),headers:{'x-file-name':file.name}}); const data=await res.json(); document.getElementById('status').innerText='✅ '+data.message+': '+data.file; setTimeout(()=>{loadFiles(); location.reload();},1000); }catch(e){ document.getElementById('status').innerText='❌ '+e.message; } } async function delFile(name){ if(!confirm('Delete '+name+'?'))return; await fetch('/api/files/'+name,{method:'DELETE'}); loadFiles(); }</script></body></html>`);
});

app.listen(PORT,()=>console.log(`✅ CHAKI FTP ${USE_SUPABASE?'PERMANENT':'TEMP'} LIVE on ${PORT}`));
