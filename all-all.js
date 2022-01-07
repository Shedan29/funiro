/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.ux.Portlet
 * @extends Ext.Panel
 * A {@link Ext.Panel Panel} class that is managed by {@link Ext.app.PortalPanel}.
 */
Ext.define('Lib.Portlet', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.portlet',
    layout: 'fit',
    anchor: '100%',
    frame: true,
    closable: true,
    collapsible: true,
    animCollapse: true,
    draggable: true,
    cls: 'x-portlet',

    // Override Panel's default doClose to provide a custom fade out effect
    // when a portlet is removed from the portal
    doClose: function() {
        this.el.animate({
            opacity: 0,
            callback: function(){
                this.fireEvent('close', this);
                this[this.closeAction]();
            },
            scope: this
        });
    }
});









/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.ux.PortalColumn
 * @extends Ext.container.Container
 * A layout column class used internally be {@link Ext.app.PortalPanel}.
 */
Ext.define('Lib.PortalColumn', {
    extend: 'Ext.container.Container',
    alias: 'widget.portalcolumn',
    layout: {
        type: 'anchor'
    },
    defaultType: 'portlet',
    cls: 'x-portal-column',
    autoHeight: true
    //
    // This is a class so that it could be easily extended
    // if necessary to provide additional behavior.
    //
});








/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.app.PortalPanel
 * @extends Ext.Panel
 * A {@link Ext.Panel Panel} class used for providing drag-drop-enabled portal layouts.
 */
Ext.define('Lib.PortalPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.portalpanel',
    requires: [
        'Ext.layout.component.Body'
    ],

    cls: 'x-portal',
    bodyCls: 'x-portal-body',
    defaultType: 'portalcolumn',
    componentLayout: 'body',
    autoScroll: true,

    initComponent : function() {
        var me = this;

        // Implement a Container beforeLayout call from the layout to this Container
        this.layout = {
            type : 'column'
        };
        this.callParent();

        this.addEvents({
            validatedrop: true,
            beforedragover: true,
            dragover: true,
            beforedrop: true,
            drop: true
        });
        this.on('drop', this.doLayout, this);
    },

    // Set columnWidth, and set first and last column classes to allow exact CSS targeting.
    beforeLayout: function() {
        var items = this.layout.getLayoutItems(),
            len = items.length,
            i = 0,
            item;

        for (; i < len; i++) {
            item = items[i];
            item.columnWidth = 1 / len;
            item.removeCls(['x-portal-column-first', 'x-portal-column-last']);
        }
        items[0].addCls('x-portal-column-first');
        items[len - 1].addCls('x-portal-column-last');
        return this.callParent(arguments);
    },

    // private
    initEvents : function(){
        this.callParent();
        this.dd = Ext.create('Lib.PortalDropZone', this, this.dropConfig);
    },

    // private
    beforeDestroy : function() {
        if (this.dd) {
            this.dd.unreg();
        }
        Lib.PortalPanel.superclass.beforeDestroy.call(this);
    }
});
















/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.app.PortalDropZone
 * @extends Ext.dd.DropTarget
 * Internal class that manages drag/drop for {@link Ext.app.PortalPanel}.
 */
