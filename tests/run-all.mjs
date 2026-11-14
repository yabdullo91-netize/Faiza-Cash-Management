import {spawn} from 'node:child_process';
// Database suites share one throwaway schema and must run sequentially.
const npm=process.platform==='win32'?'npm.cmd':'npm';
const commands=[
 ['dotnet',['build','backend/FaizaCash.sln','--nologo']],
 ['dotnet',['test','backend/tests/FaizaCash.UnitTests','--no-build','--nologo','--logger','trx;LogFileName=unit-tests.trx','--results-directory','.runtime/unit-results']],
 [npm,['--prefix','frontend','test']],
 [npm,['--prefix','frontend','run','build']],
 [process.execPath,['tests/integration.mjs','--suite=integration']],
 [process.execPath,['tests/security.mjs']],
 [process.execPath,['tests/catalog.mjs']],
 [process.execPath,['tests/ledger-integrity.mjs']]
];
for(const [command,args] of commands){
 const code=await new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:'inherit',shell:command.endsWith('.cmd')});child.on('error',reject);child.on('exit',resolve);});
 if(code!==0){process.exitCode=typeof code==='number'?code:1;break;}
}
