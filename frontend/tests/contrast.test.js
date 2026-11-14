import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
function luminance(hex){let value=hex.replace('#','');if(value.length===3)value=[...value].map(c=>c+c).join('');const rgb=value.match(/.{2}/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];}
function ratio(a,b){return(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);}
test('primary and secondary text design tokens satisfy AA contrast in both themes',()=>{
  const css=fs.readFileSync(new URL('../src/styles/refinements.css',import.meta.url),'utf8');
  for(const block of [css.match(/:root\{([^}]+)/)[1],css.match(/\[data-theme=dark\]\{([^}]+)/)[1]]){
    const tokens=Object.fromEntries([...block.matchAll(/--([\w-]+):(#[\da-f]{3,6})/gi)].map(m=>[m[1],m[2]]));
    for(const text of ['text','muted'])for(const background of ['panel','bg'])assert.ok(ratio(tokens[text],tokens[background])>=4.5,`${text} on ${background} must meet 4.5:1`);
  }
});