Ext.define('Lib.PortalDropZone', {
    extend: 'Ext.dd.DropTarget',

    constructor: function(portal, cfg) {
        this.portal = portal;
        Ext.dd.ScrollManager.register(portal.body);
        Lib.PortalDropZone.superclass.constructor.call(this, portal.body, cfg);
        portal.body.ddScrollConfig = this.ddScrollConfig;
    },

    ddScrollConfig: {
        vthresh: 50,
        hthresh: -1,
        animate: true,
        increment: 200
    },

    createEvent: function(dd, e, data, col, c, pos) {
        return {
            portal: this.portal,
            panel: data.panel,
            columnIndex: col,
            column: c,
            position: pos,
            data: data,
            source: dd,
            rawEvent: e,
            status: this.dropAllowed
        };
    },

    notifyOver: function(dd, e, data) {
        var xy = e.getXY(),
            portal = this.portal,
            proxy = dd.proxy;

        // case column widths
        if (!this.grid) {
            this.grid = this.getGrid();
        }

        // handle case scroll where scrollbars appear during drag
        var cw = portal.body.dom.clientWidth;
        if (!this.lastCW) {
            // set initial client width
            this.lastCW = cw;
        } else if (this.lastCW != cw) {
            // client width has changed, so refresh layout & grid calcs
            this.lastCW = cw;
            //portal.doLayout();
            this.grid = this.getGrid();
        }

        // determine column
        var colIndex = 0,
            colRight = 0,
            cols = this.grid.columnX,
            len = cols.length,
            cmatch = false;

        for (len; colIndex < len; colIndex++) {
            colRight = cols[colIndex].x + cols[colIndex].w;
            if (xy[0] < colRight) {
                cmatch = true;
                break;
            }
        }
        // no match, fix last index
        if (!cmatch) {
            colIndex--;
        }

        // find insert position
        var overPortlet, pos = 0,
            h = 0,
            match = false,
            overColumn = portal.items.getAt(colIndex),
            portlets = overColumn.items.items,
            overSelf = false;

        len = portlets.length;

        for (len; pos < len; pos++) {
            overPortlet = portlets[pos];
            h = overPortlet.el.getHeight();
            if (h === 0) {
                overSelf = true;
            } else if ((overPortlet.el.getY() + (h / 2)) > xy[1]) {
                match = true;
                break;
            }
        }

        pos = (match && overPortlet ? pos : overColumn.items.getCount()) + (overSelf ? -1 : 0);
        var overEvent = this.createEvent(dd, e, data, colIndex, overColumn, pos);

        if (portal.fireEvent('validatedrop', overEvent) !== false && portal.fireEvent('beforedragover', overEvent) !== false) {

            // make sure proxy width is fluid in different width columns
            proxy.getProxy().setWidth('auto');

            if (overPortlet) {
                proxy.moveProxy(overPortlet.el.dom.parentNode, match ? overPortlet.el.dom : null);
            } else {
                proxy.moveProxy(overColumn.el.dom, null);
            }

            this.lastPos = {
                c: overColumn,
                col: colIndex,
                p: overSelf || (match && overPortlet) ? pos : false
            };
            this.scrollPos = portal.body.getScroll();

            portal.fireEvent('dragover', overEvent);
            return overEvent.status;
        } else {
            return overEvent.status;
        }

    },

    notifyOut: function() {
        delete this.grid;
    },

    notifyDrop: function(dd, e, data) {
        delete this.grid;
        if (!this.lastPos) {
            return;
        }
        var c = this.lastPos.c,
            col = this.lastPos.col,
            pos = this.lastPos.p,
            panel = dd.panel,
            dropEvent = this.createEvent(dd, e, data, col, c, pos !== false ? pos : c.items.getCount());

        if (this.portal.fireEvent('validatedrop', dropEvent) !== false && this.portal.fireEvent('beforedrop', dropEvent) !== false) {

            // make sure panel is visible prior to inserting so that the layout doesn't ignore it
            panel.el.dom.style.display = '';

            if (pos !== false) {
                c.insert(pos, panel);
            } else {
                c.add(panel);
            }

            dd.proxy.hide();
            this.portal.fireEvent('drop', dropEvent);

            // scroll position is lost on drop, fix it
            var st = this.scrollPos.top;
            if (st) {
                var d = this.portal.body.dom;
                setTimeout(function() {
                    d.scrollTop = st;
                },
                10);
            }

        }
        delete this.lastPos;
        return true;
    },

    // internal cache of body and column coords
    getGrid: function() {
        var box = this.portal.body.getBox();
        box.columnX = [];
        this.portal.items.each(function(c) {
            box.columnX.push({
                x: c.el.getX(),
                w: c.el.getWidth()
            });
        });
        return box;
    },

    // unregister the dropzone from ScrollManager
    unreg: function() {
        Ext.dd.ScrollManager.unregister(this.portal.body);
        Lib.PortalDropZone.superclass.unreg.call(this);
    }
});















