// One panel, one insertion context; cards reuse the document's FAQ factory.
window.createWidgetStore=function(api){
  const {editor,insertion}=api,oldSidebar=editor.querySelector('.right-sidebar');
  const sidebar=document.createElement('aside');sidebar.className='right-sidebar';sidebar.setAttribute('aria-label','Панели редактора');
  const icon=(glyph,large=true)=>`<i class="${large?'icon24':''}" aria-hidden="true">&#x${glyph};</i>`;
  const sidebarItems=[['Виджеты','eadd'],['Данные','ebdf'],['Источники данных','ebbc'],['Структура','ebf9'],['Стиль','ebbb'],['Шрифт','eac9'],['Настройки','eaa9']];
  sidebar.innerHTML=`<nav class="editor-sidebar">${sidebarItems.map(([label,glyph],index)=>`<button type="button" ${index===0?'data-store-toggle aria-controls="widget-store" aria-expanded="false"':'title="Пока не реализовано"'} aria-label="${label}">${icon(glyph)}</button>`).join('')}<button class="sidebar-help" type="button" aria-label="Помощь" title="Пока не реализовано"><img src="assets/store-help.svg" alt=""></button></nav><img class="preview-sidebar" src="assets/b65fe.png" alt="">`;
  oldSidebar.replaceWith(sidebar);
  const panel=document.createElement('section');panel.id='widget-store';panel.className='widget-store';panel.hidden=true;panel.setAttribute('aria-label','Магазин виджетов');
  const small=[['Строки','eac3'],['Колонки','eaee'],['Сетка','ea80']],medium=[['Текст','eac9'],['Заголовок','ebd3'],['Кнопка','eb7e'],['Изображение','e9a3'],['Видео','ebe0'],['Вопрос-ответ','e68b']];
  const previews=[
    ['Наценка','Контролируйте наценку в организации','markup',50],
    ['Номенклатура','Отображаются самые продаваемые товары и услуги за выбранный период','catalog',194],
    ['Остаток','Контролируйте сумму остатка на складах','markup',50],
    ['Отчеты','Контролируйте движение товара, выручку и остатки на складах','reports',194],
    ['Продажи','Отображаются сводные показатели продаж и сравниваются с предыдущим периодом','sales',194],
    ['Точки продаж','Виджет отображения сводных показателей продаж по организациям и точкам продаж','points',194],
    ['Отчеты CRM','','crm',283]
  ];
  const compact=(entry,size)=>`<button type="button" class="store-card store-${size}" data-store-name="${entry[0]}" ${entry[0]==='Вопрос-ответ'?'data-store-insert':'title="Пока не реализовано"'} aria-label="${entry[0]}">${icon(entry[1],size==='small')}${size==='medium'?`<span>${entry[0]}</span>`:''}</button>`;
  panel.innerHTML=`<header class="store-header"><h2>Виджеты</h2><input type="search" aria-label="Найти виджет" placeholder="Найти" autocomplete="off"></header><div class="store-scroll"><div class="store-small-grid">${small.map(e=>compact(e,'small')).join('')}</div><div class="store-medium-grid">${medium.map(e=>compact(e,'medium')).join('')}</div><section class="store-demo-section"><h3>Каталог и цены</h3>${previews.map((p,index)=>`${index===6?'</section><section class="store-demo-section"><h3>CRM</h3>':''}<button type="button" class="store-large" data-store-name="${p[0]}" title="Пока не реализовано"><span class="store-name">${p[0]}${[4,5].includes(index)?'<span class="store-tag">'+icon('e75e',false)+'</span>':''}</span>${p[1]?`<span class="store-description">${p[1]}</span>`:""}<span class="store-preview store-preview-${p[2]}" style="height:${p[3]}px"><img src="assets/store-${p[2]}.png" alt=""><span class="store-preview-add">${icon('eae9')}</span></span></button>`).join('')}</section><p class="store-no-results" hidden>Ничего не найдено</p></div>`;
  editor.append(panel);
  const toggle=sidebar.querySelector('[data-store-toggle]'),search=panel.querySelector('input'),add=panel.querySelector('[data-store-insert]');
  let target=null,opener=null;
  function update(){
    const available=Boolean(target&&api.getTarget()?.id===target.id);
    add.disabled=!available;add.title=available?'Добавить Вопрос-ответ':'Место занято. Сначала удалите FAQ';
    toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.classList.toggle('is-active',!panel.hidden);
    toggle.setAttribute('aria-disabled',String(!api.getTarget()));
    toggle.title=api.getTarget()?'Открыть магазин виджетов':'Место занято. Сначала удалите FAQ';
  }
  function filter(){
    const query=search.value.trim().toLocaleLowerCase('ru').replace(/[–—]/g,'-');
    let count=0;for(const card of panel.querySelectorAll('[data-store-name]')){card.hidden=!card.dataset.storeName.toLocaleLowerCase('ru').includes(query);if(!card.hidden)count++;}
    for(const section of panel.querySelectorAll('.store-demo-section'))section.hidden=![...section.querySelectorAll('[data-store-name]')].some(c=>!c.hidden);
    panel.querySelector('.store-no-results').hidden=count!==0;
  }
  function close(focus=true){if(panel.hidden)return;panel.hidden=true;target=null;update();if(focus&&opener?.isConnected)opener.focus({preventScroll:true});opener=null;}
  function open(source){if(api.getMode()!=='edit'||!api.getTarget())return;api.beforeOpen();target=api.getTarget();opener=source;search.value='';filter();panel.hidden=false;update();search.focus({preventScroll:true});}
  toggle.addEventListener('click',()=>panel.hidden?open(toggle):close());
  insertion.querySelector('[data-store-open]').addEventListener('click',event=>open(event.currentTarget));
  add.addEventListener('click',()=>{const context=target;if(add.disabled||!context)return;if(api.insert(context))close(false);else update();});
  search.addEventListener('input',filter);
  // The shop is clipped, without scrolling; wheel events must not move the canvas behind it.
  for(const surface of [panel,sidebar,insertion])for(const name of ['pointerdown','click','dblclick'])surface.addEventListener(name,event=>event.stopPropagation());
  panel.addEventListener('wheel',event=>{event.preventDefault();event.stopPropagation();},{passive:false});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden&&!api.isEditorOpen()){event.preventDefault();event.stopImmediatePropagation();close();}},true);
  return {open,close,update,isOpen:()=>!panel.hidden};
};
