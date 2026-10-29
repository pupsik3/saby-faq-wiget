# Каталог переиспользуемых элементов

## Последнее уточнение текстовой группировки

Уточнение 28.10.2026: в отдельном сценарии «Три спойлера для группировки» функциональны только выбор, Ctrl/Cmd-выделение, группировка/разгруппировка и их Undo/Redo. У группы и её детей отключены ввод, раскрытие, PG, типографика, пресеты и структурные команды добавления/удаления; видимые команды остаются заглушками. Тулбар FAQ в этом текстовом окружении без первой команды «Назад». При группировке применяется существующий FAQ-пресет «В рамке»: общая рамка1px, радиус8px, внутренние разделители, отступы12px; отдельные рамки строк не дублируются. При разгруппировке возвращается исходное оформление самостоятельных спойлеров (рамка1px/радиус6px/отступы10px). ID, содержимое и порядок сохраняются. Полноценный FAQ Конструктора после обратной группировки и основной одиночный спойлер не ограничиваются этим правилом.

Описание ниже отражает предыдущие этапы; при расхождении действует это уточнение.

## FUNC-033 — структурные демонстрации

Последнее уточнение28.10: Builder groupDemo использует restoreDocument для возврата в обычный state.faq/DOM/общие обработчики; никаких ограничений demoSet после обратной группировки нет. Документ сохраняет эффективный стиль через makeOverrides на основе прежних changedPaths/individualBase/leaves/allowedPath. demoSettings теперь нормализует appearance ID. buildDocument(id) создаёт независимые document/document-grouping через одну реализацию; documents Map обслуживает переключение трёх runtime. Актуальный одиночный тулбар3114:146414: back + standalone-команды, без add.

Уточнение28.10: grouped-faq получает адаптер существующего PG (getOwner/getFaq/faqElement/isStandalone), полноценные общие/индивидуальные настройки и обычный paint. Ограничение остаётся у отдельных элементов вне группы; новый редактор не создавался. Defaults берутся из нормализованной общей фабрики, gap8px. Стандартный menuMarkup скрывает экспандер при одной исходной команде. В системном блоке остаётся действие, без дополнительной радиогруппы. Пустая обёртка скрывается, positionToolbar компенсирует реальную границу и обновляется после paint; закрытие очищает Range из ответа.

- makeItem/createView/startEdit и существующие текстовые группы — новый самостоятельный спойлер из фиксированной строки, без второго рендерера.
- document-insertion-line — один явно адресуемый слот документа с простым вводом/маской и визуальными компактными кнопками. Верхняя команда EA47 — единственный новый рабочий вход вставки.
- demoSet/capabilities grouping-demo — ограниченный трёхэлементный набор; renderDemoToolbar конфигурирует прежний DOM тулбара, общий runCommand обрабатывает разрешённые действия. Выбор и служебная заливка не меняют данные оформления.
- Общие paintGroup/effectiveSettings получают сохранённое эффективное оформление демонстрационного элемента. Те же строки menuMarkup и оболочка openChoice обслуживают массовое меню; openMenuFor принимает явный контекст ID без PG. Оригинальная иконка группировки — assets/pg-menu-group.svg.
- Снимки documentSnapshot/restoreDocument включают структуру набора и текст фиксированной строки; отдельной истории нет. Подробности и ограничения — [grouping-demo.md](grouping-demo.md).

## Уточнение28.10 — общий reset и lifecycle

- defaultResetDraft/resetAvailable: одна область и канонические значения для кнопки сброса и действия. Сравнение changedPaths/individualBase/normalized; updateResetAvailability обновляет шапку без замены активного поля. Индивидуальный reset наследует FAQ.
- discardEmptyAnswerTail: при закрытии удаляет только хвостовые пустые строки и соответствующие no-op исторические копии этого ID, сохраняя внутренние пустые абзацы/обычный Enter пока открыт.
- context-menu: список без scroll, позиционирование по фактической полной высоте; при раскрытии поднимается выше при необходимости. Общий renderer сохраняется.

## Уточнения28.10