/**
 * СВОЙСТВА:
 *
 * cellEditing  - подключает плагин 'Ext.grid.plugin.CellEditing', возможные значения true|false, если одна из колонок имеет editor, то плагин будет подключен автоматически, параметр можно не указывать.
 * clicksToEdit - количество кликов для редактирования
 * markRecord - признак колонки(не грида!) отвечающей за выделение записей
 * paging       - подключает плагин 'Lib.ExtPagingToolbar'
 * contextMenu  - список меню по ПКМ [{itemId, text},{itemId, text}]
 *
 * МЕТОДЫ:
 *
 * getContextMenu()     - Возаращает контектное мени по имени,
 * getSelectionRecord() - Возвращает выделенную строку
 * getColumn()          - Возвращает необходимую колонку
 * setEditorDisabled()  - Блокирует возможность включить editor колонки
 * getCellEditor()      - Возвращает 'Ext.grid.plugin.CellEditing'
 * doBeforeEdit()       - Обработчик дейсвий до редактирования ячейки (для переопределения)
 * doEdit()             - Обработчик дейсвий после редактирования ячейки (для переопределения)
 * doValidateEdit()     - Обрабочки проверки ячейки после редактирования (для переопределения)
 * doAfterMark()       - Обработчик действий после того как записи были выделены чекбоксом
 *
 * СОБЫТИЯ:
 *
 * aftermark      - информирует о том что сервер дал ответ после установки чекбокса строк(и)
 * beforeedit     - аналогично плагину 'Ext.grid.plugin.CellEditing'
 * edit           - аналогично плагину 'Ext.grid.plugin.CellEditing'
 * validateedit   - аналогично плагину 'Ext.grid.plugin.CellEditing'
 *
 */
