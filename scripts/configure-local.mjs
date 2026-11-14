import fs from 'node:fs';import {spawnSync} from 'node:child_process';import crypto from 'node:crypto';
let password='';for await(const chunk of process.stdin)password+=chunk;
const env={...process.env,PGPASSWORD:password.trim(),PGCLIENTENCODING:'UTF8'};
const psql=(database,sql)=>spawnSync('C:/Program Files/PostgreSQL/18/bin/psql.exe',['-h','127.0.0.1','-U','postgres','-d',database,'-w','-v','ON_ERROR_STOP=1'],{env,input:sql,encoding:'utf8'});
const check=psql('postgres','SELECT 1;');if(check.status!==0){console.log('PostgreSQL connection failed:',check.stderr);process.exit(1);}
const suffix=Date.now().toString(36),role='faiza_'+suffix,db='faiza_'+suffix,appPassword=crypto.randomBytes(32).toString('hex');
const result=psql('postgres',`CREATE ROLE ${role} LOGIN PASSWORD '${appPassword}'; CREATE DATABASE ${db} OWNER ${role}; CREATE DATABASE ${db}_test OWNER ${role};`);
if(result.status!==0){console.error(result.stderr);process.exit(1);}
fs.mkdirSync('.runtime',{recursive:true});
fs.writeFileSync('.runtime/local.json',JSON.stringify({ConnectionStrings__CashDb:`Host=127.0.0.1;Port=5432;Database=${db};Username=${role};Password=${appPassword}`,Jwt__Key:crypto.randomBytes(48).toString('hex'),Seed__AdminLogin:'admin',Seed__AdminPassword:crypto.randomBytes(12).toString('hex')+'Aa1',ASPNETCORE_URLS:'http://localhost:5080',ASPNETCORE_ENVIRONMENT:'Development'},null,2));
console.log('Connected. Dedicated development and test databases created. Local configuration saved in ignored .runtime/local.json.');
