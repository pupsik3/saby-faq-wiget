window.createWidgetScenario = function(config={}) {
  const editor = config.editor || document.querySelector('.editor');
  const standalone=config.context==='standalone';
  let active=config.active!==false;
  let savedScroll=null;
  const scenarioId=config.id||'site';
  const canvas = editor.querySelector('.canvas-scroll');
  const faq = editor.querySelector(standalone?'.standalone-widgets':'.faq-widget');
  const questions = standalone?faq:faq.querySelector('.questions');
  const toolbar = faq.querySelector('.toolbar');
  const column = faq.parentElement;
  const stackId = 'faq-parent-stack';
  const slotId = 'faq-slot-main';
  let widgetStore = null, nextFaqId = 1, initialFaqSettings = null;
  const insertion = document.createElement('section');
  insertion.className='faq-insertion';insertion.dataset.insertionId=slotId;insertion.hidden=true;
  insertion.setAttribute('aria-label','Пустая область вставки');
  insertion.innerHTML=`<div class="insertion-toolbar" aria-label="Тулбар пустой области">${[['Назад','e9a9'],['Настроить','e75d'],['Удалить','eb72'],['Ещё','eab4']].map(([name,icon])=>`<button type="button" class="toolbar-button" title="Пока не реализовано" aria-label="${name}"><i aria-hidden="true" class="icon24 ${name==='Удалить'?'danger':''}">&#x${icon};</i></button>`).join('')}</div><div class="insertion-actions">${[['Колонки','eaee'],['Виджет','e6d3'],['Строки','eac3']].map(([name,icon])=>`<button type="button" class="insertion-action ${name==='Виджет'?'insertion-widget':''}" ${name==='Виджет'?'data-store-open':''} title="${name==='Виджет'?'Открыть магазин виджетов':'Пока не реализовано'}"><i class="icon24" aria-hidden="true">&#x${icon};</i><span>${name}</span></button>`).join('')}</div>${['top','right','bottom','left'].map(side=>`<button type="button" class="insertion-marker marker-${side}" aria-label="Маркер: ${side}" title="Изменение раскладки пока не реализовано"><span></span><img src="assets/store-marker-hover.svg" alt=""></button>`).join('')}`;
  column.append(insertion);
  const undoButton = editor.querySelector('[data-action="undo"]');
  const redoButton = editor.querySelector('[data-action="redo"]');
  const history = {past:[],future:[]};
  const state = { mode: 'edit', selection: standalone?{type:'standalone',id:'document-spoiler-1'}:{type:'faq',id:'faq-main'}, faq:standalone?null:{id:'faq-main',settings:{reveal:'inline'},items:[]}, document:standalone?{id:'text-document',widgets:[]}:null, fields:{} };
  const items=()=>state.demoSet?.items||(standalone?state.document.widgets:(state.faq?.items||[]));
  const activeGroup=()=>state.demoSet?.group||state.faq;
  const groupedItems=()=>state.demoSet?.group?items().filter(item=>state.demoSet.group.itemIds.includes(item.id)):(state.faq?.items||[]);
  const nonEditableItem=item=>Boolean(item&&state.demoSet);
  const restrictedItem=item=>Boolean(state.demoSet&&(!state.demoSet.group||!state.demoSet.group.itemIds.includes(item?.id)));
  const owner=()=>state.demoSet?.group||(standalone?(items().find(i=>i.id===state.selection?.id)||items()[0]):state.faq);
  const widgetSelection=id=>({type:standalone&&!parentOf(findItem(id))?'standalone':'spoiler',id});
  const views = new Map();
  const documentSlotId='document-spoiler-slot';
  let insertionTarget=null;
  const documentLine=standalone?document.createElement('div'):null;
  if(documentLine){
    documentLine.className='document-insertion-line';documentLine.hidden=true;
    documentLine.innerHTML='<div class="document-line-input" role="textbox" aria-label="Пустая строка документа" contenteditable="plaintext-only" data-placeholder="Введите текст"></div><div class="document-line-tools">'+[['Маркированный список','E6C7'],['Нумерованный список','E6C8'],['Изображение','E9A3'],['Таблица','E958'],['Колонки','EAEE'],['Добавить','EB25']].map(([name,glyph])=>'<button type="button" title="Пока не реализовано" aria-label="'+name+'"><i aria-hidden="true">&#x'+glyph+';</i></button>').join('')+'</div>';
    faq.after(documentLine);
    state.document.insertionText='';
    documentLine.addEventListener('focusin',()=>{insertionTarget={id:documentSlotId,documentId:state.document.id};select(null);});
    documentLine.addEventListener('input',()=>{state.document.insertionText=readInput(documentLine.firstElementChild);});
    let lineBefore=null;
    documentLine.firstElementChild.addEventListener('focus',()=>{lineBefore=documentSnapshot();});
    documentLine.firstElementChild.addEventListener('blur',()=>{if(lineBefore){recordChange(lineBefore);lineBefore=null;}});
    documentLine.addEventListener('beforeinput',event=>{if(state.mode!=='edit'||['insertParagraph','insertLineBreak'].includes(event.inputType))event.preventDefault();});
    editor.querySelector('[data-document-insert-spoiler]')?.addEventListener('pointerdown',event=>event.preventDefault());
    editor.querySelector('[data-document-insert-spoiler]')?.addEventListener('click',()=>insertDocumentSpoiler());
  }
  let nextId = 1, session = null, toolbarKind = null;
  let drag = null, suppressedDragPointer = null;
  let questionStartedOnClick = null;
  const demoHost=document.createElement('div');demoHost.className='grouping-demo';demoHost.hidden=true;
  column.insertBefore(demoHost,insertion);
  const properties = window.createFaqPropertyGrid({
    surfaceChanged:kind=>{if(kind)widgetStore?.close(false);for(const button of toolbar.querySelectorAll('[data-command]')){const active=button.dataset.command===kind;button.classList.toggle('is-active',active);if(['appearance','reveal','typography','menu','properties'].includes(button.dataset.command)){button.setAttribute('aria-expanded',String(active));button.setAttribute('aria-pressed',String(active));}}},
    editor,canvas,get faqElement(){return demoHost.querySelector('.grouped-faq')||faq;},getFaq:()=>state.demoSet?.group?{...state.demoSet.group,items:groupedItems()}:state.faq,getOwner:owner,getItems:items,isStandalone:()=>standalone&&!state.demoSet?.group,isActive:()=>active,scenarioId,getMode:()=>state.mode,getGroupingDemo:()=>state.demoSet?{...state.demoSet,host:demoHost}:null,
    toggleView:id=>{const item=findItem(id);if(item&&(standalone||parentOf(item)))toggle(item,true);},
    canMenuCommand,hasCommandTarget,runCommand:(command,context)=>runCommand(command,context,'menu'),
    getSelection:()=>state.selection,finishEdit,snapshot:documentSnapshot,
    record:recordChange,historyChanged:updateHistoryButtons,layout:(settings,painted)=>{syncOverlayViews(settings,painted);positionToolbar();}
  });
  const faqIcons = [...toolbar.children].map(e => e.cloneNode(true));
  const faqNames = ['Назад','Добавить','Оформление','Раскрытие','Свойства текста','Настройки','Удалить','Ещё'];
  const spoilerNames = ['Назад','Добавить','Открыть','Текст','Настройки','Удалить','Ещё'];
  const spoilerGlyphs = ['\uE9A9','\uEB25','\uE9E6','\uEAC9','\uE75D','\uEB72','\uEAB4'];
  const demoAnswers = [
    'Демонстрационный ответ: в команде работают разработчики, тестировщики, аналитики и специалисты поддержки.',
    'Демонстрационный ответ: команды развивают сервисы Saby для автоматизации бизнеса.',
    'Демонстрационный ответ: сотрудникам доступны обучение и профессиональное развитие.'
  ];
  const findItem = id => items().find(e => e.id === id);
  const demoOnly=()=>Boolean(state.demoSet);
  const groupReady=()=>state.selection?.type==='demo-multi'&&!state.demoSet?.group&&(standalone?state.selection.ids.length>=2:state.selection.ids.length===items().length&&items().length>0)&&state.selection.ids.every(id=>items().some(item=>item.id===id));
  const itemAt = target => findItem(target.closest('.spoiler')?.dataset.spoilerId);
  // Only document data is captured: view state (selection, open answers, scroll, mode) stays live.
  function documentSnapshot() {
    const demoSet=state.demoSet?structuredClone(state.demoSet):null;
    if(demoSet)for(const item of demoSet.items)delete item.open;
    if(standalone)return structuredClone({document:{...state.document,widgets:state.document.widgets.map(({open,...item})=>item)},...(demoSet?{demoSet}:{}),fields:state.fields});
    const {items:faqItems,...container} = state.faq || {items:[]};
    return structuredClone({faq:state.faq?{...container,items:faqItems.map(({open,...item})=>item)}:null,...(demoSet?{demoSet}:{}),fields:state.fields});
  }
  const sameDocument = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  function updateHistoryButtons() {
    const pending = session && !sameDocument(session.before,documentSnapshot());
    undoButton.disabled = properties.isOpen() || state.mode !== 'edit' || (!history.past.length && !pending);
    redoButton.disabled = properties.isOpen() || state.mode !== 'edit' || !history.future.length || Boolean(pending);
    for (const button of [undoButton,redoButton]) button.setAttribute('aria-disabled',String(button.disabled));
  }
  function recordChange(before) {
    const after = documentSnapshot();
    if (!sameDocument(before,after)) {
      history.past.push({before,after});
      if (history.past.length > 100) history.past.shift();
      history.future.length = 0;
    }
    updateHistoryButtons();
  }
  function restoreDocument(snapshot) {
    const scrollTop = canvas.scrollTop;
    widgetStore?.close(false);
    const open = new Map(items().map(item=>[item.id,item.open]));
    const selection = state.selection;
    const data = structuredClone(snapshot),wasDemo=demoOnly();
    state.demoSet=data.demoSet||null;
    if(state.demoSet)for(const item of state.demoSet.items)item.open=open.get(item.id)??false;
    if(standalone)state.document={...data.document,widgets:data.document.widgets.map(item=>({...item,open:open.get(item.id)??false}))};
    else state.faq = data.faq?{...data.faq,items:data.faq.items.map(item=>({...item,open:open.get(item.id) ?? false}))}:null;
    state.fields = data.fields;
    if(state.demoSet){rebuildDemo();select(state.demoSet.group?{type:'faq',id:state.demoSet.group.id}:null);canvas.scrollTop=scrollTop;return;}
    if(wasDemo){for(const view of views.values())view.mount.remove();views.clear();demoHost.replaceChildren();toolbarKind=null;}
    demoHost.hidden=true;faq.prepend(toolbar);
    mountFaq();
    const ids = new Set(items().map(item=>item.id));
    for (const [id,view] of views) if (!ids.has(id)) { view.mount.remove(); views.delete(id); }
    for (const item of items()) {
      let view = views.get(item.id);
      if (!view) { createView(item); view = views.get(item.id); }
      else {
        view.question.textContent = item.question;
        view.answer.replaceChildren(...item.answer.split('\n').map(makeAnswerLine));
        ensureAnswerLines(view.answer); updateItem(item);
      }
      questions.append(view.mount);
    }
    properties.paint();
    for (const field of canvas.querySelectorAll('[data-text-key]:not([data-item-field])')) {
      if (Object.hasOwn(state.fields,field.dataset.textKey)) field.textContent = state.fields[field.dataset.textKey];
    }
    window.getSelection()?.removeAllRanges();
    mountFaq();
    if(standalone)select(selection&&ids.has(selection.id)?selection:items()[0]?widgetSelection(items()[0].id):null);
    else select(!state.faq?{type:'insertion',id:slotId}:!selection||selection.type==='insertion'||selection.type==='faq'&&selection.id!==state.faq.id||selection.type==='spoiler'&&!ids.has(selection.id)||selection.type==='stack'&&selection.faqId!==state.faq.id
      ? {type:'faq',id:state.faq.id} : selection);
    canvas.scrollTop = scrollTop;
  }
  function changeHistory(direction) {
    if (!active || state.mode !== 'edit' || properties.isOpen()) return;
    if (drag) endDrag(false);
    finishEdit();
    const source = direction === 'undo' ? history.past : history.future;
    const target = direction === 'undo' ? history.future : history.past;
    const entry = source.pop();
    if (entry) {
      target.push(entry);
      restoreDocument(direction === 'undo' ? entry.before : entry.after);
    }
    updateHistoryButtons();
  }
  function getText(field) {
    if (field.matches('.answer-line')) return readInput(field);
    const item = itemAt(field);
    return item ? item[field.dataset.itemField] : state.fields[field.dataset.textKey];
  }
  function setText(field, value) {
    const item = itemAt(field);
    if (field.matches('.answer-line')) {
      const answer = field.parentElement;
      const lines = [...answer.children];
      item.answer = lines.map(line => line === field ? value : readInput(line)).join('\n');
      return;
    }
    if (item) item[field.dataset.itemField] = value;
    else state.fields[field.dataset.textKey] = value;
  }
  function readInput(field) {
    return field.textContent === '' && field.querySelectorAll('br').length <= 1 ? '' : field.innerText;
  }
  function finishEdit(cancel = false) {
    if (!session) return;
    const {field,original,before} = session;
    const value = cancel ? original : readInput(field);
    session = null;
    field.textContent = value;
    if (field.matches('.answer-line')) ensureAnswerLines(field.parentElement);
    setText(field,value);
    field.contentEditable = 'false';
    field.classList.remove('editing-text');
    field.textContent = value;
    field.blur();
    if (cancel) restoreDocument(before);
    else recordChange(before);
    syncCarets(); positionToolbar();
    updateHistoryButtons();
  }
  function startEdit(field, atEnd = false) {
    if (nonEditableItem(itemAt(field)) || state.mode !== 'edit' || session?.field === field) return;
    finishEdit();
    session = {field,original:getText(field),before:documentSnapshot()};
    field.contentEditable = 'plaintext-only';
    field.classList.add('editing-text');
    field.focus({preventScroll:true});
    if (atEnd) {
      const range = document.createRange();
      range.selectNodeContents(field); range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
    }
    syncCarets();
  }
  function syncDocumentLine(focus=false){
    if(!standalone)return;
    const visible=!state.demoSet&&!items().length;
    faq.hidden=Boolean(state.demoSet)||visible;
    documentLine.hidden=!visible;
    const field=documentLine.firstElementChild;
    if(document.activeElement!==field)field.textContent=state.document.insertionText||'';
    field.contentEditable=state.mode==='edit'?'plaintext-only':'false';
    documentLine.classList.toggle('is-empty',!state.document.insertionText);
    if(!visible)insertionTarget=null;
    if(focus&&visible&&state.mode==='edit')field.focus({preventScroll:true});
  }
  function insertDocumentSpoiler(){
    if(!active||!standalone||state.mode!=='edit'||state.demoSet||items().length||insertionTarget?.id!==documentSlotId||insertionTarget.documentId!==state.document.id||state.document.insertionText)return false;
    finishEdit();properties.cancel();documentLine.firstElementChild.blur();
    const before=documentSnapshot(),item=makeItem(undefined,{question:'',answer:'',placeholder:'Заголовок спойлера'});
    item.open=true;items().push(item);questions.append(createView(item));syncDocumentLine();properties.paint();
    select(widgetSelection(item.id));recordChange(before);startEdit(views.get(item.id).question,true);return true;
  }
  function makeAnswerLine(text = '') {
    const line = document.createElement('div');
    line.className = 'answer-line'; line.textContent = text;
    line.contentEditable = 'false'; line.setAttribute('role','textbox');
    line.setAttribute('aria-label','Строка ответа');
    line.dataset.placeholder = 'Введите текст / добавьте виджет';
    return line;
  }
  function editQuestionAt(field,event) {
    startEdit(field,true); event.preventDefault();
    const position = document.caretPositionFromPoint?.(event.clientX,event.clientY);
    const hit = position ? null : document.caretRangeFromPoint?.(event.clientX,event.clientY);
    const node = position?.offsetNode ?? hit?.startContainer;
    const offset = position?.offset ?? hit?.startOffset;
    if (node && field.contains(node)) {
      const caret = document.createRange(); caret.setStart(node,offset); caret.collapse(true);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(caret);
    }
  }
  function finishQuestion(field) {
    const item = itemAt(field);
    finishEdit(); window.getSelection()?.removeAllRanges();
    if (item?.open) startEdit(views.get(item.id).answer.lastElementChild,true);
  }
  function ensureAnswerLines(answer) {
    // Keep an empty answer selectable, but never append a row merely because typing started.
    if (!answer.lastElementChild) answer.append(makeAnswerLine());
    for (const line of answer.children) line.tabIndex = state.mode === 'edit' ? 0 : -1;
  }
  function splitAnswerLine(field, text = '\n') {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!field.contains(range.commonAncestorContainer)) return;
    const before = range.cloneRange(); before.selectNodeContents(field); before.setEnd(range.startContainer,range.startOffset);
    const after = range.cloneRange(); after.selectNodeContents(field); after.setStart(range.endContainer,range.endOffset);
    const parts = (before.toString() + text + after.toString()).replace(/\r\n?/g,'\n').split('\n');
    const caretParts = (before.toString() + text).replace(/\r\n?/g,'\n').split('\n');
    const answer = field.parentElement;
    field.textContent = parts[0];
    let previous = field;
    const inserted = [field];
    for (const part of parts.slice(1)) {
      const line = makeAnswerLine(part); previous.after(line); previous = line; inserted.push(line);
    }
    ensureAnswerLines(answer); setText(field,readInput(field));
    finishEdit();
    const target = inserted[caretParts.length - 1]; startEdit(target);
    const caret = document.createRange();
    if (target.firstChild) caret.setStart(target.firstChild,caretParts.at(-1).length);
    else caret.setStart(target,0);
    caret.collapse(true); selection.removeAllRanges(); selection.addRange(caret);
  }
  function removeEmptyAnswerLine(field) {
    if (state.mode !== 'edit' || !field.matches('.answer-line') || readInput(field) !== '') return false;
    const previous = field.previousElementSibling;
    if (!previous) return false;
    const answer = field.parentElement;
    finishEdit();
    const before = documentSnapshot();
    field.remove(); ensureAnswerLines(answer);
    setText(previous,readInput(previous));
    recordChange(before);
    startEdit(previous,true); syncCarets();
    return true;
  }
  function createView(item) {
    const element = document.createElement('div');
    element.className = 'spoiler'; element.dataset.spoilerId = item.id;
    const row = document.createElement('div'); row.className = 'question-row';
    const arrow = document.createElement('i'); arrow.className = 'spoiler-arrow';
    const glyph = document.createElement('span'); glyph.className = 'arrow-glyph';
    glyph.setAttribute('aria-hidden','true'); arrow.append(glyph);
    const question = document.createElement('span'); question.className = 'question-text';
    question.dataset.itemField = 'question'; question.dataset.textKey = item.id + '-question';
    question.dataset.placeholder = item.placeholder || 'Введите вопрос'; question.contentEditable = 'false'; question.textContent = item.question;
    const answer = document.createElement('div'); answer.className = 'faq-answer';
    answer.id = 'faq-answer-' + item.id; answer.dataset.itemField = 'answer';
    answer.append(...(item.answer === '' ? [] : item.answer.split('\n')).map(makeAnswerLine));
    ensureAnswerLines(answer);
    answer.contentEditable = 'false';
    answer.setAttribute('role','group'); answer.setAttribute('aria-label','Ответ');
    const answerEditor = document.createElement('div'); answerEditor.className = 'answer-editor';
    row.append(arrow,question); row.setAttribute('aria-controls',answer.id);
    answerEditor.append(answer);
    const content=document.createElement('div');content.className='spoiler-content';content.append(row,answerEditor);element.append(content);
    let mount=element;
    if((standalone&&!demoOnly())||restrictedItem(item)){mount=document.createElement('div');mount.className=demoOnly()?'demo-spoiler-frame':'standalone-frame';mount.dataset.widgetId=item.id;const list=document.createElement('div');list.className='questions';list.append(element);mount.append(list);}
    views.set(item.id,{element,row,arrow,glyph,question,answer,answerEditor,content,mount});
    updateItem(item); return mount;
  }
  function syncCarets() {
    for (const item of items()) {
      const v = views.get(item.id);
      if (!v) continue;
      const active = session?.field;
      const placeholder = active?.parentElement === v.answer && readInput(active) === ''
        ? active : v.answer.lastElementChild;
      for (const line of v.answer.children) {
        const empty = readInput(line) === '';
        line.classList.toggle('is-empty',empty);
        line.classList.toggle('has-placeholder',empty && line === placeholder);
      }
    }
  }
  function discardEmptyAnswerTail(item) {
    const trim=text=>text.replace(/\n+$/,'');
    item.answer=trim(item.answer);
    // Closing discards insertion cues, including their history-only copies, but
    // keeps entered text and empty lines between nonempty answer paragraphs.
    for(const stack of [history.past,history.future]){
      for(const entry of stack)for(const snapshot of [entry.before,entry.after]){
        const target=(snapshot.demoSet?.items||(standalone?snapshot.document?.widgets:snapshot.faq?.items))?.find(value=>value.id===item.id);
        if(target)target.answer=trim(target.answer);
      }
      for(let index=stack.length-1;index>=0;index--)if(sameDocument(stack[index].before,stack[index].after))stack.splice(index,1);
    }
  }
  function renderOpenState(item) {
    const v = views.get(item.id);
    if(!item.open){
      const selection=window.getSelection();
      if(selection?.anchorNode&&v.answerEditor.contains(selection.anchorNode))selection.removeAllRanges();
      if(v.answerEditor.contains(document.activeElement))document.activeElement.blur();
      if(item.answer.endsWith('\n'))discardEmptyAnswerTail(item);
      while(v.answer.children.length>1&&readInput(v.answer.lastElementChild)==='')v.answer.lastElementChild.remove();
    }
    v.element.classList.toggle('is-open',item.open);
    v.answer.hidden = !item.open;
    v.answerEditor.hidden = !item.open;
    for (const line of v.answer.children) line.tabIndex = !nonEditableItem(item)&&state.mode === 'edit' && item.open ? 0 : -1;
    v.glyph.textContent = item.open ? '\uE96D' : '\uE96E';
    for (const node of [v.row,v.arrow]) node.setAttribute('aria-expanded',String(item.open));
    v.arrow.setAttribute('aria-label',item.open ? 'Свернуть ответ' : 'Раскрыть ответ');
    v.row.tabIndex = !nonEditableItem(item)&&state.mode === 'preview' ? 0 : -1;
    v.arrow.tabIndex = !nonEditableItem(item)&&state.mode === 'edit' ? 0 : -1;
    v.row.setAttribute('role',state.mode === 'preview' ? 'button' : 'group');
    v.arrow.setAttribute('role',state.mode === 'edit' ? 'button' : 'img');
  }
  function updateItem(item) {
    renderOpenState(item);
    syncCarets();
    properties.paint();
  }
  function positionToolbar() {
    const frame=toolbar.parentElement,border=parseFloat(getComputedStyle(frame).borderTopWidth)||0;
    toolbar.style.left=-(parseFloat(getComputedStyle(frame).borderLeftWidth)||0)+'px';
    if(demoOnly()&&state.selection?.type?.startsWith('demo-')){
      const ids=state.selection?.type==='demo-multi'?state.selection.ids:[state.selection?.id];
      const first=state.demoSet.items.find(item=>ids.includes(item.id)),mount=views.get(first?.id)?.mount;
      toolbar.style.top=((state.demoSet.group?0:mount?.offsetTop||0)-44)+'px';return;
    }
    // Both contexts stay above the FAQ container, independent of the selected row.
    const mount=standalone&&!state.demoSet?.group?views.get(state.selection?.id)?.mount:null;
    toolbar.style.top = ((mount?.offsetTop||0)-44-border)+'px';
  }
  function keepOneOverlayOpen(settings,preferredId){
    if(!activeGroup()||settings.reveal!=='overlay')return false;
    const open=groupedItems().filter(item=>item.open);
    const keep=open.find(item=>item.id===preferredId)||open.find(item=>item.id===state.selection?.id)||open[0];
    for(const item of open)if(item!==keep){item.open=false;if(views.has(item.id))renderOpenState(item);}
    return open.length>1;
  }
  function syncOverlayViews(settings,painted=false) {
    if(!active||(!standalone&&!activeGroup()))return;
    if(keepOneOverlayOpen(settings)&&painted){properties.paint();return;}
    const frame=editor.getBoundingClientRect(),scale=frame.width/1600;
    const bottom=Math.min(frame.bottom,document.documentElement.clientHeight)-8*scale;
    for(const item of items()){
      if(nonEditableItem(item))continue;
      const view=views.get(item.id);if(!view)continue;
      const enabled=state.mode==='preview'&&(standalone?properties.itemSettings(item.id):settings).reveal==='overlay'&&item.open;
      if(!enabled){
        if(!painted&&view.element.dataset.overlay==='true'&&view.overlaySurface)Object.assign(view.element.style,view.overlaySurface.presentation);
        view.element.dataset.overlay='false';view.element.style.height='';view.content.removeAttribute('style');
        for(const key of ['maxHeight','overflowY','scrollbarWidth'])view.answerEditor.style[key]='';
        view.overlayClosedHeight=null;view.overlaySurface=null;continue;
      }
      if(painted||!view.overlaySurface){
        const style=getComputedStyle(view.element),effective=properties.itemSettings(item.id),box=effective.spoilerStyle;
        const padding=Object.fromEntries(['Top','Right','Bottom','Left'].map(side=>[side,parseFloat(style['padding'+side])||0]));
        const borders=Object.fromEntries(['Top','Right','Bottom','Left'].map(side=>[side,parseFloat(style['border'+side+'Width'])||0]));
        const presentation=Object.fromEntries(['backgroundColor','borderRadius','padding','boxShadow',...['Top','Right','Bottom','Left'].map(side=>'border'+side)].map(key=>[key,style[key]]));
        // The accent contributes structural left padding, not a custom surface.
        const autoPadding=box.background.color===null&&Object.values(box.padding).every(value=>value===0);
        const plain=autoPadding&&!box.border.enabled&&!box.rounding.enabled;
        view.overlaySurface={presentation,padding,borders,plain,autoPadding,hasBackground:box.background.color!==null};
      }
      const {presentation,padding,borders,plain,autoPadding,hasBackground}=view.overlaySurface,extra=autoPadding?12:0;
      const rect=view.element.getBoundingClientRect();
      const left=rect.left-extra*scale,top=rect.top-extra*scale,width=rect.width/scale+extra*2;
      view.element.dataset.overlay='true';view.element.style.height=(view.overlayClosedHeight??(view.row.offsetHeight+padding.Top+padding.Bottom+borders.Top+borders.Bottom))+'px';
      view.element.style.backgroundColor='transparent';view.element.style.boxShadow='none';
      for(const side of ['Top','Right','Bottom','Left'])view.element.style['border'+side+'Color']='transparent';
      Object.assign(view.content.style,presentation,{backgroundColor:hasBackground?presentation.backgroundColor:'#FFFFFF',borderRadius:plain?'12px':presentation.borderRadius,boxShadow:presentation.boxShadow==='none'?'0 0 4px rgb(0 0 0 / 6%)':presentation.boxShadow,
        padding:['Top','Right','Bottom','Left'].map(side=>(padding[side]+extra)+'px').join(' '),left:(left-frame.left)/scale+'px',top:(top-frame.top)/scale+'px',width:width+'px'});
      view.content.style.setProperty('--overlay-accent-inset',extra+'px');
      const answerTop=view.answerEditor.getBoundingClientRect().top;
      Object.assign(view.answerEditor.style,{maxHeight:Math.max(0,(bottom-answerTop)/scale-padding.Bottom-extra-borders.Bottom)+'px',overflowY:'auto',scrollbarWidth:'thin'});
    }
  }
  function renderToolbar() {
    if(demoOnly()&&!['faq','spoiler'].includes(state.selection?.type)){renderDemoToolbar();return;}
    if(state.demoSet?.group){const host=demoHost.querySelector('.grouped-faq');if(host&&toolbar.parentElement!==host)host.prepend(toolbar);}
    else {const host=state.selection?.type==='stack'?column:faq;if(toolbar.parentElement!==host)host.prepend(toolbar);}
    toolbar.hidden=false;
    const kind = ['faq','spoiler','standalone','stack'].includes(state.selection?.type)?state.selection.type:null;
    if (kind && kind !== toolbarKind) {
      const names = kind === 'stack' ? ['Назад','Колонка','Гориз. выравнивание','Верт. выравнивание','Настройки','Удалить','Ещё'] : kind === 'faq' ? faqNames : kind==='standalone'?['Открыть','Оформление','Раскрытие','Текст','Настройки','Удалить','Ещё']:spoilerNames;
      toolbar.replaceChildren(...names.map((name,index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'toolbar-button'; button.setAttribute('aria-label',name);
        let icon;
        if (kind === 'faq') {
          icon = faqIcons[index]?.cloneNode(true)||document.createElement('i');
          if(!faqIcons[index]){icon.textContent=['\uE9A9','\uEB25','\uEBBB','\uEAC9','\uEAC9','\uE75D','\uEB72','\uEAB4'][index];if(index===3)icon.innerHTML='<img src="assets/faq-expand.svg" alt="">';if(index===6)icon.className='danger';}
          if (icon.querySelector('img')) icon.classList.add('toolbar-svg');
        } else {
          icon = document.createElement('i'); icon.textContent = kind==='stack'?['\uE9A9','\uEAC3','\uEBC2','\uEBC3','\uE75D','\uEB72','\uEAB4'][index]:kind==='standalone'?['\uE9E6','\uEBBB','\uEAC9','\uEAC9','\uE75D','\uEB72','\uEAB4'][index]:spoilerGlyphs[index];
          if(kind==='standalone'&&index===2){icon.className='toolbar-svg';icon.innerHTML='<img src="assets/faq-expand.svg" alt="">';}
          if (name === 'Удалить') icon.className = 'danger';
        }
        icon.setAttribute('aria-hidden','true'); button.append(icon);
        if (name === 'Добавить') button.dataset.command = 'add';
        if (name === 'Настройки') button.dataset.command = 'properties';
        if (kind !== 'faq' && name === 'Текст') button.dataset.command = 'typography';
        if (kind !== 'faq' && name === 'Ещё') button.dataset.command = 'menu';
        if (kind !== 'spoiler' && ['Оформление','Раскрытие','Свойства текста','Ещё'].includes(name)) button.dataset.command = {'Оформление':'appearance','Раскрытие':'reveal','Свойства текста':'typography','Ещё':'menu'}[name];
        if ((kind === 'spoiler'||kind==='faq'&&!standalone) && name === 'Назад') button.dataset.command = 'parent';
        if (name === 'Удалить') button.dataset.command = 'delete';
        if ((kind === 'spoiler' && index === 2)||(kind==='standalone'&&index===0)) {
          button.classList.add('spoiler-toggle-label');
          const label = document.createElement('span'); label.textContent = 'Открыть'; button.append(label);
        }
        if(kind==='stack'){delete button.dataset.command;button.setAttribute('aria-disabled','true');button.title='Команда родительского блока пока недоступна';}
        return button;
      }));
      if(kind==='faq'&&standalone&&demoOnly())toolbar.firstElementChild.remove();
      toolbarKind = kind;
    }
    toolbar.dataset.context = kind || 'none';
    toolbar.dataset.ownerId = state.selection?.id || '';
    toolbar.inert = state.mode !== 'edit' || !kind;
    if (kind === 'spoiler'||kind==='standalone') {
      const item = findItem(state.selection.id), button = toolbar.querySelector('.spoiler-toggle-label');
      const label = item.open ? 'Закрыть' : 'Открыть';
      button.querySelector('span').textContent = label; button.setAttribute('aria-label',label);
      button.title = label; button.dataset.command = item.open ? 'close' : 'open';
      button.querySelector('i').textContent = item.open ? '\uE9E7' : '\uE9E6';
      const back = toolbar.querySelector('[data-command="parent"]');
      if(back){back.disabled = !parentOf(item);
      back.title = back.disabled ? 'У спойлера нет родительского FAQ' : 'Выбрать родительский FAQ';}
    }
    positionToolbar();
  }
  function select(selection) {
    if(selection?.type==='stack'&&(standalone||demoOnly()||!state.faq||selection.id!==stackId||selection.faqId!==state.faq.id))selection=null;
    properties.selectionChanged(selection);
    state.selection = state.mode === 'edit' ? selection : null;
    editor.dataset.selectionType = state.selection?.type || 'none';
    editor.dataset.faqSelected = String(state.selection?.type === 'faq');
    for (const [id,v] of views) v.element.classList.toggle('is-selected',['spoiler','standalone'].includes(state.selection?.type) && state.selection.id === id);
    if(demoOnly())for(const [id,v] of views){if(restrictedItem(findItem(id)))v.element.classList.toggle('is-selected',state.selection?.type==='demo-single'&&state.selection.id===id);v.element.classList.toggle('is-multi-selected',state.selection?.type==='demo-multi'&&state.selection.ids.includes(id));}
    renderToolbar(); syncCarets();
  }
  function toggle(item,preserveSelection=false) {
    if(nonEditableItem(item))return;
    finishEdit();
    if (state.mode === 'edit'&&!preserveSelection) select(widgetSelection(item.id));
    setOpen(item,!item.open);renderToolbar();
  }
  function setOpen(item,open){
    if(open&&!item.open&&state.mode==='preview'&&properties.settings().reveal==='overlay')views.get(item.id).overlayClosedHeight=views.get(item.id).element.offsetHeight;
    item.open=open;keepOneOverlayOpen(properties.settings(),open?item.id:null);updateItem(item);
  }
  function parentOf(item) {
    return activeGroup()&&item?.parentId === activeGroup().id && groupedItems().includes(item) ? activeGroup() : null;
  }
  function commandContext(){const selection=state.selection;return selection?{...selection,scenarioId,documentId:standalone?state.document.id:'site-document',...(selection.type==='spoiler'?{parentId:findItem(selection.id)?.parentId}:{})}:null;}
  function hasCommandTarget(context){
    if(context?.scenarioId&&context.scenarioId!==scenarioId)return false;
    if(context?.documentId&&context.documentId!==(standalone?state.document.id:'site-document'))return false;
    if(context?.type==='stack')return !standalone&&!demoOnly()&&context.id===stackId&&context.faqId===state.faq?.id;
    if(demoOnly()){
      if(context?.type==='faq')return context.id===state.demoSet.group?.id;
      if(context?.type==='spoiler')return Boolean(parentOf(findItem(context.id)))&&(context.parentId===undefined||context.parentId===state.demoSet.group.id);
      if(context?.type==='demo-group')return context.id===state.demoSet.group?.id;
      if(context?.type==='demo-single')return restrictedItem(findItem(context.id))&&Boolean(findItem(context.id));
      if(context?.type==='demo-multi')return !state.demoSet.group&&context.id===state.demoSet.id&&context.ids?.length>0&&context.ids.every(id=>findItem(id));
      return false;
    }
    if(standalone)return context?.type==='standalone'&&Boolean(findItem(context.id));
    if(context?.type==='faq')return context.id===state.faq?.id;
    const item=context?.type==='spoiler'?findItem(context.id):null;
    return Boolean(item&&(context.parentId===undefined||context.parentId===item.parentId));
  }
  function canMenuCommand(command,context){
    if(demoOnly())return active&&state.mode==='edit'&&hasCommandTarget(context)&&((context.type==='faq'&&command==='ungroup')||(context.type==='demo-multi'&&command==='group'&&groupReady()));
    if(command==='ungroup')return active&&state.mode==='edit'&&context?.type==='faq'&&hasCommandTarget(context)&&items().length>0;
    const allowed={faq:['add','appearance','reveal','typography','properties'],spoiler:['add','typography','properties','delete'],standalone:['appearance','reveal','typography','properties','delete']};
    return active&&state.mode==='edit'&&hasCommandTarget(context)&&Boolean(allowed[context.type]?.includes(command));
  }
  // Toolbar and menu dispatch through the same document commands with an explicit owner.
  function runCommand(command,context,source='toolbar'){
    if(!active||state.mode!=='edit'||!hasCommandTarget(context)||state.selection?.type!==context.type||state.selection.id!==context.id)return false;
    if(context.type==='demo-multi'&&JSON.stringify(context.ids)!==JSON.stringify(state.selection.ids))return false;
    if(source==='menu'&&!canMenuCommand(command,context))return false;
    if(context.type==='stack')return false;
    if(command==='parent'&&context.type==='faq'&&!standalone&&!demoOnly()){
      finishEdit();properties.cancel();if(drag)endDrag(false);window.getSelection()?.removeAllRanges();
      select({type:'stack',id:stackId,faqId:state.faq.id});return true;
    }
    if(demoOnly()&&context.type.startsWith('demo-')){
      if(command==='menu'){properties.openMenuFor(context,toolbar.querySelector('[data-command=menu]'));return true;}
      if(command==='group'&&groupReady()){groupDemo();return true;}
      if(command==='ungroup'&&context.type==='demo-group'){ungroupDemo();return true;}
      return false;
    }
    if(demoOnly()&&command==='ungroup'&&context.type==='faq'){ungroupDemo();return true;}
    if(demoOnly()&&command!=='menu')return false;
    if(command==='ungroup'&&context.type==='faq'&&items().length>0){ungroupDemo();return true;}
    if(context.type==='faq'&&command==='delete'){deleteFaq(context.id);return true;}
    if(command==='add'){
      if(context.type==='spoiler'&&!parentOf(findItem(context.id)))return false;
      properties.cancel();addItem(context);return true;
    }
    if(['properties','typography','menu','appearance','reveal'].includes(command)){
      if(context.type==='spoiler'&&['appearance','reveal'].includes(command))return false;
      const anchor=toolbar.querySelector(`[data-command="${command}"]`);
      if(!anchor)return false;
      properties.open(command,anchor);return true;
    }
    if(['spoiler','standalone'].includes(context.type)&&['parent','open','close','delete'].includes(command)){
      if(command==='delete')properties.cancel();
      runSpoilerCommand(command,context.id);return true;
    }
    return false;
  }
  function runSpoilerCommand(command, id) {
    if (state.mode !== 'edit' || !['spoiler','standalone'].includes(state.selection?.type) || state.selection.id !== id) return;
    const item = findItem(id);
    if (!item) return;
    const parent = parentOf(item);
    finishEdit();
    if (command === 'parent') {
      if (parent) select({type:'faq',id:parent.id});
    } else if (command === 'open' || command === 'close') {
      setOpen(item,command==='open');renderToolbar();
    } else if (command === 'delete') {
      const index = items().findIndex(entry => entry.id === id);
      if (index < 0) return;
      const before = documentSnapshot();
      window.getSelection()?.removeAllRanges();
      items().splice(index,1);
      views.get(id).mount.remove(); views.delete(id);
      properties.paint();
      select(parent ? {type:'faq',id:parent.id} : standalone&&items()[0]?widgetSelection(items()[0].id):null);
      recordChange(before);
      syncDocumentLine(true);
    }
  }
  function ensureVisible(view) {
    const area = canvas.getBoundingClientRect(), row = view.row.getBoundingClientRect();
    const scale = editor.getBoundingClientRect().width / 1600;
    const top = row.top;
    if (top < area.top) canvas.scrollTop -= (area.top - top) / scale;
    else if (row.bottom > area.bottom) canvas.scrollTop += (row.bottom - area.bottom) / scale;
  }
  function addItem(context=commandContext()) {
    if (state.mode !== 'edit' || !hasCommandTarget(context)) return;
    finishEdit();
    const before = documentSnapshot();
    const after = context.type !== 'faq' ? items().findIndex(e => e.id === context.id) : items().length - 1;
    const item = makeItem(state.faq?.id);
    items().splice(after + 1,0,item);
    const node = createView(item), next = items()[after + 2];
    questions.insertBefore(node,next ? views.get(next.id).mount : null);
    properties.paint();
    recordChange(before);
    select(widgetSelection(item.id)); ensureVisible(views.get(item.id)); startEdit(views.get(item.id).question,true);
  }
  function setMode(mode) {
    if (mode === 'preview' && !properties.save()) return;
    if (drag) endDrag(false);
    if (mode === state.mode) return;
    const scrollTop = canvas.scrollTop;
    finishEdit(); window.getSelection()?.removeAllRanges();
    widgetStore.close(false);
    state.mode = mode; editor.dataset.mode = mode; select(null);
    syncDocumentLine();
    items().forEach(updateItem); canvas.scrollTop = scrollTop;config.modeChanged?.(mode);
    updateHistoryButtons();
  }
  function dragScale() { return editor.getBoundingClientRect().width / 1600; }
  function updateDrag() {
    const d = drag;
    if (!d?.active) return;
    const scale = dragScale(), list = questions.getBoundingClientRect(), area = canvas.getBoundingClientRect();
    d.copy.style.transform = `translate(${d.x + 20 * scale}px,${d.y + 20 * scale}px) scale(${scale})`;
    d.cursor.style.transform = `translate(${d.x}px,${d.y}px) scale(${scale})`;
    const nodes = state.faq.items.map(item => views.get(item.id).element);
    const boxes = nodes.map(node => node.getBoundingClientRect());
    d.valid = d.x >= list.left && d.x <= list.right && d.y >= list.top - 8 * scale && d.y <= list.bottom + 8 * scale
      && d.y >= area.top && d.y <= area.bottom && d.x >= area.left && d.x <= area.right;
    const next = boxes.findIndex(box => d.y < (box.top + box.bottom) / 2);
    d.slot = next < 0 ? boxes.length : next;
    const old = state.faq.items.findIndex(item => item.id === d.id);
    d.line.hidden = !d.valid || d.slot === old;
    if (!d.line.hidden) {
      const end = d.slot === boxes.length;
      const width = Math.min(list.width,(end || d.slot === 0 ? 464 : 300) * scale);
      const left = list.left + (list.width - width) / 2;
      const height=3*scale;
      const top = d.slot === 0 ? list.top : end ? list.bottom-height
        : (boxes[d.slot - 1].bottom + boxes[d.slot].top) / 2-height/2;
      Object.assign(d.line.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
    }
  }
  function dragFrame(time) {
    const d = drag;
    if (!d?.active) return;
    const area = canvas.getBoundingClientRect(), list = questions.getBoundingClientRect();
    const dt = Math.min((time - (d.time ?? time)) / 1000,.032); d.time = time;
    if (d.x >= Math.max(area.left,list.left) && d.x <= Math.min(area.right,list.right) && d.y >= area.top && d.y <= area.bottom) {
      const band = Math.min(48,area.height / 4);
      const speed = d.y < area.top + band ? -(area.top + band - d.y) / band
        : d.y > area.bottom - band ? (d.y - area.bottom + band) / band : 0;
      canvas.scrollTop += speed * 720 * dt / dragScale();
    }
    updateDrag(); d.raf = requestAnimationFrame(dragFrame);
  }
  function beginDrag() {
    const d = drag, view = views.get(d.id);
    finishEdit();
    d.active = true;
    window.getSelection()?.removeAllRanges();
    const layer = document.createElement('div'); layer.className = 'spoiler-drag-layer'; layer.setAttribute('aria-hidden','true');
    const copy = document.createElement('div'); copy.className = 'spoiler-drag-copy';
    copy.classList.add('faq-appearance');copy.dataset.appearance=questions.dataset.appearance;
    for(const name of ['--faq-accent-width','--faq-accent-color','--faq-answer-accent-color'])copy.style.setProperty(name,getComputedStyle(questions).getPropertyValue(name));
    const clone = view.element.cloneNode(true); clone.classList.remove('is-selected');
    clone.dataset.overlay='false';clone.style.height='';clone.querySelector('.spoiler-content')?.removeAttribute('style');
    for (const node of [clone,...clone.querySelectorAll('*')]) {
      node.removeAttribute('id'); node.removeAttribute('data-spoiler-id'); node.removeAttribute('data-text-key');
      node.removeAttribute('contenteditable'); node.removeAttribute('tabindex');
      node.removeAttribute('aria-controls'); node.removeAttribute('role');
    }
    copy.style.width = view.element.offsetWidth + 'px'; copy.append(clone);
    const line = document.createElement('div'); line.className = 'spoiler-drop-line'; line.hidden = true;
    const cursor = document.createElement('img'); cursor.className = 'spoiler-drag-cursor'; cursor.src = 'assets/drag-move-cursor.svg'; cursor.alt = '';
    layer.append(line,copy,cursor); document.body.append(layer);
    Object.assign(d,{layer,copy,line,cursor});
    select(null); editor.classList.add('is-dragging-spoiler');
    document.body.classList.add('dragging-spoiler'); view.element.classList.add('is-drag-source');
    canvas.setPointerCapture(d.pointerId);
    updateDrag(); d.raf = requestAnimationFrame(dragFrame);
  }
  function endDrag(commit) {
    const d = drag;
    if (!d) return;
    if (d.active) updateDrag();
    drag = null;
    d.controller.abort(); cancelAnimationFrame(d.raf);
    if (canvas.hasPointerCapture(d.pointerId)) canvas.releasePointerCapture(d.pointerId);
    if (!d.active) return;
    suppressedDragPointer = d.pointerId;
    d.layer.remove(); document.body.classList.remove('dragging-spoiler'); editor.classList.remove('is-dragging-spoiler');
    views.get(d.id)?.element.classList.remove('is-drag-source');
    if (commit && d.valid && findItem(d.id)) {
      const before = documentSnapshot(), old = state.faq.items.findIndex(item => item.id === d.id);
      const target = d.slot > old ? d.slot - 1 : d.slot;
      if (target !== old) {
        const [item] = state.faq.items.splice(old,1); state.faq.items.splice(target,0,item);
        const scrollTop = canvas.scrollTop;
        questions.replaceChildren(...state.faq.items.map(item => views.get(item.id).element));
        properties.paint();
        canvas.scrollTop = scrollTop;
        recordChange(before);
      }
      select({type:'spoiler',id:d.id});
    } else {
      select(d.selection?.type === 'spoiler' && !findItem(d.selection.id) ? {type:'faq',id:state.faq.id} : d.selection);
    }
  }
  document.addEventListener('pointerdown',() => { if(active){suppressedDragPointer = null; questionStartedOnClick = null;} },true);
  for (const type of ['click','dblclick']) document.addEventListener(type,event => {
    if (active&&suppressedDragPointer !== null && event.detail > 0) { event.preventDefault(); event.stopImmediatePropagation(); }
  },true);
  canvas.addEventListener('pointerdown',event => {
    if(!active||standalone||demoOnly())return;
    if (drag || state.mode !== 'edit' || event.button !== 0 || !event.isPrimary || event.pointerType !== 'mouse') return;
    const item = itemAt(event.target);
    if (!item || event.target.isContentEditable || event.target.closest('.spoiler-arrow,.toolbar,a,button,input,textarea,select,[role="button"],[role="textbox"]')) return;
    event.preventDefault();
    const controller = new AbortController(), options = {capture:true,signal:controller.signal};
    drag = {id:item.id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,
      selection:structuredClone(state.selection),controller,active:false};
    document.addEventListener('pointermove',move => {
      if (!drag || move.pointerId !== drag.pointerId) return;
      if (!(move.buttons & 1)) { endDrag(false); return; }
      drag.x = move.clientX; drag.y = move.clientY;
      if (!drag.active && Math.hypot(drag.x-drag.startX,drag.y-drag.startY) >= 5) beginDrag();
      if (drag?.active) { move.preventDefault(); updateDrag(); }
    },{...options,passive:false});
    document.addEventListener('pointerup',up => {
      if (!drag || up.pointerId !== drag.pointerId) return;
      drag.x = up.clientX; drag.y = up.clientY; endDrag(true);
    },options);
    document.addEventListener('pointercancel',cancel => { if (cancel.pointerId === drag?.pointerId) endDrag(false); },options);
    document.addEventListener('lostpointercapture',lost => { if (lost.pointerId === drag?.pointerId) endDrag(false); },options);
    document.addEventListener('keydown',key => {
      if (key.key === 'Escape') { key.preventDefault(); key.stopImmediatePropagation(); endDrag(false); }
      else if (drag?.active && key.ctrlKey && ['z','y'].includes(key.key.toLowerCase())) { key.preventDefault(); key.stopImmediatePropagation(); }
    },options);
    canvas.addEventListener('scroll',updateDrag,{signal:controller.signal});
    window.addEventListener('resize',updateDrag,{signal:controller.signal});
    window.addEventListener('blur',() => endDrag(false),{signal:controller.signal});
  });
  canvas.addEventListener('dragstart',event => {
    if (drag || (state.mode === 'edit' && event.target.closest('.spoiler'))) event.preventDefault();
  });
  canvas.addEventListener('scroll',()=>syncOverlayViews(properties.settings()),{passive:true});
  window.addEventListener('resize',()=>syncOverlayViews(properties.settings()));
  document.addEventListener('keydown',event=>{
    if(!active||event.key!=='Escape'||properties.isOpen()||widgetStore?.isOpen()||session)return;
    const item=items().findLast(item=>item.open&&properties.itemSettings(item.id).reveal==='overlay');
    if(item){item.open=false;updateItem(item);renderToolbar();event.preventDefault();}
  });
  // This immutable seed is used only once per page load; working data is always cloned.
  const demoSeed = Object.freeze((standalone?config.seed:[...questions.children].map((node,index)=>({question:node.querySelector('span').textContent,answer:demoAnswers[index]||''}))).map(content=>Object.freeze({...content})));
  function makeItem(parentId,content={question:'',answer:''}){return {id:(standalone?(scenarioId==='document'?'document-spoiler-':scenarioId+'-spoiler-'):'spoiler-')+nextId++,...(!standalone?{parentId}:{}),...structuredClone(content),open:false,settings:standalone?{propertyGrid:structuredClone(initialFaqSettings?.propertyGrid||{})}:{}};}
  function makeFaq(id,empty=false){return {id,settings:structuredClone(initialFaqSettings||{reveal:'inline'}),items:demoSeed.map((content,index)=>makeItem(id,empty?{question:'',answer:'',placeholder:'Вопрос '+(index+1)}:content))};}
  function mountFaq(){
    if(demoOnly()){if(!standalone)faq.remove();insertion.hidden=true;syncDocumentLine();return;}
    if(standalone){insertion.remove();syncDocumentLine();return;}
    editor.dataset.faqPresent=String(Boolean(state.faq));
    if(state.faq){column.insertBefore(faq,insertion);faq.dataset.faqId=state.faq.id;insertion.hidden=true;}
    else {faq.remove();insertion.hidden=false;}
    widgetStore?.update();
  }
  function deleteFaq(id){
    if(state.mode!=='edit'||state.faq?.id!==id)return;
    properties.cancel();if(drag)endDrag(false);finishEdit();widgetStore.close(false);
    const before=documentSnapshot();window.getSelection()?.removeAllRanges();
    state.faq=null;for(const view of views.values())view.element.remove();views.clear();questions.replaceChildren();
    mountFaq();select({type:'insertion',id:slotId});recordChange(before);
  }
  function insertFaq(target){
    if(state.mode!=='edit'||state.faq||target?.id!==slotId)return false;
    finishEdit();const before=documentSnapshot();
    state.faq=makeFaq('faq-'+nextFaqId++,true);mountFaq();
    questions.replaceChildren(...state.faq.items.map(createView));properties.paint();
    select({type:'faq',id:state.faq.id});recordChange(before);return true;
  }
  // A restricted set; Builder retains all members of the source FAQ.
  function rebuildDemo(){
    for(const view of views.values())view.mount.remove();views.clear();
    questions.replaceChildren();demoHost.replaceChildren();demoHost.hidden=false;
    demoHost.dataset.environment=standalone?'document':'site';
    demoHost.classList.toggle('is-grouped',Boolean(state.demoSet.group));
    let groupHost=null,list=null;
    for(const item of items()){
      if(!restrictedItem(item)){
        if(!groupHost){groupHost=document.createElement('div');groupHost.className='faq-widget grouped-faq';groupHost.style.width='100%';list=document.createElement('div');list.className='questions';groupHost.append(toolbar,list);demoHost.append(groupHost);}
        list.append(createView(item));
      }else demoHost.append(createView(item));
    }
    if(!groupHost)demoHost.prepend(toolbar);
    toolbarKind=null;mountFaq();properties.paint();widgetStore?.update();
  }
  function beginStructureChange(){
    properties.cancel();finishEdit();if(drag)endDrag(false);widgetStore?.close(false);window.getSelection()?.removeAllRanges();
    return documentSnapshot();
  }
  function ungroupDemo(){
    const before=beginStructureChange();
    if(state.demoSet){
      for(const item of groupedItems()){item.demoSettings=structuredClone(state.demoSet.group.sourceStyles?.[item.id]||properties.itemSettings(item.id));delete item.parentId;}
      state.demoSet.group=null;
    }
    else{
      const source=state.faq;if(!source||!source.items.length)return;
      const {items:sourceItems,...container}=source;
      const origin={container:structuredClone(container),itemIds:sourceItems.map(item=>item.id)};
      const values=sourceItems.map(item=>{const copy=structuredClone(item);delete copy.parentId;copy.groupOriginId=source.id;copy.open=false;copy.demoSettings=structuredClone(properties.itemSettings(item.id));return copy;});
      state.demoSet={id:scenarioId+'-grouping-set',capabilities:'grouping-demo',items:values,group:null,origin};
      state.faq=null;
    }
    rebuildDemo();select(null);recordChange(before);
  }
  function groupDemo(){
    if(!groupReady())return;
    const before=beginStructureChange();
    const selected=items().filter(item=>state.selection.ids.includes(item.id)),first=items().findIndex(item=>item.id===selected[0].id),remaining=items().filter(item=>!state.selection.ids.includes(item.id));
    const origin=state.demoSet.origin;
    if(!standalone&&origin&&selected.length===origin.itemIds.length&&remaining.length===0&&selected.every(item=>item.groupOriginId===origin.container.id&&origin.itemIds.includes(item.id))){
      // Restore the real group configuration, not the effective display settings
      // of its separated items. Their original sparse overrides remain intact.
      const restoredItems=selected.map(item=>{const copy=structuredClone(item);delete copy.demoSettings;delete copy.groupOriginId;copy.parentId=origin.container.id;return copy;});
      const container={...structuredClone(origin.container),items:restoredItems};
      restoreDocument({faq:container,fields:structuredClone(state.fields)});
      select({type:'faq',id:container.id});recordChange(before);return;
    }
    const styles=new Map(selected.map(item=>[item.id,properties.itemSettings(item.id)]));
    const settings=standalone?properties.demoSettings('outline','faq'):properties.demoSettings();
    const group={id:scenarioId+'-demo-faq-'+nextFaqId++,type:'faq',settings:{propertyGrid:settings},itemIds:selected.map(item=>item.id),...(standalone?{sourceStyles:Object.fromEntries(styles)}:{})};
    state.demoSet.items=[...remaining.slice(0,first),...selected,...remaining.slice(first)];
    state.demoSet.group=group;
    for(const item of selected){item.parentId=group.id;delete item.demoSettings;const overrides={};item.settings=Object.keys(overrides).length?{propertyGridOverrides:overrides}:{};}
    if(!standalone){
      const container={id:group.id,settings:group.settings,items:selected};
      restoreDocument({faq:container,fields:structuredClone(state.fields)});
      select({type:'faq',id:container.id});recordChange(before);return;
    }
    rebuildDemo();select({type:'faq',id:group.id});recordChange(before);
  }
  function prepareGroupingDemo(){
    if(!standalone||!active)return;
    beginStructureChange();state.mode='edit';editor.dataset.mode='edit';
    const settings=properties.demoSettings('outline');
    settings.spoilerStyle.padding={top:10,right:10,bottom:10,left:10};
    settings.spoilerStyle.border.enabled=true;settings.spoilerStyle.rounding={enabled:true,value:6};
    state.document.widgets=[];state.document.insertionText='';
    state.demoSet={id:scenarioId+'-grouping-set',capabilities:'grouping-demo',group:null,items:Array.from({length:3},()=>({...makeItem(undefined,demoSeed[0]),demoSettings:structuredClone(settings)}))};
    rebuildDemo();select(null);history.past.length=0;history.future.length=0;updateHistoryButtons();
  }
  function selectDemoItem(item,event){
    if(event.ctrlKey||event.metaKey){
      const ids=new Set(state.selection?.type==='demo-multi'?state.selection.ids:state.selection?.type==='demo-single'?[state.selection.id]:[]);
      if(ids.has(item.id))ids.delete(item.id);else ids.add(item.id);
      const ordered=items().filter(item=>ids.has(item.id)).map(item=>item.id);
      select(ordered.length?{type:'demo-multi',id:state.demoSet.id,ids:ordered}:null);
    }else select({type:'demo-single',id:item.id});
    window.getSelection()?.removeAllRanges();
  }
  function renderDemoToolbar(){
    if(toolbar.parentElement!==demoHost)demoHost.prepend(toolbar);
    const type=state.selection?.type,grouped=type==='demo-group',multi=type==='demo-multi'&&(state.selection.ids.length>1||!standalone&&items().length===1);
    const kind=type&&type.startsWith('demo-')?(grouped?'demo-group':multi?'demo-multi':'demo-single'):null;
    if(kind!==toolbarKind){
      const entries=grouped?[['Назад','parent','E9A9'],['Добавить','add','EB25'],['Оформление','appearance','EBBB'],['Раскрытие','reveal','reveal'],['Текст','typography','EAC9'],['Настройки','properties','E75D'],['Удалить','delete','EB72'],['Ещё','menu','EAB4']]:multi?[...(!standalone?[['Назад','parent','E9A9']]:[]),['Сгруппировать','group','group'],['Удалить','delete','EB72'],['Ещё','menu','EAB4']]:[...(!standalone?[['Назад','parent','E9A9']]:[]),['Открыть','open','E9E6'],['Оформление','appearance','EBBB'],['Раскрытие','reveal','reveal'],['Текст','typography','EAC9'],['Настройки','properties','E75D'],['Удалить','delete','EB72'],['Ещё','menu','EAB4']];
      toolbar.replaceChildren(...entries.map(([label,command,glyph])=>{
        const button=document.createElement('button');button.type='button';button.className='toolbar-button';button.dataset.command=command;button.setAttribute('aria-label',label);
        if(['group','reveal'].includes(glyph))button.innerHTML='<img class="demo-command-icon" src="assets/'+(glyph==='group'?'pg-menu-group':'faq-expand')+'.svg" alt="">';
        else {const icon=document.createElement('i');icon.textContent=String.fromCodePoint(parseInt(glyph,16));icon.setAttribute('aria-hidden','true');if(command==='delete')icon.className='danger';button.append(icon);}
        if(command==='open'){button.classList.add('spoiler-toggle-label');const text=document.createElement('span');text.textContent=label;button.append(text);}
        button.title=command==='menu'?label:command==='group'?'Выберите все разгруппированные спойлеры':'Недоступно в демонстрационном наборе';
        return button;
      }));toolbarKind=kind;
    }
    toolbar.hidden=!kind;toolbar.inert=state.mode!=='edit'||!kind;toolbar.dataset.context=kind||'none';toolbar.dataset.ownerId=state.selection?.id||'';
    const group=toolbar.querySelector('[data-command=group]');if(group){group.disabled=!groupReady();group.title=groupReady()?'Сгруппировать':'Выберите все разгруппированные спойлеры';}
    positionToolbar();
  }
  if(standalone){state.document.widgets=demoSeed.map(content=>makeItem(undefined,content));state.selection=widgetSelection(items()[0].id);}
  else state.faq=makeFaq('faq-main');
  if(standalone)for(const item of items())questions.append(createView(item));else questions.replaceChildren(...items().map(createView));
  properties.initialize();
  initialFaqSettings=structuredClone(owner()?.settings||{});
  widgetStore=standalone?{close(){},update(){},isOpen:()=>false}:window.createWidgetStore({editor,insertion,getMode:()=>state.mode,getTarget:()=>!state.faq&&!demoOnly()?{id:slotId}:null,
    beforeOpen(){properties.cancel();finishEdit();if(drag)endDrag(false);},insert:insertFaq,isEditorOpen:()=>properties.isOpen()});
  mountFaq();
  if(!standalone)canvas.querySelectorAll('h1,h2,h3,.company-copy p,.contact-details b,.contact-details span').forEach((field,index) => {
    field.dataset.textKey = 'text-' + index; state.fields[field.dataset.textKey] = field.textContent;
  });
  editor.addEventListener('pointerdown',event => {
    if (session && !session.field.contains(event.target)) finishEdit();
  },true);
  editor.addEventListener('click',event => {
    const action = event.target.closest('[data-action]');
    if (action) {
      if (action.dataset.action === 'undo' || action.dataset.action === 'redo') {
        if (!action.disabled) changeHistory(action.dataset.action);
      } else if (action.dataset.action === 'preview' && state.mode === 'edit') setMode('preview');
      else if (action.dataset.action === 'edit' && state.mode === 'preview') setMode('edit');
      return;
    }
    if (toolbar.contains(event.target)) {
      const button = event.target.closest('[data-command]');
      if (state.mode === 'edit' && state.selection && button && !button.disabled) {
        const command = button.dataset.command, id = toolbar.dataset.ownerId;
        if (id === state.selection.id) {
          runCommand(command,{...commandContext(),id});
        }
      }
      event.stopPropagation(); return;
    }
    if (!canvas.contains(event.target)) return;
    if(demoOnly()&&(!itemAt(event.target)||nonEditableItem(itemAt(event.target)))){
      const item=itemAt(event.target);
      if(state.mode==='edit'){if(item&&state.demoSet.group?.itemIds.includes(item.id))select({type:'faq',id:state.demoSet.group.id});else if(item)selectDemoItem(item,event);else if(state.demoSet.group&&event.target.closest('.grouped-faq'))select({type:'faq',id:state.demoSet.group.id});else select(null);}
      event.stopPropagation();return;
    }
    if(documentLine?.contains(event.target))return;
    if(insertion.contains(event.target)){select({type:'insertion',id:slotId});return;}
    const item = itemAt(event.target);
    if (state.mode === 'edit') {
      if (item) {
        if (session?.field === event.target || session?.field.contains(event.target)) return;
        const fromStack=state.selection?.type==='stack';
        const wasSelected = state.selection?.type === widgetSelection(item.id).type && state.selection.id === item.id;
        select(widgetSelection(item.id));
        if(fromStack)window.getSelection()?.removeAllRanges();
        if (event.target.closest('.spoiler-arrow')) toggle(item);
        else if (!fromStack && event.target.closest('.answer-editor')) startEdit(event.target.closest('.answer-line') || views.get(item.id).answer.lastElementChild);
        else if (wasSelected && event.target.closest('.question-text')) {
          const field = views.get(item.id).question;
          editQuestionAt(field,event); questionStartedOnClick = field;
        }
        event.stopPropagation(); return;
      }
      // Preserve container selection by clicking its existing free area / list gaps.
      select(activeGroup()&&(faq.contains(event.target)||event.target.closest('.grouped-faq')) ? {type:'faq',id:activeGroup().id} : null);
    } else if (item && event.target.closest('.question-row') && window.getSelection()?.type !== 'Range') toggle(item);
  });
  canvas.addEventListener('dblclick',event => {
    if (nonEditableItem(itemAt(event.target))||state.mode !== 'edit') return;
    const item = itemAt(event.target);
    if (item) {
      const field = event.target.closest('.question-text');
      if (field) {
        select(widgetSelection(item.id));
        if (!field.isContentEditable || questionStartedOnClick === field) editQuestionAt(field,event);
        questionStartedOnClick = null;
      }
      event.stopPropagation(); return;
    }
    const field = event.target.closest('[data-text-key]');
    if (field) startEdit(field);
  });
  canvas.addEventListener('keydown',event => {
    if(nonEditableItem(itemAt(event.target)))return;
    if (session?.field === event.target) {
      if (event.isComposing) return;
      if (event.key === 'Enter' && event.target.matches('.question-text')) {
        event.preventDefault(); finishQuestion(event.target); return;
      }
      if (event.key === 'Backspace' && removeEmptyAnswerLine(event.target)) event.preventDefault();
      if (event.key === 'Escape') { event.preventDefault(); finishEdit(true); }
      return;
    }
    const item = itemAt(event.target);
    if (!item || !['Enter',' '].includes(event.key)) return;
    const v = views.get(item.id);
    if ((state.mode === 'edit' && event.target === v.arrow) || (state.mode === 'preview' && event.target === v.row)) {
      event.preventDefault(); toggle(item);
    }
  });
  canvas.addEventListener('input',event => {
    if (state.mode === 'edit' && session?.field === event.target) {
      if (event.target.matches('.answer-line')) ensureAnswerLines(event.target.parentElement);
      setText(session.field,readInput(session.field)); syncCarets();
      updateHistoryButtons();
    }
  });
  canvas.addEventListener('focusin',event => {
    if (!nonEditableItem(itemAt(event.target))&&state.mode === 'edit' && event.target.matches('.answer-line')) {
      const item = itemAt(event.target);
      select(widgetSelection(item.id)); startEdit(event.target);
    }
  });
  canvas.addEventListener('focusout',event => { if (session?.field === event.target) finishEdit(); });
  canvas.addEventListener('beforeinput',event => {
    if (nonEditableItem(itemAt(event.target))||state.mode === 'preview') event.preventDefault();
    else if (session?.field === event.target && event.target.matches('.question-text')
      && !event.isComposing && ['insertParagraph','insertLineBreak'].includes(event.inputType)) {
      event.preventDefault(); finishQuestion(event.target);
    }
    else if (event.target.matches('.answer-line') && ['insertParagraph','insertLineBreak'].includes(event.inputType)) {
      event.preventDefault(); splitAnswerLine(event.target);
    } else if (event.inputType === 'deleteContentBackward' && removeEmptyAnswerLine(event.target)) {
      event.preventDefault();
    }
  },true);
  canvas.addEventListener('paste',event => {
    if (state.mode !== 'edit' || !event.target.matches('.answer-line')) return;
    event.preventDefault(); splitAnswerLine(event.target,event.clipboardData.getData('text/plain'));
  });
  for (const type of ['paste','drop']) canvas.addEventListener(type,event => {
    if (state.mode === 'preview') event.preventDefault();
  },true);
  document.addEventListener('keydown',event => {
    if (!active || state.mode !== 'edit' || event.isComposing || !event.ctrlKey || event.altKey || event.metaKey) return;
    const field = event.target;
    if (field.isContentEditable || field.closest('input,textarea,select')) return;
    const key = event.key.toLowerCase();
    const direction = key === 'z' ? (event.shiftKey ? 'redo' : 'undo') : key === 'y' && !event.shiftKey ? 'redo' : null;
    if (!direction) return;
    event.preventDefault(); changeHistory(direction);
  });
  select(state.selection);
  updateHistoryButtons();
  // The Figma launch view starts 200px above this section inside the canvas.
  const positionDemo=()=>{if(!standalone)canvas.scrollTop=editor.querySelector('section.faq').offsetTop-200;};
  positionDemo();document.fonts.ready.then(positionDemo);
  return {prepareGroupingDemo,deactivate(){finishEdit();documentLine?.firstElementChild.blur();insertionTarget=null;properties.cancel();widgetStore.close(false);if(drag)endDrag(false);savedScroll=canvas.scrollTop;suppressedDragPointer=null;window.getSelection()?.removeAllRanges();active=false;},activate(){active=true;if(savedScroll!==null)canvas.scrollTop=savedScroll;properties.paint();renderToolbar();updateHistoryButtons();},snapshot:documentSnapshot};
};
window.siteScenario=window.createWidgetScenario();