Ext.define('Lib.GoodScrollGrid', {
    extend: 'Ext.grid.Panel',
    requires: ['Lib.GoodScroller', 'Lib.MarkButton', 'Lib.CheckColumn'],
    verticalScrollerType: 'goodgridscroller',
    alias: 'widget.goodscrollgrid',
    cellEditing: false,
    clicksToEdit: 1,
    initComponent: function() {
        var grid = this;
        for (var i=0; i<this.columns.length; i++) {
            this.columns[i].selectable = true;
        }
        this.on({itemdblclick: function(view, record, item, index, e, options) {
            var selection = window.getSelection();
			selection.removeAllRanges();

        }});


        grid.plugins = grid.plugins? grid.plugins: [];

        var hasEditor = false;
        if (grid.cellEditing) {
            for (var i=0; i<grid.columns.length; i++) {
                var editor = grid.columns[i].editor;
                if (editor) {
                    hasEditor = true;
                    break;
                }
            }
        }

        // Если необходимо редактирование ячеек, то подключить плагин
        if (hasEditor) {
            grid.plugins.push(Ext.create('Ext.grid.plugin.CellEditing', {
                clicksToEdit: grid.clicksToEdit,
                pluginId: 'nativeCellEditor',
                listeners: {
                    beforeedit:   grid.doBeforeEdit,
                    edit:         grid.doEdit,
                    validateedit: grid.doValidateEdit,
                }
            }));
        }

        // Если необходима пагинация, то подключаем плагин
        if (grid.paging) {
            grid.plugins.push(Ext.create('Lib.ExtPagingToolbar', {
                pluginId: 'nativePagingToolbar',
            }));
        }

        if (grid.contextMenu && !grid.getPlugin('Lib.StandardHotKey')) {
            grid.plugins.push(Ext.create('Lib.StandardHotKey', {
                pluginId: 'Lib.StandardHotKey',
            }));
            grid.contextMenu = Ext.create('Ext.menu.Menu', {
                items: grid.contextMenu
            });
            grid.on('beforerender', function() {
                var plugin = grid.getPlugin('Lib.StandardHotKey');
                plugin.on('contextmenu', function(owner, parent, xy) {
                    grid.contextMenu.showAt(xy);
                    grid.fireEvent('contextmenu', grid);
                }, grid);
            }, grid);
        }

        grid.callParent(arguments);

        // Событие изменения кастомных фильтров грида
//        let fields = grid.getNativeFields();
//        let nativeFieldHandler = function(item, newValue, oldValue) {
//            this.fireEvent('nativechange', item, newValue, oldValue);
//        };
//        for (var i=0; i< fields.length; i++) {
//            var field = fields[i];
//            if(field.isXType('livesearchcombobox')) {
//                field.on('changeValue', nativeFieldHandler, grid);
//                field.on('select',      nativeFieldHandler, grid);
//            } else {
//                field.on('change', nativeFieldHandler, grid);
//            }
//        }

        // Нужен ли выборк строки чекбоксом
        var markColumn = null;
        for (var i=0; i<grid.columns.length; i++) {
            if (grid.columns[i].markRecord) {
                markColumn = grid.columns[i];
                break;
            }
        }

        // Если необходим выбор строки чекбоксом, то установить обработчики этого действи
        if (markColumn) {
            var store = grid.store;
            if (!(store && store.__proto__ && store.__proto__.__proto__ && store.__proto__.__proto__['$className'] === 'Lib.MassChangeStore')) {
                console.warn('Lib.GoodScrollGrid: ' + grid.id + ' не связан c "Lib.MassChangeStore:');
            }
            if (
                !store.packageName ||
                !store.markUrlFunction ||
                !store.unmarkUrlFunction ||
                !store.markAllUrlFunction ||
                !store.unmarkAllUrlFunction ||
                !store.markPartUrlFunction ||
                !store.markIntervalUrlFunction ||
                !store.getMarkedCountAllUrlFunction
            ) {
                console.warn('Lib.GoodScrollGrid: стор без наименований функций отметки записи');
            }

            // Одиночная установка/снятие чекбокса строки
            markColumn.on('checkchange', function(column, recordIndex, checked, e) {
                var record = grid.store.getAt(recordIndex);
		if (record) {
                if (checked) {
                    if (e.shiftKey) {
                        grid.store.markInterval(record.get('id_record'));
                    } else {
                        grid.store.markRecord(record.get('id_record'));
                    }
                } else {
                    grid.store.unmarkRecord(record.get('id_record'));
                }
                record.commit();
            }
            }, grid);

            // Массовая установка/снятие чекбокса строк черех кнопку
            // Кнопка может быть добавлена динамически
            grid.on('afterrender', function(grid) {
                var markButton = grid.down('markbutton');
                if (markButton) {
                    markButton.menu.down('#menuitem_markall').on('click', function() {
                        if (grid.store.getTotalCount() > 0) grid.store.markAll();
                    });
                    markButton.menu.down('#menuitem_markpart').on('click', function() {
                        var record = grid.getSelectionRecord();
                        if (record) grid.store.markPart(record.get('id_record'));
                    });
                    markButton.menu.down('#menuitem_unmarkall').on('click', function() {
                        if (grid.store.getTotalCount() > 0) grid.store.unmarkAll();
                    });
                }
            });
//            var markButton = grid.down('markbutton');
//            if (markButton) {
//                markButton.menu.down('#menuitem_markall').on('click', function() {
//                    debugger;
//                    if (grid.store.getTotalCount() > 0) grid.store.markAll();
//                });
//                markButton.menu.down('#menuitem_markpart').on('click', function() {
//                    var record = grid.getSelectionRecord();
//                    if (record) grid.store.markPart(record.get('id_record'));
//                });
//                markButton.menu.down('#menuitem_unmarkall').on('click', function() {
//                    if (grid.store.getTotalCount() > 0) grid.store.unmarkAll();
//                });
//            }

            // Обработка ответа сервера после установки/снятия чекбокса
            var markHandler = function(store, success, params, result, opt) {
                var grid    = this;
                var markButton = grid.down('markbutton');
                var record  = params? store.findRecord('id_record', params.id_record, 0, false, true, true ): null;

                // Для countChange количество параметров меньше чем для mark подобных
                if (success.eventName === 'countChange') {
                    if (markButton) markButton.setText('Выбрано (' + store.getSelectedRecordCount() + ')');
                } else if (opt.eventName === 'mark' || opt.eventName === 'unmark') {
                    if (!success) {
                        record.set('marked', !record.get('marked'));
                        record.commit();
                    }
                } else if (opt.eventName === 'markAll' || opt.eventName === 'unmarkAll') {
                    if (!success) return;
                    store.each(
                        function(record) {
                            record.set('marked', opt.eventName === 'markAll'? true: false);
                            record.commit();
                        }
                    );
                } else if (opt.eventName === 'markPart') {
                    if (!success) return;
                    var recordIndex = store.indexOf(record);
                    var records     = store.getRange(0, recordIndex);

                    for (var i in records) {
                        var record = store.getAt(i);
                        record.set('marked', true);
                        record.commit();
                    }
                } else if (opt.eventName === 'markInterval') {
                    if (success) {
                        for (var i in records) {
                            var record = store.findRecord('id_record', records[i].id_record, 0, false, true, true );
                            record.set('marked', true);
                            record.commit();
                        }
                    } else {
                        record.set('marked', !record.get('marked'));
                        record.commit();
                    }
                }
                grid.doAfterMark(store, success, params, result, opt);
                grid.fireEvent('aftermark', grid, store, success, params, result, opt);
            };
            grid.store.on('countChange',  markHandler, grid, {eventName: 'countChange'});
            grid.store.on('mark',         markHandler, grid, {eventName: 'mark'});
            grid.store.on('unmark',       markHandler, grid, {eventName: 'unmark'});
            grid.store.on('markAll',      markHandler, grid, {eventName: 'markAll'});
            grid.store.on('unmarkAll',    markHandler, grid, {eventName: 'unmarkAll'});
            grid.store.on('markPart' ,    markHandler, grid, {eventName: 'markPart'});
            grid.store.on('markInterval', markHandler, grid, {eventName: 'markInterval'});
        }
    },
    getContextMenu: function(value) {
        let grid = this;
        if (!value) return grid.contextMenu;
        return grid.contextMenu.down(value);
    },
    getCellEditor: function() {
        return this.getPlugin('nativeCellEditor');
    },
    doBeforeEdit: function(editor, e, eOpts) { },
    doEdit: function(editor, e, eOpts) { },
    doValidateEdit: function(editor, e, eOpts) { },
    doAfterMark: function(store, success, params, result, eOpts) {},

    determineScrollbars: function( ) {
        var me = this;

        if ( !me.view || !me.view.el || !me.view.el.dom.firstChild) {
            if( me.verticalScroller )
                me.hideVerticalScroller();
        }
        me.callParent(arguments);
    },
    // ���������� �������������� scroll
    initHorizontalScroller: function () {
        var me = this,
            ret = {
                xtype: 'goodgridscroller',
                // ����
                // xtype: 'gridscroller',
                dock: 'bottom',
                section: me,
                store: me.store
            };

        return ret;
    },
    // ��������� �������������� ������ �� �������� �����
    onMouseWheel: function(e) {

        var deltas = e.getWheelDeltas();
        var oldFunction = e.getWheelDeltas;

        e.getWheelDeltas = function() {
            return { x: 0, y: deltas.y };
        };

        this.callParent(arguments);

        e.getWheelDeltas = oldFunction;
    },
    getSelectionRecord: function() {
        var me = this;
        var sm = me.getSelectionModel();
        if( sm )
        {
            if( sm instanceof Ext.selection.CellModel )
            {
                var position = sm.getCurrentPosition();
                if( (position===undefined) || (position===null) ) return null;
                var store = me.view.getStore();
                return store.getAt(position.row);
            } else {
                if( me.getSelectionModel().selected.length > 0 )
                {
                    return me.getSelectionModel().selected.getAt(0);
                }
            }
        }
        return null;
    },
    reconfigure: function(store, columns) {
        Ext.each( columns, function( column ){
            column.selectable = true;
        });
        this.callParent(arguments);
    },
    /**
     * Входные параметры при открытии из другого АРМа
     */
    getAppParams: function () {
        let strSearch = window.location.search ? window.location.search.substr(1) : '';
        let strPattern = /([^=]+)=([^&]+)&?/ig;
        let arrMatch = strPattern.exec(strSearch);
        let objRes = {};
        while (arrMatch != null) {
            objRes[arrMatch[1]] = arrMatch[2];
            arrMatch = strPattern.exec(strSearch);
        }
        return objRes;
    },
    /**
     * Возвращает колонку по ее индексу, dataIndex или text
     * Если передан текст, то сначал пройдет поиск по dataIndex, после по text или сразу указать тип по которому нужно искать
     */
    getColumn: function(value, type) {
        let grid = this;
        let columns = grid.getView().getHeaderCt().getGridColumns();
        if (value && typeof(value) === 'string') {
            for (var i=0; i<columns.length; i++) {
                var column = columns[i];
                if ((!type || type === 'dataIndex') && column.dataIndex === value) {
                    return column;
                } else if ((!type || type === 'text') && column.text === value) {
                    return column;
                }
            }
        } else if (value && typeof(value) === 'number') {
            return grid.columns[value];
        } else
        return null;
    },
    /**
     * Возвращает editor указаной колонки(dataIndex|text|порядковый номер)
     * НЕ ИСПОЛЬЗОВАТЬ!
     */
    getEditor: function(value, type) {
        let grid = this;
        let column = grid.getColumn(value, type);
        if (!column      ) return null;
        if (column.editor) return column.editor;
        if (column.originalEditorCfg) return column.originalEditorCfg;
        return null;
    },
    /**
     * Блокирует редактирование в колонке.
     * column - Порядковый номер/text/dataIndex/gridcolumn
     * type -  1) Уточнение типа имени колонки "text"/"dataIndex" или 2) сразу указать признак блокировки disable
     * disable - признак блокировки, если уже указан на месте параметра type, то можно не передавать
     * НЕ ИСПОЛЬЗОВАТЬ!
     */
    setEditorDisabled(column, type, disable) {
        var grid = this;
        disable = typeof(type) === 'boolean'? type: disable;
        type    = typeof(type) === 'boolean'? null: type;
        column  = typeof(column) === 'string' || typeof(column) === 'number'? grid.getColumn(column, type): column;

        column.originalEditorCfg = column.originalEditorCfg? column.originalEditorCfg: column.editor;

        var editor = !disable? column.originalEditorCfg: null;
        column.setEditor(editor);
    },
    
//    getFieldValues: function (fieldSignName) {
//        fieldSignName = fieldSignName? fieldSignName: 'fieldService';
//        
//        var grid   = this;
//        let fields = grid.query('[' + fieldSignName + ']');
//        if 
//        var fields = grid.getNativeFields();
//        var result = {};
//        for (var i = 0; i < fields.length; i++) {
//            var field = fields[i];
//            if (field.wanted.need && field.getValue && !field.wanted.need.call(field, field.getValue()))
//                continue;
//            var name = field.nativeField.name ? field.nativeField.name : (field.name ? field.name : field.itemId);
//            result[name] = field.nativeField.value ? field.nativeField.value.call(field, (field.getValue ? field.getValue() : null)) : (field.getValue ? field.getValue() : '');
//        }
//        return result;
//    },
//
//    /**
//     * Возвращает массив(объект) значений всех полей на панели с признаком nativeField
//     */
//    getNativeFieldValues: function () {
//        let grid   = this;
//        let fields = grid.getNativeFields();
//        let result = {};
//        for (var i = 0; i < fields.length; i++) {
//            var field = fields[i];
//            if (field.wanted.need && field.getValue && !field.wanted.need.call(field, field.getValue()))
//                continue;
//            var name = field.nativeField.name ? field.nativeField.name : (field.name ? field.name : field.itemId);
//            result[name] = field.nativeField.value ? field.nativeField.value.call(field, (field.getValue ? field.getValue() : null)) : (field.getValue ? field.getValue() : '');
//        }
//        return result;
//    },
//
//    /**
//     * Возвращает массив полей с признаком nativeField,
//     */
//    getNativeFields: function() {
//        let grid    = this;
//        let filters = grid.query('[nativeField]');
//        let result  = [];
//        for (var i=0; i<filters.length; i++) {
//            result.push(filters[i]);
//        }
//        return result;
//    },
});



