- PG .pg-label и соседний .pg-link используют24px line-height; alignLabels и независимые ширины групп сохранены. Для outline чипса dividers отсутствует.
- buttonState(active,true) берёт hover-оформление, сохраняя active.icon; paint поддерживает существующую структуру border, без нового редактора. Общие размеры не меняются.
- Overlay autoPadding определяется собственными spoilerStyle.padding, без структурного отступа акцентной линии;12px компенсируются наружным положением поверхности. Собственная рамка/радиус не запрещают автоматические поля при пустом фоне/нулевых отступах.
- Реальные FAQ .answer-line имеют одинаковую геометрию в edit/preview; документ использует прежнюю свою конфигурацию. Сайдбар FAQ использует центрирование44px внутри54px по образцу документа.

## Уточнение превью

sampleList сохраняет ответ; только standalone filled/outline ограничиваются CSS line-clamp:2 внутри окна оформления, прочие standalone образцы —3 строки. .document-editor .question-row выравнивает заголовок и кнопку по центру. Сборщик GIF использует одно расписание для FAQ и документа, циклически сдвинутое на открытый Step2; chooseReveal задаёт новый run URL на каждый вход. Reduced-motion fallback теперь отдельный открытый PNG для inline/overlay. Данные виджета не меняются.

## Уточнение компонентов FUNC-032

- ensureAnswerLines/splitAnswerLine: единая логика FAQ и standalone, без автоматического хвостового placeholder при открытии.
- menuFor/menuCount: standalone4/11 без add/ungroup; отдельно разрешены appearance/reveal. FAQ и nested сохранили прежний состав.
- build-reveal-previews.cjs: --standalone меняет текст, количество элементов, высоту125px и prefix document-reveal; обычный вызов сохраняет прежнюю сборку FAQ132px. Один GIF-рендерер picture с reduced-motion fallback обслуживает оба контекста.
- Центрирование appearance и геометрия шапки/панели ограничены scenario-shell.css, общие FAQ-токены не менялись.

## Дополнение FUNC-032

- scenario-shell.js/css: внешняя оболочка1900×900, системный выбор и статическое окружение документа; продукт1600×900, одна шкала frame-fit.js.
- createWidgetScenario: параметры editor/id/context/seed/modeChanged; возвращает activate/deactivate/snapshot. Повторно использует createView, ввод, раскрытие/overlay, toolbar/menu dispatcher, makeItem, историю.
- createFaqPropertyGrid: совместимые getOwner/getItems/isStandalone/isActive/scenarioId; общий color/typography/button/size/styleCard/chips и привязка текущего transaction. standaloneMain отличается составом, а не обработчиками; образец оформления параметризован одним элементом и текстом документа.
- Новые assets/document-*.svg и scenario-*.svg — оригинальные Figma-векторы; две кнопки размера шапки PG кнопки пока disabled. Подробнее: [контексты и ограничения](scenarios.md).

## Магазин и область вставки — FUNC-031

- createWidgetStore(api) в widget-store.js: один слой, sidebar toggle, search/filter, compact/large card renderers, состояния, локальный scroll, Escape и цель вставки. API getMode/getTarget/beforeOpen/insert/isEditorOpen. Только insert вызывает документную команду; карточки-заглушки остаются без side effects.
- makeItem/makeFaq в preview.js: общая структура для стартовой демонстрации, нового пустого FAQ и добавления спойлеров. mountFaq переключает общий DOM-адаптер между FAQ и областью вставки. PG, typography, button/color, D&D, selection и история прежние.
- Nullable document.faq и снимки истории поддерживают отсутствие FAQ без скрытого активного объекта. PG commonSettings/itemById/paint/open допускают отсутствие владельца. Открытие новой панели завершает старый сеанс, обработчики не пересоздаются при добавлении FAQ.
- widget-store.css задаёт геометрию внутри существующего масштабируемого editor. assets/store-* — оригинальные локальные миниатюры и SVG; шрифтовые иконки берутся из уже подключённых ресурсов. Полный контракт — demo-startup.md.

## Поверхность оверлея — FUNC-030

