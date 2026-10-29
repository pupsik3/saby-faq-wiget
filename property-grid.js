// One PG transaction for a FAQ or one nested spoiler; navigation shares its draft.
window.createFaqPropertyGrid = function(api) {
  const buttonEditorDefaults=()=>({iconSize:null,width:null,height:null,states:{rest:{},hover:{},active:{},activeHover:{}}});
  const borderDefaults=()=>({enabled:false,color:'#D2D6DA',opacity:100,line:'solid',thickness:1,sides:['top','right','bottom','left']});
  const faqStyleDefaults=()=>({border:borderDefaults(),rounding:{enabled:false,value:6}});
  const styleDefaults=()=>({border:borderDefaults(),rounding:{enabled:false,value:6},background:{color:null,opacity:100},padding:{top:0,right:0,bottom:0,left:0}});
  function profileStyles(id){const faqStyle=faqStyleDefaults(),spoilerStyle=styleDefaults();if(id==='outline'){faqStyle.border.enabled=true;faqStyle.rounding={enabled:true,value:8};spoilerStyle.padding={top:12,right:12,bottom:12,left:12};}if(id==='filled'){spoilerStyle.background.color='#F3F5F7';spoilerStyle.rounding={enabled:true,value:8};spoilerStyle.padding={top:12,right:12,bottom:12,left:12};}return {faqStyle,spoilerStyle};}
  const defaults = () => ({faqStyle:faqStyleDefaults(),spoilerStyle:styleDefaults(),background:{enabled:true,color:null,opacity:100},dividers:{enabled:false,color:'#D2D6DA',opacity:100,line:'solid',thickness:1,outer:false},button:{side:'left',edges:false,visible:true,icon:'triangle',editor:buttonEditorDefaults(),visibilityPolicy:'always'},question:{color:'#000000',opacity:100,style:'main',bold:null,italic:false,underline:null,strike:false},answer:{style:"main",color:"#000000",opacity:100,bold:null,italic:false,underline:false,strike:false},size:{horizontal:0,vertical:0,gap:8,gapCustom:false},accent:{scope:'none',width:0,opacity:100},appearance:'standard',presetManaged:false,appearanceModified:false,reveal:'inline'});
  const normalized = value => {
    const base = defaults();
    const editor=value?.button?.editor||{};
    const profiles=profileStyles(value?.appearance);
    const normalizeStyle=(v,fallback,faq=false)=>{const d=v||fallback;const style={...styleDefaults(),...clone(d),border:{...borderDefaults(),...clone(d?.border||{})},rounding:{enabled:false,value:6,...d?.rounding},background:{color:null,opacity:100,...d?.background},padding:{top:0,right:0,bottom:0,left:0,...d?.padding}};if(faq){delete style.background;delete style.padding;}return style;};
    return {...base,...structuredClone(value || {}),faqStyle:normalizeStyle(value?.faqStyle,profiles.faqStyle,true),spoilerStyle:normalizeStyle(value?.spoilerStyle,profiles.spoilerStyle),accent:clone(value?.accent||accentFor(value?.appearance)),background:{...base.background,...value?.background,enabled:true},dividers:{...base.dividers,...value?.dividers,...(!value?.faqStyle&&value?.appearance==='outline'?{enabled:true}:{})},button:{...base.button,...value?.button,editor:{...base.button.editor,...editor,states:{rest:{...editor.states?.rest},hover:{...editor.states?.hover},active:{...editor.states?.active},activeHover:{...editor.states?.activeHover}}}},question:{...base.question,...value?.question,...(value?.question?.style==='preset'?{style:'main'}:{}),font:{...clone(value?.question?.font||appearanceFont(value?.appearance||'standard')),...(value?.question?.style==='preset'?{styleId:'main'}:{})},underlineStyle:value?.question?.underlineStyle||(value?.appearance==='link'?'dashed':'solid')},answer:{...base.answer,...value?.answer},size:{...base.size,...value?.size,...(!value?.faqStyle&&value?.appearance==='outline'&&!value?.size?.gapCustom?{gap:0}:{})}};
  };
  const clone = value => structuredClone(value);
  const later = 'Будет подключено следующим этапом';
  let transaction = null, level = 'main', tab = 'rest', previousFocus = null, entry = null;
  const individualRoots=['question','answer','button','spoilerStyle'];
  const standalone=()=>Boolean(api.isStandalone?.());
  const owner=()=>api.getOwner?api.getOwner():api.getFaq();
  const individual=()=>transaction?.type==='spoiler';
  const itemById=id=>(api.getItems?.()||api.getFaq()?.items||[]).find(item=>item.id===id);
  const commonSettings=()=>normalized(transaction&&!individual()&&!transaction.type.startsWith('demo-')?transaction.draft:owner()?.settings.propertyGrid);
  const styleScope=()=>standalone()||individual()||level!=='main'?'spoilerStyle':'faqStyle';
  const allowedPath=path=>individualRoots.includes(path.split('.')[0]);
  const under=(path,prefix)=>path===prefix||path.startsWith(prefix+'.');
  function leaves(value,prefix='',result={}){
    if(value&&typeof value==='object'&&!Array.isArray(value)){for(const [key,child] of Object.entries(value))leaves(child,prefix?prefix+'.'+key:key,result);}
    else result[prefix]=value;
    return result;
  }
  function changedPaths(before,after){const a=leaves(before),b=leaves(after);return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(key=>JSON.stringify(a[key])!==JSON.stringify(b[key]));}
  function assignPath(target,path,value){const keys=path.split('.');if(keys.some(key=>['__proto__','constructor','prototype'].includes(key)))return;let node=target;for(const key of keys.slice(0,-1))node=node[key]??={};if(value===undefined)delete node[keys.at(-1)];else node[keys.at(-1)]=clone(value);}
  function commonReplacements(){return transaction&&!individual()?[...changedPaths(transaction.original,transaction.draft),...(transaction.replaced||[])]:[];}
  function individualBase(settings=commonSettings()){
    const result=clone(settings);
    result.question.font={...questionFont(settings),styleId:settings.question.style};
    result.answer.font={...(settings.answer.font||appearanceFont('standard')),styleId:settings.answer.style||'main'};
    return result;
  }
  function effectiveSettings(item,base=commonSettings()){
    if(!item)return clone(base);
    if(item.demoSettings)return normalized(item.demoSettings);
    if(standalone())return normalized(transaction?.id===item.id?transaction.draft:item.settings.propertyGrid);
    if(individual()&&transaction.id===item.id){
      const result=clone(transaction.draft);
      result.appearance=base.appearance;result.accent=clone(base.accent);
      result.button.visible=base.button.visible;result.button.visibilityPolicy=base.button.visibilityPolicy;
      return result;
    }
    const result=individualBase(base),replaced=commonReplacements();
    for(const [path,value] of Object.entries(item.settings?.propertyGridOverrides||{}))if(allowedPath(path)&&!replaced.some(prefix=>under(path,prefix)))assignPath(result,path,value);
    return result;
  }
  function writeIndividual(item){
    const overrides=clone(item.settings?.propertyGridOverrides||{}),base=leaves(individualBase()),draft=leaves(transaction.draft);
    for(const path of Object.keys(overrides))if((transaction.reset||[]).some(prefix=>under(path,prefix)))delete overrides[path];
    for(const path of changedPaths(transaction.original,transaction.draft).filter(allowedPath)){
      if(JSON.stringify(draft[path])===JSON.stringify(base[path])||draft[path]===undefined)delete overrides[path];else overrides[path]=clone(draft[path]);
    }
    if(Object.keys(overrides).length)(item.settings??={}).propertyGridOverrides=overrides;
    else if(item.settings?.propertyGridOverrides)delete item.settings.propertyGridOverrides;
  }
  function replaceCommonOverrides(){
    if(standalone())return;
    const paths=commonReplacements();for(const item of api.getFaq().items){const overrides=item.settings?.propertyGridOverrides;if(!overrides)continue;for(const key of Object.keys(overrides))if(paths.some(path=>under(key,path)))delete overrides[key];if(!Object.keys(overrides).length)delete item.settings.propertyGridOverrides;}
  }
  const supportsButton=settings=>{const button=individual()?commonSettings().button:settings.button;return button.visible!==false&&button.visibilityPolicy!=='editor-hover';};
  const resetPrefixes=()=>level==='typography'?['question','answer']:level==='button'?['button.editor']:individualRoots;
  const individualResettable=()=>changedPaths(individualBase(),transaction.draft).some(path=>resetPrefixes().some(prefix=>under(path,prefix)));
  function defaultResetDraft(){
    const draft=clone(transaction.draft),base=normalized(defaults());
    if(level==='typography'){draft.question=clone(base.question);draft.answer=clone(base.answer);}
    else if(level==='button')draft.button.editor=clone(base.button.editor);
    else if(level==='spoilers')draft.spoilerStyle=clone(base.spoilerStyle);
    else if(level==='size'){if(standalone())draft.spoilerStyle.padding=clone(base.spoilerStyle.padding);else draft.size=clone(base.size);}
    else return {...draft,...base};
    return draft;
  }
  const resetAvailable=()=>individual()?individualResettable():changedPaths(individualBase(normalized(defaultResetDraft())),individualBase(normalized(transaction.draft))).length>0;
  function updateResetAvailability(){
    const button=header.querySelector('.pg-reset'),enabled=resetAvailable();
    button.disabled=!enabled;
    if(enabled)button.dataset.pgCommand='reset';else delete button.dataset.pgCommand;
    button.title='Сбросить настройки';
  }
  function markCommon(...paths){if(transaction&&!individual())transaction.replaced.push(...paths);}
  function surfaceChanged(){api.surfaceChanged?.(transaction?(entry?.kind||'properties'):null);}
  function finishSelection(){if(entry?.kind==='appearance'||entry?.kind==='reveal')save();else {render(true);paint();closeChoice(false);}}
  const panel = document.createElement('section');
  panel.className = 'property-grid pg-shell'; panel.hidden = true;
  const titleId=api.scenarioId&&api.scenarioId!=='site'?`pg-title-${api.scenarioId}`:'pg-title';
  panel.setAttribute('role','dialog'); panel.setAttribute('aria-labelledby',titleId);
  panel.innerHTML = '<header class="pg-header"></header><div class="pg-body"></div>';
  document.body.append(panel);
  const header = panel.querySelector('.pg-header'), body = panel.querySelector('.pg-body');
  const auxiliary = document.createElement('section'); auxiliary.className='pg-aux pg-shell'; auxiliary.hidden=true;
  auxiliary.setAttribute('role','dialog'); auxiliary.setAttribute('aria-label','Выбор свойства'); document.body.append(auxiliary);
  panel.dataset.widgetContext=standalone()?'standalone':'faq';auxiliary.dataset.widgetContext=panel.dataset.widgetContext;
  let choice=null;
  function closeChoice(cancel=true) {
    if (!choice) return;
    const current=choice; choice=null;
    current.abort?.abort();
    if (cancel) current.cancel?.();
    auxiliary.hidden=true; auxiliary.replaceChildren(); delete auxiliary.dataset.kind;
    auxiliary.oninput=null;
    const target=current.anchor?.isConnected ? current.anchor : panel.querySelector(`[data-pg-command="${current.opener}"]`);
    target?.focus({preventScroll:true});
  }
  function openChoice(options) {
    closeChoice();
    const anchor=options.anchor || document.activeElement;
    choice={...options,anchor,opener:anchor?.dataset.pgCommand};
    auxiliary.dataset.kind=options.kind; auxiliary.setAttribute('aria-label',options.title);
    auxiliary.style.width=options.width+'px'; auxiliary.innerHTML=options.html; auxiliary.hidden=false;
    auxiliary.oninput=event=>choice?.input?.(event);
    positionChoice(); auxiliary.querySelector('input,button:not(:disabled)')?.focus({preventScroll:true});
  }
  function positionChoice() {
    if (!choice) return;
    const frame=api.editor.getBoundingClientRect(),scale=frame.width/1600;
    const viewport=document.documentElement, margin=8*scale;
    const leftBound=Math.max(0,frame.left)+margin,rightBound=Math.min(viewport.clientWidth,frame.right)-margin,topBound=Math.max(0,frame.top)+margin,bottomBound=Math.min(viewport.clientHeight,frame.bottom)-margin;
    auxiliary.style.transform=`scale(${scale})`;
    if(choice.kind==='context-menu'){
      const anchor=choice.anchor.getBoundingClientRect(),toolbar=choice.anchor.closest('.toolbar').getBoundingClientRect();
      auxiliary.style.maxHeight='none';
      const height=auxiliary.getBoundingClientRect().height;
      const top=Math.max(topBound,Math.min(toolbar.bottom+4*scale,bottomBound-height));
      auxiliary.style.left=Math.max(leftBound,Math.min(anchor.left+anchor.width/2-32*scale,rightBound-choice.width*scale-14*scale))+'px';
      auxiliary.style.top=top+'px';return;
    }
    auxiliary.style.maxHeight=Math.max(44,(bottomBound-topBound)/scale)+'px';
    const anchor=choice.anchor?.isConnected?choice.anchor.getBoundingClientRect():panel.getBoundingClientRect();
    const width=choice.width*scale, height=auxiliary.getBoundingClientRect().height;
    const left=choice.centered?frame.left+(frame.width-width)/2:anchor.left+(choice.offsetX??0)*scale;
    const top=choice.centered?frame.top+(frame.height-height)/2:anchor.top+(choice.offsetY??24)*scale;
    auxiliary.style.left=Math.max(leftBound,Math.min(left,rightBound-width))+'px';
    auxiliary.style.top=Math.max(topBound,Math.min(top,bottomBound-height))+'px';
  }
  const icon = (code,large=false) => `<i aria-hidden="true"${large?' class="icon24"':''}>&#x${code};</i>`;
  const image = (file,cls='') => `<img class="${cls}" src="assets/pg-${file}.svg" alt="" draggable="false">`;
  const unavailable = (html,cls='',label='') => `<button type="button" disabled title="${later}" class="pg-control ${cls}"${label?` aria-label="${label}"`:''}>${html}</button>`;
  const action = (cmd,html,cls='',label='') => `<button type="button" data-pg-command="${cmd}" class="${cls}"${label?` aria-label="${label}" title="${label}"`:''}>${html}</button>`;
  const arrow = (section,label) => action('go-'+section,image('a90ea','pg-arrow-image'),'pg-arrow',label);
  const row = (label,content,cls='') => `<div class="pg-row ${cls}"><span class="pg-label">${label}</span>${content}</div>`;
  const card = (html,cls='') => `<div class="pg-card ${cls}">${html}</div>`;
  const field = (text,cls='') => unavailable(text,'pg-field '+cls);
  const checkbox = label => unavailable('<span class="pg-checkbox"></span>'+label,'pg-checkbox-control');
  const liveCheckbox = (label,command,checked) => `<button type="button" role="checkbox" aria-checked="${checked}" data-pg-command="${command}" class="pg-checkbox-control"><span class="pg-checkbox">${checked?image('af428'):''}</span>${label}</button>`;
  const color = (black=false) => unavailable(black?'<span class="pg-color-black"></span>':image('88ebd'),'pg-color','Цвет');
  const colorCss = value => {
    if (!value.color) return '';
    const hex=value.color.replace('#','');
    if (!/^[a-f\d]{6}$/i.test(hex)) return value.color;
    return `rgb(${parseInt(hex.slice(0,2),16)} ${parseInt(hex.slice(2,4),16)} ${parseInt(hex.slice(4),16)} / ${value.opacity/100})`;
  };
  const colorValue=(settings,key)=>key==='spoiler-background'?settings.spoilerStyle.background:key==='faq-border'?settings.faqStyle.border:key==='spoiler-border'?settings.spoilerStyle.border:settings[key];
  const colorControl = (key,bubble=false,supplied=null) => {
    const value=supplied||colorValue(transaction.draft,key);
    const html=value.color?`<span class="pg-swatch" style="background:${colorCss(value)}"></span>${bubble?`<span>${value.color}</span>`:''}`:image('88ebd');
    return action('color-'+key,html,'pg-color-choice '+(bubble&&value.color?'pg-color-bubble':''),{question:'Цвет вопроса',background:'Фон FAQ',dividers:'Цвет разделителей','spoiler-background':'Фон спойлеров','faq-border':'Цвет границы FAQ','spoiler-border':'Цвет границ спойлеров'}[key]||colorEditors[key]?.title||'Цвет');
  };
  const textStyles = [
    {id:'h1',name:'Заголовок 1',size:28,weight:600,line:'normal',spacing:'-.3948px'},
    {id:'h2',name:'Заголовок 2',size:24,weight:600,line:'normal',spacing:'-.3384px'},
    {id:'h3',name:'Заголовок 3',size:20,weight:600,line:'1.3',spacing:'-.282px'},
    {id:'h4',name:'Заголовок 4',size:18,weight:600,line:'1.3',spacing:'-.2538px'},
    {id:'large',name:'Крупный текст',size:18,weight:400,line:'normal',spacing:'0px'},
    {id:'additional',name:'Дополнительный текст',size:16,weight:400,line:'normal',spacing:'0px'},
    {id:'main',name:'Основной текст',size:16,weight:400,line:'24px',spacing:'0px'},
    {id:'accent',name:'Акцентный текст',size:16,weight:400,line:'normal',spacing:'0px'}
  ];
  const textStyleCss = s => `font-size:${s.size}px;font-weight:${s.weight};line-height:${s.line};letter-spacing:${s.spacing}`;
  const appearances = [
    {id:'standard',name:'Стандартный',weight:400,icon:'triangle',side:'left',edges:false},
    {id:'link',name:'Текст-ссылка',weight:600,icon:'none',side:'left',edges:false},
    {id:'accent-line',name:'С акцентной линией',weight:600,icon:'chevron',side:'right',edges:false},
    {id:'outline',name:'В рамке',weight:400,icon:'chevron',side:'right',edges:true},
    {id:'filled',name:'На фоне',weight:600,icon:'triangle',side:'right',edges:true},
    {id:'text-button',name:'Кнопка у текста',weight:400,icon:'angle',side:'right',edges:false}
  ];
  function accentFor(id){return {scope:id==='accent-line'?'spoiler':['link','text-button'].includes(id)?'answer':'none',width:id==='text-button'?1:['link','accent-line'].includes(id)?2:0,opacity:id==='link'?10:100};}
  // Presets write the same values consumed by existing PG controls and paint.
  // Controlled properties are explicitly projected below for dirty tracking.
  function presetValues(id,asStandalone=standalone()) {
    const preset=appearances.find(p=>p.id===id)||appearances[0];
    const rgba=(color,opacity=100)=>({color,opacity});
    const glyphs=preset.icon==='angle'?['E9C1','E9BF']:preset.icon==='chevron'?['E9AA','E9AA']:['E96E','E96D'];
    const restIcon={code:glyphs[0],font:'cbuc-icons'},activeIcon={code:glyphs[1],font:'cbuc-icons',rotation:preset.icon==='chevron'?180:0};
    const button={side:preset.side,edges:preset.edges,visible:preset.icon!=='none',icon:preset.icon,editor:{iconSize:16,width:24,height:24,states:{
      rest:{icon:restIcon,iconColor:rgba(['filled','text-button','link'].includes(id)?'#CCCCCC':'#333333'),background:rgba(null),rounding:{enabled:true,value:['standard','accent-line','outline','filled'].includes(id)?100:6}},
      hover:{iconColor:rgba(id==='link'?'#CCCCCC':['filled','text-button'].includes(id)?'#575757':'#333333'),background:rgba(id==='standard'?'#F3F4F8':id==='accent-line'?'#333333':id==='outline'?'#333333':null,id==='accent-line'?5:id==='outline'?10:100),rounding:{enabled:true,value:id==='standard'?6:['accent-line','outline','filled'].includes(id)?100:6}},
      active:{icon:activeIcon,iconColor:rgba(id==='filled'?'#575757':id==='text-button'||id==='link'?'#CCCCCC':'#333333')},
      activeHover:{iconColor:rgba(id==='filled'?'#CCCCCC':id==='link'?'#CCCCCC':id==='text-button'?'#575757':'#333333'),sourceActiveColor:id==='filled'?'#575757':id==='text-button'||id==='link'?'#CCCCCC':'#333333',background:rgba(id==='standard'?'#F3F4F8':id==='accent-line'||id==='outline'?'#333333':null,id==='accent-line'?5:id==='outline'?10:100),rounding:{enabled:true,value:id==='standard'?6:['accent-line','outline','filled'].includes(id)?100:6},sourceActiveBackground:rgba(null),sourceActiveRounding:{enabled:true,value:['standard','accent-line','outline','filled'].includes(id)?100:6}}
    }}};
    button.visibilityPolicy=id==='link'?'editor-hover':'always';
    const values={...profileStyles(id),dividers:{...defaults().dividers,enabled:id==='outline'},size:{gap:id==='outline'?0:id==='filled'?8:10},accent:accentFor(id),question:{color:id==='link'?'#0085F2':'#000000',hoverColor:id==='link'?'#106CB7':null,hoverBaseColor:id==='link'?'#0085F2':null,opacity:100,style:'main',font:{...appearanceFont(id),styleId:'main'},bold:null,italic:false,underline:id==='link',underlineStyle:id==='link'?'dashed':'solid',strike:false},button};
    if(asStandalone){if(id==='outline'){values.spoilerStyle.border=clone(values.faqStyle.border);values.spoilerStyle.rounding=clone(values.faqStyle.rounding);}values.faqStyle=faqStyleDefaults();values.dividers.enabled=false;if(id==='accent-line')values.accent={scope:'none',width:0,opacity:100};}
    return values;
  }
  const managedAppearanceValues=d=>({faqStyle:d.faqStyle,spoilerStyle:d.spoilerStyle,dividers:d.dividers,gap:d.size.gap,accent:d.accent,question:{color:d.question.color,hoverColor:d.question.hoverColor,hoverBaseColor:d.question.hoverBaseColor,opacity:d.question.opacity,style:d.question.style,font:d.question.font,bold:d.question.bold,italic:d.question.italic,underline:d.question.underline,underlineStyle:d.question.underlineStyle,strike:d.question.strike},button:d.button});
  function applyAppearance(id) {
    transaction.replaced=[...(transaction.replaced||[]),'question','button','spoilerStyle'];
    const d=transaction.draft,preset=presetValues(id);
    d.appearance=id;d.faqStyle=clone(preset.faqStyle);d.spoilerStyle=clone(preset.spoilerStyle);d.dividers=clone(preset.dividers);d.size.gap=preset.size.gap;d.size.gapCustom=true;d.accent=clone(preset.accent);d.question={...d.question,...clone(preset.question)};d.button=clone(preset.button);d.presetManaged=true;d.appearanceModified=false;
  }
  function appearanceFont(id,open=false) {
    const preset=appearances.find(p=>p.id===id)||appearances[0];
    return {size:16,weight:preset.id==='outline'&&open?600:preset.weight,openWeight:preset.id==='outline'?600:preset.weight,line:'normal',spacing:'-.2256px'};
  }
  const glyphFor = (kind,open) => kind==='chevron'?'\uE9AA':kind==='angle'?(open?'\uEB8A':'\uEB89'):(open?'\uE96D':'\uE96E');
  const sampleQuestions=['Кем можно работать в Тензоре?','С какими продуктами я буду работать?','Есть ли рост и обучение?'];
  function sampleList(appearance='standard',mode='inline',opened=true) {
    const preset=appearances.find(p=>p.id===appearance)||appearances[0];
    const sampleSettings={...defaults(),...presetValues(appearance),appearance};
    const count=standalone()?1:appearance==='outline'||appearance==='filled'?2:3;
    const questions=standalone()?['Лично — при встрече кандидата']:sampleQuestions;
    return `<div class="pg-faq-sample faq-appearance" data-appearance="${appearance}" data-sample-mode="${mode}">${questions.slice(0,count).map((q,i)=>{
      const open=i===0&&opened,view=buttonState(sampleSettings,open?'active':'rest');
      const showAnswer=open;
      const glyph=glyphFor(preset.icon,open);
      return `<div class="faq-sample-spoiler ${open?'is-open':''}"><div class="spoiler-content"><div class="question-row" data-button-side="${preset.side}" data-button-edges="${preset.edges}" data-button-visible="${preset.icon!=='none'}"><i class="spoiler-arrow" aria-hidden="true" style="color:${colorCss(view.iconColor)};border-radius:${view.rounding.value}px;background:${colorCss(view.background)||'transparent'}"><span class="arrow-glyph" style="transform:rotate(${view.icon.rotation||0}deg)">${glyph}</span></i><span class="question-text" style="${textStyleCss(appearanceFont(appearance,open))};color:${appearance==='link'?'#0085f2':'#000'}">${q}</span></div>${standalone()&&appearance==='outline'?'<img class="pg-sample-separator" src="assets/pg-choice-answer-divider.svg" alt="">':''}${showAnswer?'<div class="answer-editor"><div class="pg-sample-answer">'+(standalone()?'Личный обмен документами удобен только в случае, если кандидат и компания находятся в одном городе. Часто его используют для периодической удаленки, когда сотрудник в любом случае будет посещать офис.':appearance==='outline'?'Личный обмен документами удобен только в случае, если кандидат и компания находятся…':'В Тензоре востребованы разработчики, тестировщики, аналитики, продукт‑ и проект‑менеджеры, специалисты по поддержке и внедрению Saby (СБИС), а также эксперты по электронному документообороту и работе с бизнес‑клиентами')+'</div></div>':''}</div></div>`;
    }).join('')}</div>`;
  }
  const appearanceName=p=>standalone()&&p?.id==='accent-line'?'Акцентный заголовок':p?.name||'Стандартный';
  const choiceCheck='<span class="pg-choice-check" aria-hidden="true"><i class="icon24">&#xE616;</i></span>';
  function chooseAppearance(anchor) {
    openChoice({kind:'appearance',title:'Оформление спойлеров',width:916,anchor,centered:true,
      html:`<button type="button" data-aux-cancel class="pg-floating-close" aria-label="Закрыть выбор оформления">${image('ffce9')}</button><div class="pg-appearance-cards">${appearances.map(p=>`<div role="button" tabindex="0" aria-label="${appearanceName(p)}" aria-pressed="${transaction.draft.appearance===p.id}" title="${appearanceName(p)}" class="pg-choice-card" data-appearance-choice="${p.id}">${sampleList(p.id)}${choiceCheck}</div>`).join('')}</div>`,
      click:event=>{const id=event.target.closest('[data-appearance-choice]')?.dataset.appearanceChoice;if(id){applyAppearance(id);finishSelection();}}
    });
  }
  const revealModes=[{id:'inline',name:'Снизу со сдвигом контента',description:'Ответ встраивается в карточку вопроса, следующие вопросы уезжают вниз'},
    {id:'overlay',name:'Оверлей поверх контента',description:'Вопрос и ответ вместе открываются над контентом в одном окне с общим фоном'}];
  let revealPreviewRun=0;
  function chooseReveal(anchor) {
    const previewRun=Date.now()+'-'+(++revealPreviewRun);
    openChoice({kind:'reveal',title:'Режим открытия',width:724,anchor,centered:true,
      html:`<button type="button" data-aux-cancel class="pg-floating-close" aria-label="Закрыть выбор режима">${image('ffce9')}</button><div class="pg-reveal-title">РЕЖИМ ОТКРЫТИЯ</div><div class="pg-reveal-cards">${revealModes.map(p=>`<div role="button" tabindex="0" aria-label="${p.name}" aria-pressed="${transaction.draft.reveal===p.id}" data-reveal-choice="${p.id}" class="pg-choice-card"><div class="pg-reveal-caption"><div class="pg-reveal-text"><span>${p.name}</span><p>${p.description}</p></div><span class="pg-reveal-marker" aria-hidden="true">${image("reveal-marker-rest","pg-marker-neutral")}</span></div><picture class="pg-reveal-sample"><source media="(prefers-reduced-motion: reduce)" srcset="assets/${standalone()?'document-reveal':'reveal'}-${p.id}-open.png"><img src="assets/${standalone()?'document-reveal':'reveal'}-${p.id}.gif?run=${previewRun}" width="340" height="${standalone()?125:132}" alt="${p.id==='inline'?'Ответ появляется под заголовком':'Заголовок и ответ открываются поверх содержимого'}" draggable="false"></picture>${choiceCheck}</div>`).join('')}</div>`,
      click:event=>{
        const id=event.target.closest('[data-reveal-choice]')?.dataset.revealChoice;
        if(id){transaction.draft.reveal=id;finishSelection();}
      }
    });
  }
  // Each palette is read from its own Figma node, not inferred from another color picker.
  const colorEditors = {
    answer:{title:'Текст',allowNone:false,palette:['#000000','#999999','#313E78','#2562AA','#8991A9','#CC3D00','#C2140A','#E6A119','#298E3C','#5A49AB']},
    question:{title:'Текст',allowNone:false,palette:['#000000','#999999','#313E78','#2562AA','#8991A9','#CC3D00','#C2140A','#E6A119','#298E3C','#5A49AB']},
    background:{title:'Фон',allowNone:false,emptyColor:'#FFFFFF',tabs:['Цвет','Картинка'],palette:['#943253','#E0564C','#E59545','#E5CB45','#009918','#29B5CF','#326194','#4C3294','#943288','#999999','#FFE3EC','#FFE5E3','#FFF1E3','#FFFBE3','#E3FFE8','#E3FAFF','#E3F1FF','#EAE3FF','#FFE3FA','#EDEDED']},
    dividers:{title:'Цвет',allowNone:false,palette:['#F6733C','#000000','#12A12C','#ECB956','#DC2219','#6757B7','#000000','#8D8D8D','#2562AA','#7F7F7F','#FFF8F5','#F2F2F2','#F5FFF7','#FFFCF5','#FFF5F5','#F7F5FF','#FFFFFF']}
  };
  function chooseColor(key,anchor) {
    let inheritedReset=false,touched=false;
    const buttonTarget=key==='button-icon'||key==='button-background';
    const property=key==='button-icon'?'iconColor':'background';
    const state=buttonTarget?transaction.draft.button.editor.states[tab]:null;
    const previous=buttonTarget?clone(state[property]):null;
    if(buttonTarget)state[property]=clone(buttonState(transaction.draft,tab)[property]);
    const config=buttonTarget?{...colorEditors.dividers,emptyColor:key==='button-background'?'#FFFFFF':undefined}:key==='spoiler-background'?colorEditors.background:key.endsWith('-border')?colorEditors.dividers:colorEditors[key], value=buttonTarget?state[property]:colorValue(transaction.draft,key);
    const initial={color:value.color,opacity:value.opacity};
    const resumeColorEdit=()=>{touched=true;if(inheritedReset&&buttonTarget)state[property]=value;inheritedReset=false;};
    const restore=()=>{Object.assign(value,initial);if(buttonTarget){if(previous===undefined)delete state[property];else state[property]=previous;}paint();render(true);};
    const buttons=`<button type="button" data-color-eyedropper ${typeof window.EyeDropper==='function'?'title="Выбрать цвет с экрана"':'disabled title="Пипетка недоступна в этом браузере"'}>${image(key==='dividers'||buttonTarget?'f49c6':'98d0a')}</button>`
      +`<button type="button" data-color-reset class="pg-reset" title="Сбросить цвет">${icon('E629',true)}</button><button type="button" data-aux-save class="pg-save" title="Подтвердить цвет">${icon('E75E')}</button><button type="button" data-aux-cancel class="pg-close" title="Отменить выбор цвета">${icon('E66C',true)}</button>`;
    openChoice({kind:'color-'+key,title:config.title,width:366,anchor,offsetX:-24,offsetY:-80,cancel:restore,
      html:`<header class="pg-color-header"><h2>${config.title}</h2>${config.tabs?`<div class="pg-color-tabs"><button type="button" aria-pressed="true">Цвет</button><button type="button" disabled title="Нужен макет редактора картинки">Картинка</button></div>`:''}<div class="pg-color-actions">${buttons}</div></header>`
        +`<div class="pg-color-values"><span class="pg-current-color"></span><span class="pg-hex-format" title="Другие форматы не подключены">HEX ${icon('E9AA')}</span><input aria-label="HEX" spellcheck="false" autocomplete="off" class="pg-hex-input"><label class="pg-opacity-field"><input aria-label="Непрозрачность" inputmode="decimal">%</label></div>`
        +`<div class="pg-color-palette"><div class="pg-color-swatches">${config.palette.map(hex=>`<button type="button" data-color-swatch="${hex}" aria-label="${hex}" style="background:${hex}"></button>`).join('')}</div><p class="pg-color-error" role="alert" hidden></p><div class="pg-color-footer"><button type="button" disabled title="Нужен макет раскрытого редактора «Другой цвет»">Другой цвет</button></div></div>`,
      confirm:()=>{if(!inheritedReset&&!validateColor())return false;if(touched)markCommon(buttonTarget?`button.editor.states.${tab}.${property}`:key==='spoiler-background'?'spoilerStyle.background':key==='spoiler-border'?'spoilerStyle.border':key==='faq-border'?'faqStyle.border':key+'.color',...(buttonTarget||key.includes('-')?[]:[key+'.opacity']));render(true);paint();return true;},
      click:event=>{
        if(event.target.closest('[data-color-swatch]')) {resumeColorEdit();value.color=event.target.closest('[data-color-swatch]').dataset.colorSwatch;sync();paint();}
        else if(event.target.closest('[data-color-none]')) {value.color=null;sync();paint();}
        else if(event.target.closest('[data-color-reset]')) {
          touched=true;
          if(individual()){
            if(buttonTarget){const inherited=commonSettings().button.editor.states[tab][property];if(inherited===undefined)delete state[property];else state[property]=value;Object.assign(value,clone(inherited||buttonState(transaction.draft,tab)[property]));}
            else Object.assign(value,clone(colorValue(commonSettings(),key)));
            inheritedReset=true;
          }else Object.assign(value,{color:(buttonTarget?(key==='button-icon'?'#333333':(tab==='hover'?'#F3F4F8':'#FFFFFF')):colorValue(defaults(),key).color)??config.emptyColor,opacity:buttonTarget?100:colorValue(defaults(),key).opacity});
          sync();paint();
        }
        else if(event.target.closest('[data-color-eyedropper]') && typeof window.EyeDropper==='function') {
          const current=choice, controller=new AbortController();current.abort=controller;
          new window.EyeDropper().open({signal:controller.signal}).then(result=>{if(choice===current){resumeColorEdit();value.color=result.sRGBHex.toUpperCase();sync();paint();}}).catch(error=>{if(error.name!=='AbortError'&&choice===current)showError('Не удалось выбрать цвет пипеткой');}).finally(()=>{if(current.abort===controller)current.abort=null;});
        }
      }
    });
    const hex=auxiliary.querySelector('.pg-hex-input'), opacity=auxiliary.querySelector('[aria-label="Непрозрачность"]');
    function showError(message) {
      const error=auxiliary.querySelector('.pg-color-error');error.hidden=!message;error.textContent=message;positionChoice();
    }
    function validateColor() {
      const text=hex.value.trim(), alpha=opacity.value.trim();
      const validHex=(config.allowNone && text==='') || /^#?(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(text);
      const number=Number(alpha.replace(',','.')), validOpacity=/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(alpha) && Number.isFinite(number) && number>=0 && number<=100;
      hex.setAttribute('aria-invalid',String(!validHex));opacity.setAttribute('aria-invalid',String(!validOpacity));
      if(!validHex||!validOpacity){showError(!validHex?'Введите HEX из 3 или 6 шестнадцатеричных символов':'Непрозрачность должна быть от 0 до 100%');return false;}
      let digits=text.replace('#','').toUpperCase();if(digits.length===3)digits=digits.split('').map(c=>c+c).join('');
      value.color=digits?'#'+digits:null;value.opacity=number;showError('');paint();updateSample();return true;
    }
    function updateSample(){auxiliary.querySelector('.pg-current-color').style.background=value.color?colorCss(value):'';
      for(const swatch of auxiliary.querySelectorAll('[data-color-swatch]'))swatch.setAttribute('aria-pressed',String(swatch.dataset.colorSwatch===value.color));}
    function sync(){hex.value=value.color||config.emptyColor||'';opacity.value=value.opacity;hex.removeAttribute('aria-invalid');opacity.removeAttribute('aria-invalid');showError('');updateSample();}
    if(value.color===null&&config.emptyColor)Object.assign(value,{color:config.emptyColor,opacity:100});
    auxiliary.oninput=()=>{resumeColorEdit();validateColor();};sync();paint();
  }
  function chooseTextStyle(anchor,key='question') {
    const current=transaction.draft[key].style||'main';
    openChoice({kind:'text-style',title:'Текстовый стиль '+(key==='question'?'вопроса':'ответа'),width:300,anchor,offsetX:-32,offsetY:-28,
      html:`<button type="button" data-aux-cancel class="pg-floating-close" aria-label="Закрыть список">${image('ffce9')}</button><div class="pg-text-options" role="menu">${textStyles.map(s=>`<button type="button" role="menuitemradio" aria-checked="${s.id===current}" data-text-style="${s.id}" style="${textStyleCss(s)}">${s.name}</button>`).join('')}<button type="button" disabled title="Нужен макет редактора «Свой стиль»">Свой стиль</button></div>`,
      click:event=>{const id=event.target.closest('[data-text-style]')?.dataset.textStyle;if(id){markCommon(key+'.style',key+'.font',key+'.bold');transaction.draft[key].style=id;transaction.draft[key].font={...clone(textStyles.find(style=>style.id===id)),styleId:id};transaction.draft[key].bold=null;render(true);paint();closeChoice(false);}}
    });
  }
  function chooseLine(anchor,key='dividers') {
    const target=colorValue(transaction.draft,key);
    openChoice({kind:'line',title:'Тип линии',width:64,anchor,offsetX:-20,offsetY:-12,
      html:`<div class="pg-line-menu" role="menu">${[['solid','Сплошная'],['dashed','Пунктирная']].map(([value,label])=>`<button type="button" role="menuitemradio" aria-label="${label}" aria-checked="${target.line===value}" data-line="${value}"><span style="border-top-style:${value}"></span></button>`).join('')}</div>`,
      click:event=>{const value=event.target.closest('[data-line]')?.dataset.line;if(value){target.line=value;render(true);paint();closeChoice(false);}}
    });
  }
  const chips = names => `<div class="pg-chips">${names.map(name=> ['main','spoilers'].includes(level)&&['Границы','Скругления'].includes(name)?action('add-style-'+(name==='Границы'?'border':'rounding'),name,'pg-chip'):name==='Скругления'&&level==='button'?action('add-button-rounding',name,'pg-chip'):name==='Разделители' && level==='main'
      ? (transaction.draft.appearance==='outline'?unavailable(name,'pg-chip','Разделители входят в оформление «В рамке»'):action('add-dividers',name,'pg-chip')) : unavailable(name,'pg-chip')).join('')}</div>`;
  const remove = (name,enabled=false) => enabled
    ? action('remove-'+name,icon('E66C'),'pg-remove',name==='background'?'Убрать свойство «Фон»':'Убрать группу «Разделители»')
    : unavailable(icon('E66C'),'pg-remove','Удалить свойство');
  function styleCard(scope) {
    const key=scope==='faq'?'faqStyle':'spoilerStyle',d=transaction.draft[key],backgroundKey=scope==='faq'?'background':'spoiler-background';
    const backgroundValue=colorValue(transaction.draft,backgroundKey);
    let rows=row('Фон',colorControl(backgroundKey,true)+(backgroundValue.color!==null?action(scope==='faq'?'clear-background':'clear-style-background',icon('E66C'),'pg-remove','Очистить фон'):''),'pg-background');
    const editor=html=>`<div class="pg-style-editor">${html}</div>`;
    if(d.border.enabled)rows+=row('Границы',editor(colorControl(scope+'-border')+action('style-line','<span class="pg-line-example" style="border-top-style:'+d.border.line+'"></span>','pg-line-type','Тип линии')
      +numberField('Толщина границы '+(scope==='faq'?'FAQ':'спойлеров'),d.border.thickness,`data-style-scope="${key}" data-style-number="border"`)
      
      +unavailable(icon('EBCE',true),'pg-style-detail','Нужен макет выбора сторон границы')+action('remove-style-border',icon('E66C'),'pg-remove','Убрать границы')));
    if(d.rounding.enabled)rows+=row('Скругления',editor(numberField('Радиус '+(scope==='faq'?'FAQ':'спойлеров'),d.rounding.value,`data-style-scope="${key}" data-style-number="rounding"`,image('b974b','pg-rounding-icon'))
      +unavailable(icon('E95F',true),'pg-style-detail','Нужен макет отдельных углов')+action('remove-style-rounding',icon('E66C'),'pg-remove','Убрать скругления')));
    return card(rows,'pg-style-card');
  }
  const dimensionField = (value,mode,cls='') => `<div class="pg-dimension-field ${cls}">${field(value,'pg-number')}${field(mode,'pg-mode')}</div>`;
  function dimensions(extended=false,config={}) {
    return card(row('Ширина',dimensionField(config.width??(extended?'820':'535'),'заполнить'), 'pg-dimension')
      +row('Высота',dimensionField(config.height??(extended?'88':'112'),'по контенту'),'pg-dimension')
      +(!extended&&config.drillDown!==false?arrow('size','Расширенные настройки размера'):''));
  }
  function buttonRow(d){return supportsButton(d)?row('Кнопка',`<div class="pg-position" role="group" aria-label="Положение кнопки">${['left','right'].map(side=>`<button type="button" data-pg-command="side-${side}" aria-label="Кнопка ${side==='left'?'слева':'справа'}" aria-pressed="${d.button.side===side}" class="${d.button.side===side?'pg-position-selected':''}">${image(side==='left'?'77b4a':'b52b5')}</button>`).join('')}</div>`+liveCheckbox('В края','button-edges',d.button.edges)+arrow('button','Расширенные настройки кнопки')):'';}
  function spoilerMain(){
    const d=transaction.draft,element=api.faqElement.querySelector('[data-spoiler-id="'+CSS.escape(transaction.id)+'"]'),scale=api.editor.getBoundingClientRect().width/1600;
    const available=[];if(!d.spoilerStyle.border.enabled)available.push('Границы');if(!d.spoilerStyle.rounding.enabled)available.push('Скругления');available.push('Тень');
    return card(row('Шрифт',action('text-style',textStyles.find(s=>s.id===d.question.style)?.name||'Основной текст','pg-link')+colorControl('question')+arrow('typography','Стили текста'))+buttonRow(d))
      +dimensions(false,{drillDown:false,width:String(Math.round(element.getBoundingClientRect().width/scale)),height:String(element.offsetHeight)})
      +card(row('Отступы',spoilerInset('horizontal')+spoilerInset('vertical')+detailInsets()))+styleCard('spoiler')+chips(available);
  }
  function main() {
    const d = transaction.draft;
    let html = card(`<div class="pg-row pg-label-anchor"><strong>Спойлеры</strong>${action('appearance',appearances.find(p=>p.id===d.appearance)?.name||'Стандартный','pg-link')}${arrow('spoilers','Расширенные настройки спойлеров')}</div>`
      +row('Шрифт',action('text-style',textStyles.find(s=>s.id===d.question.style)?.name||'Основной текст','pg-link')+colorControl('question'))
      +row('Открытие',action('reveal',d.reveal==='overlay'?'Оверлей поверх контента':'Снизу со сдвигом','pg-link'))
      +buttonRow(d));
    if (d.dividers.enabled&&d.appearance!=='outline') html += card(row('Разделители',colorControl('dividers')+action('line','<span class="pg-line-example" style="border-top-style:'+d.dividers.line+'"></span>','pg-line-type','Тип линии')+`<input class="pg-thickness" aria-label="Толщина разделителя" inputmode="decimal" value="${d.dividers.thickness}">`+remove('dividers',true))
      +liveCheckbox('У крайних спойлеров','divider-outer',d.dividers.outer));
    html += dimensions();
    html += styleCard('faq');
    const available = [];
    if (!d.dividers.enabled&&d.appearance!=='outline') available.push('Разделители');
    if(!d.faqStyle.border.enabled)available.push('Границы');if(!d.faqStyle.rounding.enabled)available.push('Скругления');available.push('Тень');
    return html+chips(available);
  }
  function standaloneMain(){
    const d=transaction.draft,element=api.faqElement.querySelector('[data-spoiler-id="'+CSS.escape(transaction.id)+'"]'),scale=api.editor.getBoundingClientRect().width/1600;
    const available=[];if(!d.spoilerStyle.border.enabled)available.push('Границы');if(!d.spoilerStyle.rounding.enabled)available.push('Скругления');available.push('Тень');
    return card(row('Стиль',action('appearance',appearanceName(appearances.find(p=>p.id===d.appearance)),'pg-link'))
      +row('Шрифт',action('text-style',textStyles.find(s=>s.id===d.question.style)?.name||'Основной текст','pg-link')+colorControl('question')+arrow('typography','Стили текста'))
      +row('Открытие',action('reveal',d.reveal==='overlay'?'Оверлей поверх контента':'Снизу со сдвигом','pg-link'))+buttonRow(d))
      +dimensions(false,{width:String(Math.round(element.getBoundingClientRect().width/scale)),height:String(element.offsetHeight)})+styleCard('spoiler')+chips(available);
  }
  const decorations=[['bold','Жирный','E6C3'],['italic','Курсив','E6C6'],['underline','Подчёркнутый','E6CE'],['strike','Зачёркнутый','E6CB']];
  function questionFont(settings,open=false) {
    const font=settings.question.font;
    return (settings.question.style==='preset'||font?.styleId===settings.question.style)?{...font,weight:open?(font.openWeight??font.weight):font.weight}:(textStyles.find(s=>s.id===settings.question.style)||textStyles.find(s=>s.id==='main'));
  }
  function formatting(settings,key) {
    const value=settings[key];
    return {bold:value.bold??((key==='question'?questionFont(settings):value.font)?.weight>=600),italic:value.italic,
      underline:value.underline??(key==='question'&&settings.question.underlineStyle==='dashed'),strike:value.strike};
  }
  function applyFormatting(element,settings,key) {
    const value=settings[key],flags=formatting(settings,key);
    if(value.bold!==null)element.style.fontWeight=flags.bold?'600':'400';
    element.style.fontStyle=flags.italic?'italic':'normal';
    element.style.textDecorationLine=[flags.underline?'underline':'',flags.strike?'line-through':''].filter(Boolean).join(' ')||'none';
    element.style.textDecorationStyle=key==='question'?settings.question.underlineStyle:'solid';if(key==='question')element.style.textDecorationColor=settings.question.color;
  }
  function textStyle(label) {
    const question=label==='Спойлер',d=transaction.draft,key=question?'question':'answer',flags=formatting(d,key);
    const style=textStyles.find(s=>s.id===(d[key].style||'main')),font=question?questionFont(d):(d.answer.font||appearanceFont('standard'));
    return card(`<div class="pg-row"><strong>${label}</strong>${action(question?'text-style':'answer-text-style',style?.name||'Основной текст','pg-link')}</div>`
      +`<div class="pg-font-row">${field('Inter'+icon('E9AA'),'pg-font-name')}${numberField('Размер текста '+(question?'вопроса':'ответа'),font.size,`data-text-size="${key}"`)}</div>`
      +`<div class="pg-decoration">${decorations.map(([name,title,glyph])=>`<button type="button" data-pg-format="${name}" data-format-target="${key}" class="pg-decor pg-toggle" aria-label="${title}" title="${title}" aria-pressed="${flags[name]}">${icon(glyph,true)}</button>`).join('')}<span class="pg-decoration-divider"></span>${colorControl(key)}${action('reset-text-color-'+key,icon('E66C'),'pg-remove','Сбросить цвет текста')}</div>`);
  }
  const inset = (file,text) => field((file==='hor'?'<span class="pg-padding-hor"><span></span></span>':image(file))+text,'pg-inset');
  const detailInsets = () => unavailable(icon('EBCE',true),'pg-inset-detail','Подробные отступы');
  function insetControl(file,label,value,attrs='',mixed=false,title=''){
    return `<label class="pg-field pg-inset pg-live-inset ${mixed?'pg-inset-pair':''}">${file==='hor'?'<span class="pg-padding-hor"><span></span></span>':file==='bef0a'?'<span class="pg-padding-vert"><span></span></span>':image(file)}<input aria-label="${label}" ${attrs} inputmode="decimal" value="${value}"  title="${title}"></label>`;
  }
  function spoilerInset(axis){const p=transaction.draft.spoilerStyle.padding,values=axis==='horizontal'?[p.left,p.right]:[p.top,p.bottom],equal=values[0]===values[1];return insetControl(axis==='horizontal'?'hor':'bef0a',(axis==='horizontal'?'Горизонтальные':'Вертикальные')+' отступы спойлеров',equal?values[0]:values.join(' / '),`data-style-scope="spoilerStyle" data-style-number="${axis}"`,!equal,(axis==='horizontal'?'Слева / справа':'Сверху / снизу')+': '+values.join(' / '));}
  function spoilers() {
    const d=transaction.draft.spoilerStyle,available=[];
    if(!d.border.enabled)available.push('Границы');if(!d.rounding.enabled)available.push('Скругления');available.push('Тень');
    return textStyle('Спойлер')+textStyle('Содержимое')+card(row('Высота',dimensionField('24','по контенту'))
      +row('Отступы',spoilerInset('horizontal')+spoilerInset('vertical')+detailInsets()))+styleCard('spoiler')+chips(available);
  }
  function buttonState(settings,state,hovered=false) {
    const baseColor='#333333';
    const rest={icon:null,iconColor:{color:baseColor,opacity:100},background:{color:null,opacity:100},rounding:{enabled:true,value:6},...settings.button.editor.states.rest};
    if(state==='rest')return rest;
    const result={...rest,...(state==='hover'&&!settings.button.editor.states.rest.background?{background:{color:'#F3F4F8',opacity:100}}:{}),...settings.button.editor.states[state]};
    if(state==='active'&&hovered){
      // The open button reuses hover styling while keeping its active icon.
      const activeIcon=result.icon;
      Object.assign(result,buttonState(settings,'hover'));
      result.icon=activeIcon;
    }
    return result;
  }
  const numberField=(label,value,attrs='',lead='',unit='')=>`<label class="pg-field pg-live-number">${lead}<input aria-label="${label}" inputmode="decimal" value="${value}" ${attrs}>${unit?'<span class="pg-icon-size-unit">'+unit+'</span>':''}</label>`;
  const chooseIcon=window.createIconPicker({openChoice,closeChoice});
  function button() {
    const d=transaction.draft,state=buttonState(d,tab),glyph=state.icon?String.fromCodePoint(parseInt(state.icon.code,16)):glyphFor(d.button.icon,tab==='active');
    const sample=`<i class="${state.icon?.font==='cbuc-icons24'?'icon24':''}" style="transform:rotate(${state.icon?.rotation||0}deg)">${glyph}</i>`;
    return `<div class="pg-tabs" role="tablist" aria-label="Состояние кнопки">${[['rest','В покое'],['hover','При наведении'],['active','Активный']].map(([id,label])=>`<button type="button" role="tab" aria-selected="${tab===id}" data-pg-tab="${id}">${label}</button>`).join('')}</div>`
      +card(row('Иконка',action('choose-button-icon',sample,'pg-button-icon','Выбрать иконку')+colorControl('button-icon',false,state.iconColor)+numberField('Размер иконки',d.button.editor.iconSize??16,'data-button-number="iconSize"','','px')))
      +card(row('Ширина',`<div class="pg-dimension-field pg-button-dimension"><input class="pg-number pg-current-value" aria-label="Ширина кнопки" inputmode="decimal" data-button-number="width" value="${d.button.editor.width??24}">${unavailable('px','pg-mode')}</div>`)
        +row('Высота',dimensionField(String(d.button.editor.height??24),'px','pg-button-dimension'))+unavailable(image('a5451','pg-lock-top')+icon('E647')+image('a5451','pg-lock-bottom'),'pg-size-link','Связь размеров'))
      +card(row('Фон',colorControl('button-background',true,state.background)+(state.background.color?action('clear-button-background',icon('E66C'),'pg-remove','Очистить фон кнопки'):''))
        +(state.rounding.enabled?row('Скругления',numberField('Скругление кнопки',state.rounding.value,'data-button-number="rounding"',image('b974b','pg-rounding-icon'))+detailInsets()+action('remove-button-rounding',icon('E66C'),'pg-remove','Убрать скругления')):''))
      +chips(state.rounding.enabled?['Границы','Тень']:['Границы','Скругления','Тень']);
  }
  const liveInset = (key,label,file) => insetControl(file,label,transaction.draft.size[key],`data-size-key="${key}"`);
  function size() {
    if(standalone())return dimensions(true,{width:'820',height:String(api.faqElement.querySelector('[data-spoiler-id="'+CSS.escape(transaction.id)+'"]').offsetHeight)})+card(row('Отступы',spoilerInset('horizontal')+spoilerInset('vertical')+detailInsets()));
    return dimensions(true)+card('<div class="pg-row"><strong>Отступы</strong></div>'
      +row('Внутри',liveInset('horizontal','Горизонтальные внутренние отступы','hor')+liveInset('vertical','Вертикальные внутренние отступы','bef0a')+detailInsets())
      +row('Между',liveInset('gap','Расстояние между спойлерами','bef0a')+detailInsets()));
  }
  function render(keepScroll=false) {
    if (!transaction) return;
    const previousScroll=body.scrollTop;
    const title = {main:individual()||standalone()?'Спойлер':'Вопрос–ответ',spoilers:'Спойлеры',typography:'Стили текста',button:'Кнопка',size:'Размер'}[level];
    const canReset = resetAvailable();
    header.innerHTML = (level!=='main'?action('back',image('81524'),'pg-back','Назад'): '')
      +`<h2 id="${titleId}">${title}</h2>${standalone()&&level==='button'?'<div class="pg-document-size-tools" aria-label="Размер — пока недоступен"><button type="button" disabled aria-label="Уменьшить"><img src="assets/document-button-smaller.svg" alt=""></button><button type="button" disabled aria-label="Увеличить"><img src="assets/document-button-larger.svg" alt=""></button></div>':''}<div class="pg-header-actions">`
      +(canReset?action('reset',icon('E629',true),'pg-reset','Сбросить настройки'):unavailable(icon('E629',true),'pg-reset','Сбросить настройки'))
      +action('save',icon('E75E'),'pg-save','Применить настройки')+action('cancel',icon('E66C',true),'pg-close','Отменить и закрыть')+'</div>';
    header.querySelector('.pg-reset').title = 'Сбросить настройки';
    panel.dataset.level = level;
    body.innerHTML = {main:standalone()?standaloneMain:individual()?spoilerMain:main,spoilers,button,size,typography:()=>textStyle('Спойлер')+textStyle('Содержимое')}[level]();
    alignLabels();
    body.scrollTop = keepScroll?previousScroll:0;
    position();
  }
  function alignLabels(){
    const scale=panel.getBoundingClientRect().width/panel.offsetWidth||1;
    for(const group of body.querySelectorAll('.pg-card')){
      const labels=[...group.querySelectorAll('.pg-row>.pg-label')].filter(e=>e.closest('.pg-card')===group&&e.getClientRects().length&&!e.closest('[hidden]'));
      if(!labels.length)continue;
      const anchor=group.querySelector('.pg-label-anchor>strong');
      const measured=[...labels,...(anchor?[anchor]:[])].map(label=>{const range=document.createRange();range.selectNodeContents(label);return range.getBoundingClientRect().width/scale;});
      const cap=group.clientWidth*.4,width=Math.min(cap,Math.max(...measured));
      if(anchor)anchor.style.width=width+'px';
      group.style.setProperty('--pg-label-width',width+'px');for(const label of labels)label.title=label.textContent;
    }
  }
  function paintStyle(element,style){const border=style.border;for(const side of ['top','right','bottom','left'])element.style['border'+side[0].toUpperCase()+side.slice(1)]=border.enabled&&border.sides.includes(side)?`${border.thickness}px ${border.line} ${colorCss(border)}`:'0px solid transparent';element.style.borderRadius=style.rounding.enabled?style.rounding.value+'px':'0px';for(const side of ['top','right','bottom','left'])element.style.setProperty('--guide-'+side,-parseFloat(element.style['border'+side[0].toUpperCase()+side.slice(1)+'Width'])+'px');}
  function alignGuides(){
    const column=api.faqElement.closest('.faq-column'),scale=api.editor.getBoundingClientRect().width/1600;
    if(!column||!scale)return;
    const bounds=column.getBoundingClientRect();
    // Absolute guides use each element's padding box. Compensate document borders
    // and container insets so all three guide levels share the column's edges.
    const guides=[api.faqElement,...api.faqElement.querySelectorAll('.questions>.spoiler')].map(element=>{
      const rect=element.getBoundingClientRect();
      return {element,left:(bounds.left-rect.left)/scale-(parseFloat(element.style.borderLeftWidth)||0),right:(rect.right-bounds.right)/scale-(parseFloat(element.style.borderRightWidth)||0)};
    });
    for(const {element,left,right} of guides){element.style.setProperty('--guide-left',left+'px');element.style.setProperty('--guide-right',right+'px');}
  }
  function paint() {
    const demo=api.getGroupingDemo?.();
    if(demo){
      for(const host of demo.host.querySelectorAll(':scope>.demo-spoiler-frame')){const item=demo.items.find(item=>item.id===host.dataset.widgetId);paintGroup(host,normalized(item.demoSettings),{independent:true});}
      if(!demo.group)return;
    }
    if(!owner()&&!standalone())return;
    if(transaction&&standalone()&&!itemById(transaction.id)){cancel();return;}
    if(individual()&&!itemById(transaction.id)){cancel();return;}
    if(individual()&&level==='button'&&!supportsButton(transaction.draft)){closeChoice();level='main';render();}
    if(individual()){
      const reset=header.querySelector('.pg-reset');if(reset){reset.disabled=!individualResettable();if(!reset.disabled)reset.dataset.pgCommand='reset';else delete reset.dataset.pgCommand;}
    }
    const settings=commonSettings(), bg = settings.background;
    if(transaction&&!individual()&&settings.presetManaged){const expected=presetValues(settings.appearance);transaction.draft.appearanceModified=JSON.stringify(managedAppearanceValues(settings))!==JSON.stringify(managedAppearanceValues(expected));}
    if(standalone())for(const host of api.faqElement.querySelectorAll('.standalone-frame'))paintGroup(host,effectiveSettings(itemById(host.dataset.widgetId)));
    else paintGroup(api.faqElement,settings);
    api.layout?.(settings,true);alignGuides();
  }
  function paintGroup(host,settings,options={}){
    const independent=standalone()||options.independent;
    host.style.backgroundColor = independent?'':settings.background.enabled?colorCss(settings.background):'';
    paintStyle(host,independent?faqStyleDefaults():settings.faqStyle);
    const list=host.querySelector('.questions'), dividers=independent?{...settings.dividers,enabled:false}:settings.dividers;
    list.style.padding=`${settings.size.vertical}px ${settings.size.horizontal}px`;
    const gap=settings.size.gap;
    list.style.setProperty('--faq-gap',gap+'px');list.style.gap=gap+'px';
    list.style.setProperty('--faq-question-hover-color',settings.question.hoverColor&&settings.question.color===settings.question.hoverBaseColor?settings.question.hoverColor:settings.question.color);
    list.style.setProperty('--faq-accent-width',settings.accent.width+'px');
    list.style.setProperty('--faq-accent-color',colorCss(settings.question));
    list.style.setProperty('--faq-answer-accent-color',colorCss({...settings.question,opacity:settings.question.opacity*settings.accent.opacity/100}));
    list.classList.add('faq-appearance');list.dataset.appearance=settings.appearance;
    list.dataset.dividers=String(dividers.enabled);list.dataset.outer=String(dividers.outer);
    list.style.setProperty('--faq-divider-color',colorCss(dividers));list.style.setProperty('--faq-divider-width',dividers.thickness+'px');list.style.setProperty('--faq-divider-style',dividers.line);
    // Lines are presentation-only flex items: the same gap occurs on both sides.
    const items=[...list.querySelectorAll(':scope>.spoiler')];
    for(const item of items){const resolved=effectiveSettings(itemById(item.dataset.spoilerId),settings),style=resolved.spoilerStyle,p=style.padding;paintStyle(item,style);item.style.backgroundColor=colorCss(style.background)||'transparent';item.style.padding=`${p.top}px ${p.right}px ${p.bottom}px ${p.left+(settings.accent.scope==='spoiler'?12:0)}px`;}
    const lines=[...list.querySelectorAll(':scope>.faq-divider')];
    let lineIndex=0;
    const placeLine=before=>{
      const line=lines[lineIndex++]||document.createElement('hr');
      line.className='faq-divider';line.setAttribute('aria-hidden','true');
      if(line.parentElement!==list||line.nextElementSibling!==before)list.insertBefore(line,before);
    };
    if(dividers.enabled&&items.length){
      for(let index=0;index<items.length;index++)if(index>0||dividers.outer)placeLine(items[index]);
      if(dividers.outer)placeLine(null);
    }
    for(const line of lines.slice(lineIndex))line.remove();
    for (const row of host.querySelectorAll('.question-row')) {
      const settings=effectiveSettings(itemById(row.closest('.spoiler').dataset.spoilerId));
      const element=row.closest('.spoiler');
      element.style.setProperty('--faq-question-hover-color',settings.question.hoverColor&&settings.question.color===settings.question.hoverBaseColor?settings.question.hoverColor:settings.question.color);
      element.style.setProperty('--faq-accent-color',colorCss(settings.question));
      element.style.setProperty('--faq-answer-accent-color',colorCss({...settings.question,opacity:settings.question.opacity*settings.accent.opacity/100}));
      const open=row.closest('.spoiler').classList.contains('is-open');
      const font=questionFont(settings,open);
      row.dataset.buttonSide=settings.button.side; row.dataset.buttonEdges=String(settings.button.edges);
      row.dataset.buttonVisible=String(settings.button.visible);row.dataset.buttonPolicy=settings.button.visibilityPolicy||'always';
      const glyph=row.querySelector('.arrow-glyph');glyph.textContent=glyphFor(settings.button.icon,open);glyph.style.transform=settings.button.icon==='chevron'&&open?'rotate(180deg)':'';
      const button=row.querySelector('.spoiler-arrow'),viewState=open?'active':button.matches(':hover')?'hover':'rest',appearance=buttonState(settings,viewState,button.matches(':hover'));
      Object.assign(button.style,{color:colorCss(appearance.iconColor),backgroundColor:colorCss(appearance.background)||'transparent',borderRadius:appearance.rounding.enabled?appearance.rounding.value+'px':'0px',width:(settings.button.editor.width??24)+'px',height:(settings.button.editor.height??24)+'px',fontSize:(settings.button.editor.iconSize??16)+'px'});
      const border=appearance.border;
      button.style.border=border?.enabled?`${border.thickness}px ${border.line} ${colorCss(border)}`:'0px solid transparent';
      const iconSize=settings.button.editor.iconSize??16;
      Object.assign(glyph.style,{width:iconSize+'px',height:iconSize+'px',lineHeight:iconSize+'px',fontSize:iconSize+'px',fontFamily:appearance.icon?.font||'cbuc-icons'});
      if(appearance.icon){glyph.textContent=String.fromCodePoint(parseInt(appearance.icon.code,16));glyph.style.transform=appearance.icon.rotation?`rotate(${appearance.icon.rotation}deg)`:'none';}
      const text=row.querySelector('.question-text');text.style.cssText=textStyleCss(font);text.style.color=colorCss(settings.question);applyFormatting(text,settings,'question');
      const answer=row.parentElement.querySelector('.faq-answer');
      answer.style.cssText=textStyleCss(settings.answer.font||appearanceFont('standard'));
      answer.style.color=colorCss(settings.answer)||'#000000';applyFormatting(answer,settings,'answer');
    }
  }
  function position() {
    if (!transaction) return;
    if(panel.hidden){positionChoice();return;}
    const target=individual()||standalone()?api.faqElement.querySelector('[data-spoiler-id="'+CSS.escape(transaction.id)+'"]'):api.faqElement;if(!target){cancel();return;}
    const frame = api.editor.getBoundingClientRect(), rect = target.getBoundingClientRect();
    const area = api.canvas.getBoundingClientRect();
    const scale = frame.width/1600, margin=8*scale;
    const viewport = document.documentElement;
    const leftBound=Math.max(frame.left,0)+margin, rightBound=Math.min(frame.right,viewport.clientWidth)-margin;
    const topBound=Math.max(area.top,0)+margin, bottomBound=Math.min(frame.bottom,viewport.clientHeight)-margin;
    panel.style.transform=`scale(${scale})`;
    panel.style.maxHeight=Math.max(44,(bottomBound-topBound)/scale)+'px';
    const height=Math.min(panel.scrollHeight,parseFloat(panel.style.maxHeight))*scale;
    panel.style.left=Math.max(leftBound,Math.min(rect.left-358*scale,rightBound-350*scale))+'px';
    panel.style.top=Math.max(topBound,Math.min(rect.top,bottomBound-height))+'px';
    if(entry?.kind==='typography'){
      const anchor=entry.anchor.getBoundingClientRect(),back=panel.querySelector('.pg-back img').getBoundingClientRect(),current=panel.getBoundingClientRect();
      const left=anchor.left+anchor.width/2-(back.left+back.width/2-current.left);
      panel.style.left=Math.max(leftBound,Math.min(left,rightBound-350*scale))+'px';
      const top=entry.anchor.closest('.toolbar').getBoundingClientRect().bottom+4*scale;
      panel.style.top=Math.max(topBound,Math.min(top,bottomBound-height))+'px';
    }
    positionChoice();
  }
  function close() {
    closeChoice();
    const focus=previousFocus;
    transaction=null;entry=null; panel.hidden=true; delete panel.dataset.ownerId; body.replaceChildren(); paint(); api.historyChanged();surfaceChanged();
    if (focus?.isConnected && api.getMode()==='edit') focus.focus({preventScroll:true});
  }
  function cancel() { if (transaction) close(); }
  function save() {
    if (!transaction) return true;
    if(entry?.kind==='menu'){cancel();return true;}
    if (choice?.confirm && !choice.confirm()) return false;
    closeChoice(false);
    const invalid=body.querySelector('[aria-invalid="true"]');
    if(invalid){invalid.focus();return false;}
    if ((individual()||standalone()?!itemById(transaction.id):owner()?.id!==transaction.id) || api.getMode()!=='edit') {cancel(); return false;}
    // Color editing is deferred; still reject invalid stored data, never silently apply it.
    const color = transaction.draft.background.color;
    if (color!==null && !CSS.supports('color',color)) {
      let error=panel.querySelector('.pg-error');
      if (!error) {error=document.createElement('p');error.className='pg-error';error.setAttribute('role','alert');body.prepend(error);}
      error.textContent='Проверьте значение цвета фона'; error.scrollIntoView({block:'nearest'}); return false;
    }
    const before=api.snapshot();
    if(individual())writeIndividual(itemById(transaction.id));else {replaceCommonOverrides();(standalone()?itemById(transaction.id):owner()).settings.propertyGrid=clone(transaction.draft);}
    close(); api.record(before); return true;
  }
  function open(kind='properties',anchor=document.activeElement) {
    if(!owner())return;
    panel.dataset.widgetContext=standalone()?'standalone':'faq';auxiliary.dataset.widgetContext=panel.dataset.widgetContext;
    const selection=api.getSelection(),type=selection?.type;
    if(api.isActive?.()===false||api.getMode()!=='edit'||!['faq','spoiler','standalone'].includes(type)||(type==='spoiler'&&!['properties','typography','menu'].includes(kind)))return;
    const item=type==='spoiler'?itemById(selection.id):null;if(type==='spoiler'&&!item)return;
    if (transaction) {const same=(entry?.kind||'properties')===kind&&transaction.id===selection.id;cancel();if(same)return;}
    api.finishEdit();
    const faq=owner(); previousFocus=anchor;entry={kind,anchor};
    const original=item?effectiveSettings(item):normalized(faq.settings.propertyGrid);
    transaction={type,id:item?.id||faq.id,original:clone(original),draft:clone(original),replaced:[],reset:[]};
    panel.dataset.ownerId=transaction.id;panel.dataset.ownerType=type;
    level=kind==='typography'?'typography':'main'; tab='rest';surfaceChanged();
    if(['appearance','reveal','menu'].includes(kind)){
      if(kind==='appearance')chooseAppearance(anchor);else if(kind==='reveal')chooseReveal(anchor);else openMenu(anchor);
      api.historyChanged();return;
    }
    panel.hidden=false; render(); paint(); api.historyChanged();
    panel.querySelector('.pg-save').focus({preventScroll:true});
  }
  // One menu renderer; execution permissions are defined by the shared dispatcher.
  const menuItems=[['add','Добавить спойлер','EB25'],['appearance','Стиль','EBBB'],['reveal','Режим открытия','reveal'],['typography','Стиль текста','EAC9'],['properties','Настроить','E61B'],['ungroup','Разгруппировать','EA04'],['copy-link','Скопировать ссылку','E6A7'],['visibility','Условие видимости','E6EB'],['cut','Вырезать','E969'],['copy','Скопировать','E6FD'],['paste','Вставить','E9A1'],['duplicate','Дублировать','E669'],['delete','Удалить','EB72']];
  const menuFor=context=>context.type==='demo-multi'?[['group','Сгруппировать','group'],...menuItems.filter(([command])=>['copy-link','visibility','cut','copy','paste','duplicate','delete'].includes(command))]:menuItems.filter(([command])=>['standalone','demo-single'].includes(context.type)?!['add','ungroup'].includes(command):['faq','demo-group'].includes(context.type)||!['appearance','reveal','ungroup'].includes(command));
  const menuCount=context=>context.type==='demo-multi'?1:['faq','demo-group'].includes(context.type)?6:['standalone','demo-single'].includes(context.type)?4:3;
  function menuMarkup(expanded,context){
    const entries=menuFor(context),count=menuCount(context),compact=count<=1,title=context.type==='faq'?'Команды FAQ':'Команды спойлера';
    return '<button type="button" data-aux-cancel class="pg-floating-close" aria-label="Закрыть меню">'+image('ffce9')+'</button><div class="pg-menu-list" role="menu" aria-label="'+title+'">'+entries.slice(0,expanded||compact?entries.length:count).map(([command,label,glyph])=>'<button type="button" role="menuitem" data-menu-command="'+command+'"'+(command==='group'&&!api.canMenuCommand(command,context)?' disabled aria-disabled="true"':'')+' class="pg-menu-item'+(glyph==='EB72'?' pg-menu-danger':'')+'" title="'+(api.canMenuCommand(command,context)?label:'Пока не реализовано')+'">'+(glyph==='group'?'<img class="pg-menu-icon" src="assets/pg-menu-group.svg" alt="">':glyph==='reveal'?image('menu-reveal','pg-menu-icon'):glyph==='EA04'?'<span class="pg-menu-icon pg-menu-ungroup">'+image('menu-ungroup')+'</span>':icon(glyph,true))+'<span>'+label+'</span></button>').join('')+'</div>'+(compact?'':'<button type="button" class="pg-menu-expander" aria-label="'+(expanded?'Свернуть':'Дополнительные команды')+'" aria-expanded="'+expanded+'"><img class="pg-menu-rest" src="assets/pg-menu-'+(expanded?'expanded':'collapsed')+'.svg" alt=""><img class="pg-menu-hover" src="assets/pg-menu-'+(expanded?'expanded':'collapsed')+'-hover.svg" alt=""></button>');
  }
  function openMenu(anchor,explicitContext){
    const context=Object.freeze(explicitContext||{type:transaction.type,id:transaction.id,...(api.scenarioId?{scenarioId:api.scenarioId}:{}),...(standalone()?{documentId:'text-document'}:{}),...(individual()?{parentId:itemById(transaction.id).parentId}:{})});
    const count=menuCount(context);
    openChoice({kind:'context-menu',title:context.type==='faq'?'Команды FAQ':'Команды спойлера',width:250,anchor,context,collapsedHeight:count*38+38,expanded:false,html:menuMarkup(false,context),click:event=>{
      const current=choice;if(!api.hasCommandTarget(current.context)){cancel();return;}
      const command=event.target.closest('[data-menu-command]')?.dataset.menuCommand;
      if(command){if(!api.canMenuCommand(command,current.context))return;const target={...current.context};cancel();api.runCommand(command,target);return;}
      if(!event.target.closest('.pg-menu-expander'))return;
      current.expanded=!current.expanded;auxiliary.innerHTML=menuMarkup(current.expanded,current.context);positionChoice();auxiliary.querySelector('.pg-menu-expander').focus({preventScroll:true});
    }});
  }
  panel.addEventListener('click',event=>{
    const command=event.target.closest('[data-pg-command]')?.dataset.pgCommand;
    if (!transaction) return;
    const formatButton=event.target.closest('[data-pg-format]');
    if(formatButton){
      const key=formatButton.dataset.formatTarget,name=formatButton.dataset.pgFormat;
      const next=!formatting(transaction.draft,key)[name];
      const inherited=name==='bold'?questionFont(transaction.draft).weight>=600:transaction.draft.question.underlineStyle==='dashed';
      markCommon(key+'.'+name);transaction.draft[key][name]=key==='question'&&['bold','underline'].includes(name)&&next===inherited?null:next;
      formatButton.setAttribute('aria-pressed',String(next));paint();updateResetAvailability();return;
    }
    if(command==='save'){save();return;}
    if(command==='cancel'){cancel();return;}
    if(command?.startsWith('reset-text-color-')){const key=command.slice(17),base=individual()?commonSettings()[key]:{color:'#000000',opacity:100};Object.assign(transaction.draft[key],{color:base.color,opacity:base.opacity});render(true);paint();return;}
    if(choice) closeChoice();
    if(command?.startsWith('color-')) {chooseColor(command.slice(6),event.target.closest('[data-pg-command]'));return;}
    if(command==='text-style'||command==='answer-text-style'){chooseTextStyle(event.target.closest('[data-pg-command]'),command==='text-style'?'question':'answer');return;}
    if(command==='choose-button-icon'){
      const state=transaction.draft.button.editor.states[tab];
      chooseIcon({anchor:event.target.closest('button'),current:buttonState(transaction.draft,tab).icon,onChoose:value=>{markCommon('button.editor.states.'+tab+'.icon');state.icon=value;render(true);paint();}});return;
    }
    if(command==='clear-button-background'){markCommon('button.editor.states.'+tab+'.background');transaction.draft.button.editor.states[tab].background={color:null,opacity:100};render(true);paint();return;}
    if(command==='remove-button-rounding'||command==='add-button-rounding'){markCommon('button.editor.states.'+tab+'.rounding');transaction.draft.button.editor.states[tab].rounding={enabled:command==='add-button-rounding',value:6};render(true);paint();return;}
    if(command==='style-line'){chooseLine(event.target.closest('[data-pg-command]'),styleScope()==='faqStyle'?'faq-border':'spoiler-border');return;}
    if(command?.startsWith('add-style-')||command?.startsWith('remove-style-')){const key=command.split('-').at(-1),enabled=command.startsWith('add'),scope=styleScope();markCommon(scope+'.'+key);transaction.draft[scope][key]=key==='border'?{...borderDefaults(),enabled}:{enabled,value:6};render(true);paint();return;}
    if(command==='clear-style-background'){markCommon(styleScope()==='faqStyle'?'background':'spoilerStyle.background');if(styleScope()==='faqStyle')transaction.draft.background={enabled:true,color:null,opacity:100};else transaction.draft.spoilerStyle.background={color:null,opacity:100};render(true);paint();return;}
    if(command==='line'){chooseLine(event.target.closest('[data-pg-command]'));return;}
    if(command==='appearance'){chooseAppearance(event.target.closest('[data-pg-command]'));return;}
    if(command==='reveal'){chooseReveal(event.target.closest('[data-pg-command]'));return;}
    if (event.target.closest('[data-pg-tab]')) {tab=event.target.closest('[data-pg-tab]').dataset.pgTab;render();return;}
    if (command==='save') {save();return;}
    if (command==='cancel') {cancel();return;}
    if (command==='back') {if(entry?.kind==='typography'){cancel();return;}level='main';}
    else if (command?.startsWith('go-')) {const next=command.slice(3);if(individual()&&!['typography','button'].includes(next))return;if(next==='button'&&!supportsButton(transaction.draft))return;level=next;}
    else if (command==='reset') {
      if(!individual())transaction.replaced.push(...(level==='main'?individualRoots:level==='typography'?['question','answer']:level==='button'?['button.editor']:level==='spoilers'?['spoilerStyle']:[]));
      if(individual()){
        const prefixes=resetPrefixes(),base=leaves(individualBase());transaction.reset.push(...prefixes);
        for(const prefix of prefixes){const keys=new Set([...Object.keys(leaves(transaction.draft)),...Object.keys(base)]);for(const path of keys)if(under(path,prefix))assignPath(transaction.draft,path,base[path]);}
      }else transaction.draft=defaultResetDraft();
    }
    else if (command==='clear-background') transaction.draft.background={enabled:true,color:null,opacity:100};
    else if (command==='add-dividers'&&transaction.draft.appearance!=='outline') transaction.draft.dividers.enabled=true;
    else if (command==='remove-dividers') transaction.draft.dividers.enabled=false;
    else if (command==='side-left' || command==='side-right') {markCommon('button.side');transaction.draft.button.side=command.slice(5);}
    else if (command==='button-edges') {markCommon('button.edges');transaction.draft.button.edges=!transaction.draft.button.edges;}
    else if (command==='divider-outer') transaction.draft.dividers.outer=!transaction.draft.dividers.outer;
    else return;
    render(); paint();
  });
  // PG is outside the scrolling/scaled editor. Its events cannot reach editor actions.
  panel.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
  panel.addEventListener('input',event=>{
    if(!transaction)return;
    if(event.target.matches('[data-text-size]')){
      const input=event.target,value=Number(input.value),valid=/^\d+(?:[.,]\d+)?$/.test(input.value)&&Number.isFinite(value)&&value>0;
      input.setAttribute('aria-invalid',String(!valid));input.setCustomValidity(valid?'':'Введите размер больше нуля в px');
      if(valid){const key=input.dataset.textSize,target=transaction.draft[key];markCommon(key+'.font.size');target.font={...(key==='question'?questionFont(transaction.draft):(target.font||appearanceFont('standard'))),size:value,styleId:target.style||'main'};paint();updateResetAvailability();}return;
    }
    if(!event.target.matches('.pg-thickness,[data-size-key],[data-button-number],[data-style-number]'))return;
    const field=event.target,text=field.value.trim(),value=Number(text.replace(',','.')),paired=['horizontal','vertical'].includes(field.dataset.styleNumber),numbers=text.split('/').map(v=>v.trim()),parsed=numbers.map(v=>Number(v.replace(',','.'))),valid=numbers.length<=(paired?2:1)&&numbers.every((v,i)=>/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(v)&&Number.isFinite(parsed[i])&&parsed[i]>=0);
    field.setAttribute('aria-invalid',String(!valid));field.setCustomValidity(valid?'':'Введите неотрицательное число в px');
    if(valid){if(field.dataset.styleNumber){const k=field.dataset.styleNumber,scope=field.dataset.styleScope;markCommon(...(k==='horizontal'?['left','right'].map(s=>scope+'.padding.'+s):k==='vertical'?['top','bottom'].map(s=>scope+'.padding.'+s):[scope+'.'+(k==='border'?'border.thickness':'rounding.value')]));}else if(field.dataset.buttonNumber)markCommon('button.editor.'+(field.dataset.buttonNumber==='rounding'?'states.'+tab+'.rounding':field.dataset.buttonNumber));if(field.dataset.styleNumber){const target=transaction.draft[field.dataset.styleScope],key=field.dataset.styleNumber;if(key==='border')target.border.thickness=value;else if(key==='rounding')target.rounding.value=value;else if(key==='horizontal'){target.padding.left=parsed[0];target.padding.right=parsed.at(-1);}else {target.padding.top=parsed[0];target.padding.bottom=parsed.at(-1);}field.removeAttribute('placeholder');}else if(field.dataset.buttonNumber){if(field.dataset.buttonNumber==='rounding')transaction.draft.button.editor.states[tab].rounding={enabled:true,value};else transaction.draft.button.editor[field.dataset.buttonNumber]=value;}else if(field.dataset.sizeKey){transaction.draft.size[field.dataset.sizeKey]=value;if(field.dataset.sizeKey==='gap')transaction.draft.size.gapCustom=true;}else transaction.draft.dividers.thickness=value;paint();updateResetAvailability();}else field.reportValidity();
  });
  document.addEventListener('keydown',event=>{
    if(api.isActive?.()===false)return;
    if (!transaction) return;
    if(!panel.hidden&&['Enter',' '].includes(event.key)&&event.target.closest('.spoiler-arrow')&&api.faqElement.contains(event.target)){
      if(!event.repeat)api.toggleView?.(event.target.closest('.spoiler').dataset.spoilerId);
      event.preventDefault();event.stopImmediatePropagation();return;
    }
    if (event.key==='Escape') {
      if(choice?.abort){choice.abort.abort();choice.abort=null;event.preventDefault();event.stopImmediatePropagation();return;}
      if (choice) {if(['appearance','reveal','context-menu'].includes(choice.kind)&&entry?.kind!=='properties')cancel();else closeChoice();event.preventDefault();event.stopImmediatePropagation();return;}
      const popover=panel.querySelector('[data-pg-popover]:not([hidden])');
      if (popover) popover.hidden=true; else cancel();
      event.preventDefault();event.stopImmediatePropagation();
    } else if (event.ctrlKey && ['z','y'].includes(event.key.toLowerCase()) && !event.target.isContentEditable && !event.target.closest('input,textarea,select')) {
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  // Outside clicks remain outside clicks: they neither dismiss PG nor hit objects below it.
  for (const type of ['pointerdown','click','dblclick']) document.addEventListener(type,event=>{
    if(api.isActive?.()===false)return;
    if (!transaction || panel.contains(event.target) || auxiliary.contains(event.target) || event.target.closest('.header,.toolbar,.right-sidebar,.widget-store,.scenario-system')) return;
    if(!panel.hidden&&event.target.closest('.spoiler-arrow')&&api.faqElement.contains(event.target)){
      if(type==='click')api.toggleView?.(event.target.closest('.spoiler').dataset.spoilerId);
      event.preventDefault();event.stopImmediatePropagation();return;
    }
    if(entry?.kind==='menu'&&type==='click')cancel();
    event.preventDefault();event.stopImmediatePropagation();
  },true);
  api.canvas.addEventListener('scroll',position,{passive:true});
  auxiliary.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
  auxiliary.addEventListener('click',event=>{
    if (event.target.closest('[data-aux-cancel]')) {if(['appearance','reveal','context-menu'].includes(choice?.kind)&&entry?.kind!=='properties')cancel();else closeChoice();}
    else if (event.target.closest('[data-aux-save]')) {if (!choice?.confirm || choice.confirm()) closeChoice(false);}
    else choice?.click?.(event);
  });
  auxiliary.addEventListener('keydown',event=>{
    if(choice?.kind==='context-menu'&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      const buttons=[...auxiliary.querySelectorAll('.pg-menu-item,.pg-menu-expander')],index=buttons.indexOf(document.activeElement);
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
      buttons[next].focus({preventScroll:true});event.preventDefault();return;
    }
    if(event.target.matches('[role=button]') && ['Enter',' '].includes(event.key)){event.preventDefault();event.target.click();}
  });
  for(const type of ['pointerover','pointerout'])api.faqElement.addEventListener(type,event=>{
    const button=event.target.closest('.spoiler-arrow');if(button&&!button.contains(event.relatedTarget))paint();
  });
  window.addEventListener('resize',position);
  new ResizeObserver(position).observe(api.faqElement);
  return {open,cancel,save,paint,position,makeOverrides(value,base){const a=individualBase(normalized(base)),b=individualBase(normalized(value)),values=leaves(b);return Object.fromEntries(changedPaths(a,b).filter(allowedPath).map(path=>[path,clone(values[path])]));},demoSettings:(id,context)=>id?normalized({...presetValues(id,context==='faq'?false:standalone()),appearance:id}):normalized(defaults()),openMenuFor(context,anchor){
    if(api.isActive?.()===false||api.getMode()!=='edit'||!api.hasCommandTarget(context))return;
    const same=entry?.kind==='menu'&&transaction?.id===context.id;cancel();if(same)return;
    api.finishEdit();previousFocus=anchor;entry={kind:'menu',anchor};transaction={type:context.type,id:context.id,ids:clone(context.ids),original:defaults(),draft:defaults(),replaced:[],reset:[]};surfaceChanged();openMenu(anchor,structuredClone(context));api.historyChanged();
  },settings:commonSettings,itemSettings:id=>{const item=itemById(id);return item?effectiveSettings(item):null;},isOpen:()=>Boolean(transaction),selectionChanged(selection){
    if(transaction?.type?.startsWith('demo-')){if(selection?.type!==transaction.type||selection?.id!==transaction.id||JSON.stringify(selection?.ids)!==JSON.stringify(transaction.ids)||!api.hasCommandTarget(selection))cancel();return;}
    if (transaction && (selection?.type!==transaction.type || selection.id!==transaction.id || (individual()||standalone()?!itemById(transaction.id):owner()?.id!==transaction.id))) cancel();
  },initialize(){if(standalone())for(const item of api.getItems()){item.settings.propertyGrid=normalized(item.settings.propertyGrid);}else owner().settings.propertyGrid=normalized(owner().settings.propertyGrid);paint();}};
};

