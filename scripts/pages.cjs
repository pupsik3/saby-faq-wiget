// Dependency-free packaging of the existing prototype, never a second source tree.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const entry=['index.html','styles.css','property-grid.css','widget-store.css','scenario-shell.css','frame-fit.js','canvas-scroll.js','icon-picker.js','property-grid.js','widget-store.js','preview.js','scenario-shell.js'];
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const source=entry.map(read).join('\n');
const assets=fs.readdirSync(path.join(root,'assets')).filter(f=>{
 const stem=f.replace(/^pg-/,'').replace(/\.[^.]+$/,'');
 return source.includes(f)||source.includes("'"+stem+"'")||source.includes('"'+stem+'"')||/^(?:document-)?reveal-(?:inline|overlay)(?:-open\.png|\.gif)$/.test(f)||/^pg-(?:reveal-marker-|menu-)/.test(f)||/^store-(?:catalog|crm|markup|points|reports|sales)\.png$/.test(f);
}).map(f=>'assets/'+f);
const fonts=[...source.matchAll(/Fonts\/[A-Za-z0-9_./-]+\.ttf/g)].map(m=>m[0]);
const siteFiles=[...new Set([...entry,...assets,...fonts])].sort();
const repositoryFiles=[...new Set([...entry,'server.cjs','.gitignore','README.md','AGENTS.md','FUNCTIONS.md','STATUS.md','.github/workflows/pages.yml','scripts/pages.cjs','scripts/preview-pages.cjs',...fs.readdirSync(path.join(root,'docs')).filter(f=>f.endsWith('.md')).map(f=>'docs/'+f),...fs.readdirSync(path.join(root,'assets')).map(f=>'assets/'+f),...fonts])].sort();
function exactFile(relative){
 let current=root;
 for(const part of relative.split('/')){if(!part||part==='..'||!fs.readdirSync(current).includes(part))throw Error('Missing file or wrong filename case: '+relative);current=path.join(current,part);}
 const stat=fs.lstatSync(current);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Not a regular file: '+relative);
}
function audit(){
 for(const f of repositoryFiles)exactFile(f);
 for(const f of entry.filter(f=>f.endsWith('.js')))new vm.Script(read(f),{filename:f});
 const findings=[];
 for(const f of siteFiles){
  if(!/\.(?:js|css|html|svg)$/.test(f))continue;
  const text=read(f);
  if(/(?:localhost|127\.0\.0\.1|file:\/\/|\b[A-Z]:[\\/])/i.test(text))findings.push(f+': local address/path');
  for(const match of text.matchAll(/(?:src|href|srcset)=["']([^"']+)["']|url\(\s*["']?([^)'"\s]+)/g)){
   const ref=match[1]||match[2];if(/^(?:data:|https?:|#)/.test(ref)||ref.includes('${'))continue;
   if(ref.startsWith('/'))throw Error('Root-relative resource: '+f+' -> '+ref);
   if(!/\.(?:html|css|js|png|jpg|jpeg|gif|svg|ttf)(?:[?#]|$)/i.test(ref))continue;
   const target=path.posix.normalize(path.posix.join(path.posix.dirname(f),ref.split(/[?#]/)[0]));exactFile(target);
   if(!siteFiles.includes(target))throw Error('Resource missing from Pages package: '+target);
  }
 }
 if(findings.length)throw Error(findings.join('\n'));
 const secretFiles=[];
 for(const f of repositoryFiles.filter(f=>/\.(?:js|cjs|css|html|md|yml|svg)$/.test(f))){const text=read(f);if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}|\bAKIA[A-Z0-9]{16}\b/.test(text))secretFiles.push(f);}
 if(secretFiles.length)throw Error('Potential secret detected; values withheld: '+secretFiles.join(', '));
 const reportDir=path.join(root,'.publication');fs.mkdirSync(reportDir,{recursive:true});
 fs.writeFileSync(path.join(reportDir,'repository-files.txt'),repositoryFiles.join('\n')+'\n');
 fs.writeFileSync(path.join(reportDir,'pages-files.txt'),[...siteFiles,'.nojekyll'].join('\n')+'\n');
 fs.writeFileSync(path.join(reportDir,'audit.json'),JSON.stringify({repositoryFiles:repositoryFiles.length,siteFiles:siteFiles.length+1,siteBytes:siteFiles.reduce((n,f)=>n+fs.statSync(path.join(root,f)).size,0),secretPatternFindings:0,localRuntimePaths:0,externalLinks:[...new Set([...source.matchAll(/https?:\/\/[^\s"'<>`]+/g)].map(m=>m[0]))]},null,2)+'\n');
 console.log('Audit passed: '+repositoryFiles.length+' repository files; '+(siteFiles.length+1)+' Pages files. Inventories: .publication/');
}
const command=process.argv[2]||'audit';
if(command==='list-repository'){console.log(repositoryFiles.join('\n'));process.exit(0);}
if(!['audit','build'].includes(command))throw Error('Use: node scripts/pages.cjs audit|build|list-repository');
audit();
if(command==='build'){
 if(out!==path.join(root,'dist')||!out.startsWith(root+path.sep))throw Error('Unsafe output directory');
 if(fs.existsSync(out)&&fs.lstatSync(out).isSymbolicLink())throw Error('Output must not be a symlink');
 fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 for(const f of siteFiles){const target=path.join(out,f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,f),target);}
 fs.writeFileSync(path.join(out,'.nojekyll'),'');console.log('Static package prepared in dist/; original app files copied byte-for-byte.');
}