`renderOpenState` обновляет DOM открытости без отдельного paint, `setOpen/keepOneOverlayOpen` оставляют один открытый элемент в overlay. `syncOverlayViews(settings,painted=false)` переиспользует живой content и эффективное оформление выбранного ID. PG paint передаёт true для обновления кеша; scroll/resize — false. Кеш хранит фон, границы, padding, радиус и shadow до временного скрытия родительской поверхности. Вопрос сохраняет геометрию, закрытая высота удерживает поток, длинный ответ прокручивается отдельно. Закрытие очищает временные стили; модель/история не дублируются. CSS переносит акцент всего спойлера на открытую поверхность.

## Меню обоих типов и команды — FUNC-029

- `menuItems` — единые записи command/label/glyph, `menuFor(context)` задаёт состав faq/spoiler; один menuMarkup/openMenu, те же стили/ресурсы/события. `choice.context` — immutable type/id/parentId, collapsedHeight — исходная высота типа, независимо от expanded.
- `runCommand(command,context,source)` в preview.js — общий вход для тулбаров и разрешённых пунктов меню. `canMenuCommand` содержит отдельные allowlist для faq/spoiler; `hasCommandTarget` проверяет target/parent, stale selection не используется для действия. Add принимает context, остальные существующие команды сохранены.
- API PG получил canMenuCommand/hasCommandTarget/runCommand. Рабочий пункт сохраняет context перед cancel, затем вызывает API; редакторы якорятся к своей реальной toolbar-кнопке. Заглушки только показывают «Пока не реализовано», без side effects. Нового renderer/обработчиков/истории нет.

## Новый вход T спойлера — FUNC-028

`data-command=typography` назначен также команде «Текст» тулбара спойлера. Тот же open('typography',anchor) допускает faq/spoiler, фиксирует ID через getSelection; entry.kind определяет прямое закрытие с отменой, transaction.type — область сохранения. Ни дополнительных слоёв, ни обработчиков, ни рендера окна не добавлено. Группы textStyle/chooseTextStyle/chooseColor, numeric/format/reset, position и sparse save/history полностью прежние. Проверки — verify-spoiler-toolbar-text.cjs и старые проверки прямых окон/PG спойлера.

## Конфигурация выбранного спойлера — FUNC-027

- `open('properties', anchor)` определяет faq/spoiler из выбранного stable ID; один shell/transaction/набор обработчиков. `spoilerMain()` компонует существующие строки, `buttonRow`, `dimensions(...,{drillDown:false,width,height})`, `spoilerInset`, `styleCard('spoiler')`, чипсы. Настройки размера не подключены.
- `effectiveSettings(item)` / `individualBase` / `writeIndividual` — адаптер общих фактических значений и разреженных путей индивидуальных правок. `markCommon`/`replaceCommonOverrides` реализуют согласованную замену общего свойства; отдельной истории нет. Контекст type/id хранится только в текущем сеансе.
- `textStyle`, `button`, `chooseColor`, `chooseTextStyle`, icon picker переиспользованы без копий. Сброс цвета параметризован источником FAQ/родитель, состояние кнопки сохраняет прежний resolver. Новые изображения/шрифты/CSS-оболочки не создавались.
- `styleScope` направляет одни команды border/radius/line/background в faqStyle или spoilerStyle владельца. `supportsButton` скрывает всю строку для редакторской hover-кнопки ссылки; скрытые поля не создаются. Стиль вопроса не меняет эту возможность.

## Служебная геометрия и PG toggle — FUNC-026

- alignGuides() — общий горизонтальный guide inset относительно колонки, компенсирует scale/реальные border/padding без изменения модели; вызывается после paint.
- api.toggleView(stableId) — адаптер прежнего toggle(item,preserveSelection) в preview.js; PG capture-события arrow click/Enter/Space вызывают его, не меняя владельца редактора. Остальные сценарии раскрытия используют прежнее поведение выбора.

## Окна оформления и режима — визуальная итерация 29.10.2026

