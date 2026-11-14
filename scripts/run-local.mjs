import fs from 'node:fs';import {spawn} from 'node:child_process';
import path from 'node:path';
const settings=JSON.parse(fs.readFileSync('.runtime/local.json','utf8'));
console.log('Faiza Cash API: http://localhost:5080. Admin login and initial password: .runtime/local.json (local only).');
const output=fs.openSync('.runtime/api.log','a');
settings.Logs__Directory=path.resolve('.runtime/logs');
const child=spawn('dotnet',['run','--no-build','--project','backend/src/FaizaCash.Api'],{env:{...process.env,...settings},stdio:['inherit',output,output]});
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>child.kill());child.on('exit',code=>process.exit(code||0));