Ext.define('Lib.GoodScroller', {
    extend: 'Ext.grid.Scroller',
    alias: 'widget.goodgridscroller',    
    invalidate: function( firstPass ) {    
        var me = this;
        me.callParent(arguments);
		if( me.scrollEl ) {
		    me.mun(me.scrollEl, 'scroll', me.onElScroll, me);
            me.mon(me.scrollEl, 'scroll', me.onElScroll, me);
        }
    }
});














Ext.define('Lib.MarkButton', {
    extend: 'Ext.button.Button',
    alias: 'widget.markbutton',
    text: 'Выбрано (0)',
    menu: {
        items: [
            {
                text:   'Выбрать все',
                itemId: 'menuitem_markall'
            }, {
                text:   'Выбрать все до текущей',
                itemId: 'menuitem_markpart'
            }, {
                text:   'Отменить все',
                itemId: 'menuitem_unmarkall'
            }
        ]
    }
});














/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.ux.CheckColumn
 * @extends Ext.grid.column.Column
 * <p>A Header subclass which renders a checkbox in each column cell which toggles the truthiness of the associated data field on click.</p>
 * <p><b>Note. As of ExtJS 3.3 this no longer has to be configured as a plugin of the GridPanel.</b></p>
 * <p>Example usage:</p>
 * <pre><code>
