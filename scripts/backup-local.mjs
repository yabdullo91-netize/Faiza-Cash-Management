import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export function localDatabase() {
  const cfg=JSON.parse(fs.readFileSync('.runtime/local.json','utf8'));
  const fields=Object.fromEntries(cfg.ConnectionStrings__CashDb.split(';').filter(Boolean).map(part=>{
    const index=part.indexOf('='); return [part.slice(0,index),part.slice(index+1)];
  }));
  const bin=process.env.PG_BIN || 'C:/Program Files/PostgreSQL/18/bin';
  function run(tool,args=[],input) {
    const result=spawnSync(path.join(bin,tool+'.exe'),['-h',fields.Host||'127.0.0.1','-p',fields.Port||'5432','-U',fields.Username,'-d',fields.Database,'-w',...args],{
      env:{...process.env,PGPASSWORD:fields.Password,PGCLIENTENCODING:'UTF8'},input,encoding:'utf8'
    });
    if(result.error || result.status!==0) throw new Error(`${tool} failed: ${result.error?.message || result.stderr}`);
    return result.stdout.trim();
  }
  return {cfg,run};
}

export function backupLocal(run=localDatabase().run) {
  fs.mkdirSync('.runtime/backups',{recursive:true});
  const destination='.runtime/backups/cash-'+new Date().toISOString().replace(/[:.]/g,'-')+'.dump';
  run('pg_dump',['-Fc','-f',destination]);
  if(fs.statSync(destination).size===0) throw new Error('Empty backup');
  console.log('Database backup saved: '+destination);
  return destination;
}

if(process.argv[1] && path.resolve(process.argv[1])===path.resolve('scripts/backup-local.mjs')) backupLocal();
