// Real cbuc-icons24 glyphs from Figma 3051:207912; unknown names stay searchable by code.
window.faqIconCatalog=[
  {
    "title": "",
    "codes": [
      "E96D",
      "E96E",
      "EB8A",
      "EB89",
      "E9AA",
      "E9A8",
      "E6A7",
      "E9B1"
    ]
  },
  {
    "title": "Люди",
    "codes": [
      "E9A7",
      "E92D",
      "E92E",
      "E92F",
      "E926",
      "E6A9",
      "E6AA",
      "E6AB",
      "E6AC",
      "E6AD",
      "E6AE",
      "E6AF",
      "E6B0",
      "E6B1",
      "E6B2",
      "E6B3",
      "E6B4",
      "E6B5",
      "E6B6",
      "E6B7",
      "E6B8",
      "E6B9",
      "E6BA",
      "E6BB",
      "E6BC",
      "E6BD",
      "E6BE",
      "EB6F"
    ]
  },
  {
    "title": "Статусы пользователя",
    "codes": [
      "EB3E",
      "EAAA",
      "EA1C",
      "EA1F",
      "E96A",
      "E949",
      "E94A",
      "E94B",
      "E931",
      "E932",
      "E933",
      "E934",
      "E935",
      "E936",
      "E937",
      "E938",
      "E939",
      "E93A",
      "E93B",
      "E93C",
      "E93D",
      "E93E",
      "E93F",
      "E940",
      "E941",
      "E942",
      "E943",
      "E944",
      "E945",
      "E67E",
      "E618",
      "E620"
    ]
  }
];
window.createIconPicker=function({openChoice,closeChoice}){
 const aliases={E96D:'Стрелка вниз',E96E:'Стрелка вправо',EB8A:'Угол вниз',EB89:'Угол вправо',E9AA:'Шеврон вниз',E9A8:'Шеврон вверх',E6A7:'Ссылка',E9B1:'Скрепка'};
 return function({anchor,current,onChoose}){
  const groups=window.faqIconCatalog;
  openChoice({kind:'icon-picker',title:'Выбор иконки',width:312,anchor,offsetY:28,
   html:'<header class="pg-icon-search"><input aria-label="Найти иконку" placeholder="Найти"><button type="button" disabled title="Загрузка файла пока не подключена"><i class="icon24">\uE9B1</i></button><button type="button" data-aux-cancel aria-label="Закрыть выбор иконки"><i>\uE66C</i></button></header><div class="pg-icon-browser"><div class="pg-icon-groups">'+groups.map((g,index)=>'<section>'+ (g.title?'<p>'+g.title+'</p>':'')+'<div class="pg-icon-grid">'+g.codes.map(code=>'<button type="button" data-icon-code="'+code+'" data-icon-name="'+(aliases[code]||'Иконка '+code)+' '+g.title+'" title="'+(aliases[code]||'Иконка '+code)+'" aria-label="'+(aliases[code]||'Иконка '+code)+'" aria-pressed="'+(current?.code===code)+'"><i class="icon24">&#x'+code+';</i></button>').join('')+'</div></section>').join('')+'</div><aside class="pg-icon-categories" aria-label="Категории пока недоступны">'+['EB6F','E6A9','EAAA','E67E','E618','E620','E66F','E695','EAB4'].map(code=>'<button type="button" disabled title="Будет подключено следующим этапом"><i class="icon24">&#x'+code+';</i></button>').join('')+'</aside></div>',
   click:event=>{const code=event.target.closest('[data-icon-code]')?.dataset.iconCode;if(code){onChoose({code,font:'cbuc-icons24'});closeChoice(false);}},
   input:event=>{const query=event.target.value.trim().toLowerCase();for(const button of event.currentTarget.querySelectorAll('[data-icon-code]'))button.hidden=!(button.dataset.iconCode+' '+button.dataset.iconName).toLowerCase().includes(query);}
  });
 };
};