Актуальные источники Figma: FAQ [оформление](https://www.figma.com/design/MYCyMLOEym31Xsy93kVntt?node-id=3132-216583), [режим](https://www.figma.com/design/MYCyMLOEym31Xsy93kVntt?node-id=3132-216662); самостоятельный спойлер [оформление](https://www.figma.com/design/MYCyMLOEym31Xsy93kVntt?node-id=3132-216814), [режим](https://www.figma.com/design/MYCyMLOEym31Xsy93kVntt?node-id=3132-216724). Состояния: соответственно3132:219823,3132:219839,3132:219807,3132:219870 того же файла.

Одна общая реализация chooseAppearance/chooseReveal для тулбара, меню и PG. Оформление:916×564 FAQ и916×450 спойлер, padding12, сетка2×3 с gap12, превью440×172/134. Режим:724×261 FAQ и724×252 спойлер, padding8/16/16, две колонки340 с gap12; подписи16/14, заголовок14. Фон #f3f4f8, радиус16, тень0/4/18 #0000001f, close28 вынесен на14 вправо. Окна центрируются в продуктовом1600×900 и используют прежний общий масштаб/ограничение видимой области.

Рамка превью — отдельный абсолютный слой: обычная прозрачная, hover #7b62f899, текущий выбор #7b62f8. При hover невыбранного варианта поверх центра превью появляется круг36 #eeebff с глифом E616 размером24 цвета #5a49ab; pointer-events:none. У выбранной карточки нет состояния active-hover: при наведении её сплошная рамка не меняется, галочка не появляется. Галочка не занимает место и не имеет собственного обработчика. aria-pressed остаётся источником индикации текущего draft-выбора. Нейтральный12px ресурс в подписи режима сохранён; старые hover/selected маркеры в подписи больше не используются.

Демонстрационные превью отделены от применяемых presetValues: в standalone-превью акцентного стиля есть линия, у рамочного — разделитель из нового Figma, хотя реальные настройки этих пресетов не менялись. Текст превью и CSS-clamp не попадают в данные. Новый SVG pg-choice-answer-divider.svg используется только в standalone-карточке оформления. Close и нейтральный маркер повторно использованы: их SHA256 совпал с новыми ресурсами Figma.

Контракт поведения сохранён: hover/открытие/закрытие не меняют документ и историю; прямой выбор сохраняет и закрывает одну транзакцию, выбор из PG меняет его черновик и возвращает к родителю. applyAppearance, presetValues, finishSelection, обработчики сохранения/отмены/истории и механика реальных режимов не изменялись. Состав и ID6 пресетов/2 режимов прежние. Вложенные вопросы и ограниченные элементы не получили новых редакторов.

`build-reveal-previews.cjs` — существующий генератор GIF с локальными шрифтами, теперь20 шагов smoothstep раскрытия и обратные кадры; паузы1600/2400ms, цикл5170ms. Общая палитра GIF предотвращает изменение цветов между кадрами. Runtime-таймеров/симуляций в приложении нет; reduced-motion использует прежний poster. Параметры выбраны под просьбу пользователя, авторский motion Figma не заявляется.

## Прямые входы тулбара — FUNC-024

- `open(kind, anchor)`: properties/appearance/reveal/typography/menu, один transaction и слой. `entry` — контекст возврата, не копия данных; `surfaceChanged(kind)` обновляет исходную кнопку.
- `textStyle(label)` — общие группы полной/сокращённой типографики; `chooseTextStyle(anchor,key)` и `chooseColor(key,anchor)` привязаны к question/answer. `numberField`/data-text-size — размер с валидацией. Выбор гарнитуры отсутствует.
- `menuItems/menuMarkup` — одна строка меню с label/glyph/danger; разрешённые команды подключены через dispatcher FUNC-029, остальные — заглушки. Фокус, expander и закрытие рабочие. Четыре оригинальных SVG экспандера, исходные reveal/ungroup SVG.
- Позиция typography измеряет центр Back-иконки; меню — центр колонки иконок (32px). Меню сохраняет верх при раскрытии, прокручивает список; close/footer доступны вне него.

- property-grid.js: createFaqPropertyGrid(api), общая оболочка, шапка/возврат, навигация, один draft и история через API документа.
- openChoice/closeChoice/positionChoice: один вспомогательный слой, scale/viewport, Escape, отмена и возврат фокуса; callbacks click/input/confirm/cancel.
- colorControl/chooseColor: один редактор HEX/opacity/палитры для вопроса, разделителей, фона FAQ, цвета иконки и фона кнопки. Вложенный сеанс отменяет только свою правку; настройки привязки — в chooseColor.
- numberField и общий обработчик input: числовая валидация без потери каретки; составные dimensionField используются также в кнопке. Не все числовые поля доступны по текущему макету.
- chips/action: общие чипсы и команды; скругление кнопки добавляется с 6 px. Фон не является чипсой.
- icon-picker.js: createIconPicker({openChoice,closeChoice}); открытие {anchor,current,onChoose}. Реальный каталог faqIconCatalog, поиск по коду/словам. 68 образцов cbuc-icons24; категории, недавние и загрузка disabled.
- property-grid.css: общие pg-shell, pg-back, pg-reset, pg-save, pg-close, pg-toggle, pg-tabs, поля/чипсы и карточки. Уточнения кнопки ограничены data-level=button.

Это каталог существующих частей прототипа, а не новая универсальная библиотека. Контракты расширения — в settings-architecture.md.

Уточнение кнопки PG: образец выбора имеет постоянные 24/16px независимо от document iconSize. Скругления используют оригинальный pg-b974b.svg 12px; pg-a5451.svg 6px используется только для двух углов у замочка. Табы и чипсы уточнены в data-level=button, прочие разделы не менялись.

## Оформление и выравнивание — FUNC-021

- styleCard('faq'|'spoiler') — одна группа background/border/radius; scoped colorValue, общий chooseColor и chooseLine(anchor,key). Optional add/remove — существующие чипсы, defaults при повторном добавлении.
- paintStyle(element,style) — border/radius без overflow clipping и без перезаписи служебного outline. Фон/padding спойлера относятся к spoilerStyle; FAQ background/size остаются прежними полями.
- insetControl(file,label,value,attrs,mixed,title) — общий renderer парных отступов для старого размера FAQ и нового spoiler padding. numberField и общий валидатор — радиусы/толщина.
- alignLabels() — единственный расчёт колонок по каждой карточке, cap40%, восемь px после label; удалены прежний глобальный минимум и специальные ширины. См. AGENTS/архитектуру.
- Недостающие компоненты: подробный выбор сторон, отдельных углов и четырёх отступов; кнопки недоступны, отдельных окон пока нет.

## Уточнение FUNC-022

- Служебные guides — ::after, всегда1px/radius2 независимо от настраиваемого оформления. Accent остаётся ::before.
- insetControl: числовая пара через /, без mixed-подписи. Общая12px вертикальная иконка из геометрии3061:231482; font-expander cbuc-icons E9AA16px из3061:234730.
- buttonState: effective state учитывает hovered open, sourceActive* приоритет; sampleList использует тот же resolver. Три вкладки без нового окна.
- Main .pg-label-anchor участвует в общей колонке своей карточки; остальные карточки не зависят от него.
- styleCard border-row содержит один внешний remove; внутреннего disabled-X больше нет.

numberField(label,value,attrs,lead,unit) принимает необязательную единицу внутри общего label. Для размера иконки unit=px, общая ширина60px и одна нижняя линия; input без собственной границы. Валидация/focus остаются общими.

Уточнение28.10: overlay pseudo-line использует --overlay-accent-inset, равный автоматическим наружным полям; фон расширяется, линия сохраняет геометрию обычного открытого спойлера. Обе шапки используют общий mode-controls160px, Save/Edit116px и gap12px, документ больше не добавляет собственные отступы автора/разделителей.

Внешний фон: assets/prototype-background.jpg — оригинальный JPEG256px из3109:126915, повторяется на body плиткой128px; внутренние editor/system фоны непрозрачны и независимы. Ресурс не растягивать cover на viewport.

### Ответ: строки Enter — 28.10.2026

Общий answer-line: line-height наследуется, padding0, min-height1em; между соседними строками margin-top4px. FAQ и самостоятельный спойлер используют одну геометрию в edit/preview; document-specific overrides удалены. Маска новой строки top0, прежний жизненный цикл ввода не меняется. Проверка: verify-answer-row-spacing.cjs.

### Уточнение геометрии строки ответа — 28.10.2026

Для устранения скачка пустой строки faq-answer стал flex-column с gap4px; margin между answer-line удалён. Пустая строка получает ::after с zero-width CSS content для одинаковой высоты текстовой строки; в DOM/данные ничего не добавляется. Предыдущее описание margin-top4px заменено этим правилом. Проверка сравнивает также рамки всех контейнеров при первом символе и Backspace.