// create the grid
var grid = Ext.create('Ext.grid.Panel', {
    ...
    columns: [{
           text: 'Foo',
           ...
        },{
           xtype: 'checkcolumn',
           text: 'Indoor?',
           dataIndex: 'indoor',
           width: 55
        }
    ]
    ...
});
 * </code></pre>
 * In addition to toggling a Boolean value within the record data, this
 * class adds or removes a css class <tt>'x-grid-checked'</tt> on the td
 * based on whether or not it is checked to alter the background image used
 * for a column.
 */
Ext.define('Lib.CheckColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.checkcolumn',
    disabledIfNull: false,
    disabledText: null,
    isDisabled: undefined,
    constructor: function() {
        this.addEvents(
            /**
             * @event checkchange
             * Fires when the checked state of a row changes
             * @param {Ext.ux.CheckColumn} this
             * @param {Number} rowIndex The row index
             * @param {Boolean} checked True if the box is checked
             */
            'checkchange'
        );

        this.callParent(arguments);
    },

    /**
     * @private
     * Process and refire events routed from the GridView's processEvent method.
     */
    processEvent: function(type, view, cell, recordIndex, cellIndex, e) {

        var columns = view.panel.headerCt.getGridColumns();
        var column = columns[cellIndex];

        if ( type == 'mousedown' || (type == 'keydown' && (e.getKey() == e.ENTER || e.getKey() == e.SPACE))) {
            if (column.disabled || column.checkboxDisabled) {
                return;
            }

            //console.log(view, view.panel, recordIndex);

            var store = view.store,
                sm = view.getSelectionModel(),
                record = store.getAt(recordIndex),
                dataIndex = this.dataIndex,
                checked = !record.get(dataIndex);

            if( this.disabledIfNull)
            {
                if( record.get(dataIndex) == null )
                    return;
            }

            if( Ext.isFunction(column.isDisabled) && column.isDisabled(checked, record, recordIndex, cellIndex, store, view) ) {
                return;
            }
            if (this.disabledField && !record.get(this.disabledField)) {
                return false;
            }

            if( sm && sm.selectByPosition )
                sm.selectByPosition( { row: recordIndex, column: cellIndex } );

            record.set(dataIndex, checked);
            this.fireEvent('checkchange', this, recordIndex, checked, e);
            // for HotKey work after checkbox mouse click in checkcolumn
            if ( type == 'mousedown' ) {
                view.focus(false, 200);
            }
            // cancel selection.
            return false;
        } else {
            return this.callParent(arguments);
        }
    },

    // Note: class names are not placed on the prototype bc renderer scope
    // is not in the header.
    renderer : function(value, metaData, record, recordIndex, cellIndex, store, view){
        var cssPrefix = Ext.baseCSSPrefix,
            cls = [cssPrefix + 'grid-checkheader'],
            columns = view.panel.headerCt.getGridColumns(),
            disabled = false
            column = columns[cellIndex];

        if (column.disabledIfNull === true && value === null) {
            cls.push(cssPrefix + 'grid-checkheader-disabled');
            disabled = true;
        } else if (column.disabled || column.checkboxDisabled ||
                   (Ext.isFunction(column.isDisabled) && column.isDisabled(value, record, recordIndex, cellIndex, store, view))) {
            if (value) {
                cls.push(cssPrefix + 'grid-checkheader-checked-disabled');
            } else {
                cls.push(cssPrefix + 'grid-checkheader-disabled');
            }
            disabled = true;
        } else if (value) {
            cls.push(cssPrefix + 'grid-checkheader-checked');
        }
        return '<div ' + ( disabled && !Ext.isEmpty( column.disabledText ) ? 'title="' + column.disabledText + '"' : '' ) + ' class="' + cls.join(' ') + '">&#160;</div>';
    }
});
