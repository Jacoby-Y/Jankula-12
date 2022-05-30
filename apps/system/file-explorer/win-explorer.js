var NONE = -1;

class Win_Explorer extends Window {
    #ptr;
    #_item_cxt_menus_ = [];
    #cnt_menu;

    constructor(width, height, iterator, file_system__) {
        super(iterator, "File Explorer", width, height, 'icon-folder-open', "color: #f7c96c;");
        this.setMinimalSize(415, 230);
        
        this.selected_item = 0;
        this.#ptr = new DirFollower(file_system__);
        this.items_length = 0;

        let newop = new MenuTemplate("Explorer Splitter Menu [New]");
        newop.pushNewOption("Folder", "wins["+this.id_win+"].mknew(DIR)");
        newop.pushNewSeparator();
        newop.pushNewOption("File", "wins["+this.id_win+"].mknew(FILE)");

        let menu = new MenuTemplate("Explorer Content Menu");
        menu.pushNewOption("Go Into", "wins["+this.id_win+"].goIntoByDef()");
        menu.pushNewOption("Go Previous", "wins["+this.id_win+"].goOut()");
        menu.pushNewSeparator();
        menu.pushNewOption("Duplicate Window", "wins["+this.id_win+"].duplicate()");
        menu.pushNewSeparator();
        menu.pushNewSplitOption("New", newop);
        
        this.#cnt_menu = cxtm.addMenu(menu);
        let content = '<div class="exp-top">' +
            '<div class="exp-top-wrapper-btns">' +
                '<i class="icon-up-arrow exp-top-btn"></i>' +
                '<i class="icon-down-arrow exp-top-btn"></i></div>' +
            '<div class="exp-top-path"></div> </div>' +
        '<div class="exp-wrapper">' +
            '<div class="exp-nav"></div>' +
            '<div class="exp-item-barinfo">' +
                '<div class="exp-item-name">Name</div>' +
                '<div class="exp-item-date">Date Created</div>' +
                '<div class="exp-item-type">Type</div></div>' +
            '<div class="exp-content" menuv="' + this.#cnt_menu + '"></div>';

        this.setContent(content);
        this.onResizeEvent();
        

        this.setClickArrowsEvents();
        this.setKeyboardEvents();
        this.onRefreshEvent();

        this.refresh();

        let w = this;

        this.#ptr.onChangePathEvent = function() {
            w.refresh();
        }
        this.onCloseEvent = function() {
            this.removeCXTMenus();
            cxtm.removeMenu(this.#cnt_menu);
        }
    }

    // ADD EVENT: Called when arrowed to follow path clicked
    setClickArrowsEvents() {
        let id = this.id_win;
        
        // Up arrow
        $('#win-' + id + " > .win-content > .exp-top > .exp-top-wrapper-btns > .icon-up-arrow").on('click', function() {
           wins[id].goOut();
        });
        // Down arrow
        $('#win-' + id + " > .win-content > .exp-top > .exp-top-wrapper-btns > .icon-down-arrow").on('click', function() {
            wins[id].goInto();
        });
    }

    // ADD EVENTS: Whole keyboard events
    setKeyboardEvents() {
        let id = this.id_win;

        $(window).keydown(function(e) {
            if($('#win-' + id).css('z-index') == z_index) {
                if(e.which == 37 || e.which == 8) { //left arrow || backspace
                    wins[id].goOut();
                }
                if(e.which == 39 || e.which == 13) { //right arrow || enter
                    wins[id].goInto();
                }
                if(e.which == 38) { //up arrow
                    if(wins[id].selected_item > 0) {
                        wins[id].selectItem(wins[id].selected_item - 1);
                    }
                }
                if(e.which == 40) { //down arrow
                    if(wins[id].selected_item < wins[id].items_length - 1) {
                        wins[id].SelectItem(wins[id].selected_item + 1);
                    }
                }
                if(e.which == 46) { // Delete
                    if(wins[id].selected_item < wins[id].items_length - 1) {
                        wins[id].deleteItem();
                    }
                }
            }
        });
    }

    // OVERWRITTEN EVENT
    onResizeEvent() {
        super.onResizeEvent();

        let h = parseInt($('#win-' + this.id_win).css("height"));
        $('#win-' + this.id_win + '> .win-content > .exp-wrapper').css("height", h - 87);
    }

    // OVERWRITTEN EVENT
    onRefreshEvent() {
        let win = this;
        $("#handler_event").on("exp_refresh", function(e) {
            win.refreshPath();
            win.refreshItems();
            //win.RefreshNav();
        });
    }

    // Method needed to duplicate()
    setStartingPath(_path) {
        this.#ptr.goto(_path)
        this.refresh();
    }

    // OVERWRITTEN EVENT
    duplicate() {
        let id = stapp("explorer");
    
        wins[id].setStartingPath(this.#ptr.getPath());
        wins[id].goTop();
        wins[id].setPosition(
        parseInt($("#win-" + this.id_win).css("left")) + 40, 
        parseInt($("#win-" + this.id_win).css("top")) + 40);

        return id;
    }

    // Go into the selected folder or if not selected then get first one
    goInto() {
        let list = this.#ptr.getBinders();
        if(list.length != 0) {
            if(list.at(this.selected_item).type() != DIR || this.selected_item == NONE) {
                for (let i = list.length-1; i >= 0; i--) {
                    if(list.at(i).type() == DIR) {
                        this.selected_item = i;
                    }
                }
            }
            this.#ptr.goto(this.#ptr.getBinders()[this.selected_item].getName());
            this.selected_item = this.#ptr.getCurrentDir().slct_pos;
            this.refresh();
        }
    }

    // Go out from current folder
    goOut() {
        this.#ptr.getCurrentDir().slct_pos = this.selected_item;
        this.#ptr.goto("..");
        $('#exp-item-' + this.selected_item + '-' + this.id_win).addClass('exp-item-ghost-select');
    }

    // Rename Item with GUi's help
    renameItem() {
        if(this.selected_item != NONE) {
            let item = this.#ptr.getItemByIndex(this.selected_item);
            let tp = item.type() == DIR ? "Folder" : "File";
            xinput("Rename "+ item.getName() +" " + tp,
            "Type new name of " + tp + ": ",
            "<input type='text' value='"+item.getName()+"' id='i-exp-" + this.id_win + "'/>",
            "wins["+this.id_win+'].execRename($("#i-exp-'+this.id_win+'").val(), '+this.selected_item+')',
            "");
        }
    }
    // Execute rename of file
    execRename(accept, item_index, change_ext_accepted) {
        if(accept != undefined) {
            if(File.splitExt(accept) && !change_ext_accepted) {
                xquestion("Change file extension", 
                "If you change file extension, the file might be unusable. <br/><br/> Are you sure?", 
                `wins[${this.id_win}].execRename("${accept}", ${item_index}, true)`, "");
            } else {
                switch (this.#ptr.getItemByIndex(item_index).rename(accept)) 
                {
                    case "FORBIDDEN_SIGNS":
                        xwarning("Incorrect name", "Item's name cannot includes '/' or '\\'.");
                        break;
                    case "ZERO_LENGTH":
                        xwarning("Incorrect name", "Item must have new name.");
                        break;
                    case "FORBIDDEN_RENAMING": 
                        xerror("Forbidden renaming item", "You cannot rename this item.");
                    break;
                    default:
                        break;
                }
                this.refresh();
            }
        }
    }

    //Delete item with GUI's help
    deleteItem() {
        if(this.selected_item != NONE) {
            let item = this.#ptr.getItemByIndex(this.selected_item);
            if(!item.checkAttr(REMOVABLE)) {
                xerror("Deleting failed", "You cannot delete this item because this is forbidden.");
            } else {
                let tp = item.type() == DIR ? "Folder" : "File";
                let contains = "";

                if(item.type() == DIR && item.countAll() != 0) {
                    contains = "Folder contains: " + item.countAll() + (item.countAll() > 1 ? " Items" : " Item");
                }


                xquestion("Deleting " + item.getName() + " " + tp,
                "Are you sure to delete 1 "+tp+"? <br/> " + contains,
                'wins['+this.id_win+'].execDel("'+item.getName()+'")',
                "");
            }
            
        }
    }

    // Execute deleting item
    execDel(name) {
        this.#ptr.del_noq(name);
        this.refresh();
    }

    // Open properties of current item
    openProp() {
        wins.push(new Win_Properties(iter));
        wins[iter].displayFileProperties(this.#ptr.getBinders()[this.selected_item], this.#ptr.getPath());
        iter++;
    }

    // Set current item
    SelectItem(index) {
        let id = this.id_win;

        if(this.selected_item != index) {
            $('#exp-item-' + index + '-' + this.id_win).addClass('exp-item-selected');

            $('#exp-item-' + this.selected_item + '-' + this.id_win).removeClass("exp-item-ghost-select");
            $('#exp-item-' + this.selected_item + '-' + this.id_win).removeClass("exp-item-selected");
            this.selected_item = index;

            $('#exp-item-' + index + '-' + this.id_win).on("dblclick", function() {
                wins[id].goInto();
            });
        }
    }

    // Make new item.
    // what: DIR or FILE
    mknew(what, _res) {
        switch (what) {
            case DIR:
                xinput("Create a new folder", 
                "Type name for a new folder: ", 
                "<input type='text' id='i-exp-"+this.id_win+"'/>",
                "wins["+this.id_win+'].mknew("D_RES_", $("#i-exp-'+this.id_win+'").val())',
                "wins["+this.id_win+"].mknew(NONE)");
                break;
            case "D_RES_":
                switch (BinderObject.checkName(_res)) {
                    case "CORRECT":
                        let r = this.#ptr.mkdir(_res);
                        if(r.includes("ERRMK")) {
                            xerror("Couldn't create new item", "No file can be created in this directory because it is forbidden.")
                        }
                        this.refresh();
                        break;
                    case "FORBIDDEN_SIGNS":
                        xwarning("Incorrect name", "Item's name cannot includes '/' or '\\'.");
                        break;
                    case "ZERO_LENGTH":
                        xwarning("Incorrect name", "Item must have new name.");
                        break;
                    case "FORBIDDEN_RENAMING": 
                        xerror("Forbidden renaming item", "You cannot rename this item.");
                    break;
                    default:
                        break;
                    }
                break;
            case FILE:
                xinput("Create a new file", 
                "Type name for a new file: ", 
                "<input type='text' id='i-exp-"+this.id_win+"'/>",
                "wins["+this.id_win+'].mknew("F_RES_", $("#i-exp-'+this.id_win+'").val())',
                "wins["+this.id_win+"].mknew(NONE)");
                break;
            case "F_RES_":
                switch (BinderObject.checkName(_res)) {
                    case "CORRECT":
                        let r = this.#ptr.mkfile(_res);
                        if(r.includes("ERRMK")) {
                            xerror("Couldn't create new item", "No file can be created in this directory because it is forbidden.")
                        }
                        this.refresh();
                        break;
                    case "FORBIDDEN_SIGNS":
                        xwarning("Incorrect name", "Item's name cannot includes '/' or '\\'.");
                        break;
                    case "ZERO_LENGTH":
                        xwarning("Incorrect name", "Item must have new name.");
                        break;
                    case "FORBIDDEN_RENAMING": 
                        xerror("Forbidden renaming item", "You cannot rename this item.");
                    break;
                    default:
                        break;
                    }
                break;
            case NONE: // Cancel creating
                return false;
            default:
                console.log("mknew(what, _res) does not know this type creating: " + what);
                break;
        }
    }

    // Refresh all explorers
    refresh() {
        $("#handler_event").trigger('exp_refresh');
    }

    // Refresh path on the top of explorer
    refreshPath() {
        $('#win-' + this.id_win + " > .win-content > .exp-top > .exp-top-path").text(this.#ptr.getPath());
    }

    // Removes all context menus of items
    removeCXTMenus() {
        this.#_item_cxt_menus_.forEach(item => {
            cxtm.removeMenu(item);
        });
    }

    // Refrehs items in the explorer
    refreshItems() {
        this.removeCXTMenus();

        this.#_item_cxt_menus_ = [];

        let cnt = "";
        let list = this.#ptr.getBinders();
        this.items_length = list.length;

        if(list.length == 0) {
            this.selected_item = NONE;
        }
        
        for(let i = 0; i < list.length; i ++) {
            let menu_id = cxtm.addMenu(this.CreateMenu(list[i]));
            this.#_item_cxt_menus_.push(menu_id);

            let _t = (list[i].type() == DIR)? "folder": (list[i].ext() == "")? list[i].type() : list[i].ext();
            let type = "";

            for (let i = 0; i < _t.length; i++) {
                if(i == 0) type += _t[0].toUpperCase();
                else type += _t[i];
            }

            cnt += '<div class="exp-item" id="exp-item-' + i + '-' + this.id_win+ '" onclick="wins['+this.id_win+'].SelectItem('+i+')" oncontextmenu="wins['+this.id_win+'].SelectItem('+i+')" menuv="' + menu_id + '">' +
            '<div class="exp-item-name" menuv="' + menu_id + '">' + list[i].getName() + '</div>' +
            '<div class="exp-item-date" menuv="' + menu_id + '">'+list[i].getCreatedDate() +' ' + list[i].getCreatedTime() +'</div>' +
            '<div class="exp-item-type" menuv="' + menu_id + '">'+type+'</div></div>\n';
        }
        
        $('#win-' + this.id_win + " > .win-content > .exp-wrapper > .exp-content").html(cnt);
    }

    //Create menu for specific item
    CreateMenu(item) {
        let menu;
        switch(item.type()) {
            case DIR:
                menu = new MenuTemplate('Folder :: ' + item.name);
                menu.pushNewOption("Open", 'wins['+this.id_win+'].goInto()');
                if(item.checkAttr(CHANGEABLE_NAME)) menu.pushNewOption("Rename", 'wins['+this.id_win+'].renameItem()');
                if(item.checkAttr(REMOVABLE)) menu.pushNewOption("Delete", 'wins['+this.id_win+'].deleteItem()');
                menu.pushNewSeparator();
                if(item.checkAttr(CUTABLE)) menu.pushNewOption("Cut", null);
                if(item.checkAttr(COPYABLE)) menu.pushNewOption("Copy", null);
                if(item.checkAttr(COPYABLE) && item.checkAttr(CUTABLE)) menu.pushNewSeparator();
                menu.pushNewOption("Copy Path", null, true);
                menu.pushNewSeparator();
                menu.pushNewOption("Properties", 'wins['+this.id_win+'].openProp()');
            break;
            case FILE:
                menu = new MenuTemplate('File ::   ' + item.name);
                menu.pushNewOption("Open", null);
                if(item.checkAttr(CHANGEABLE_NAME)) menu.pushNewOption("Rename", 'wins['+this.id_win+'].renameItem()');
                if(item.checkAttr(REMOVABLE)) menu.pushNewOption("Delete", 'wins['+this.id_win+'].deleteItem()');
                menu.pushNewSeparator();
                if(item.checkAttr(COPYABLE)) menu.pushNewOption("Cut", null);
                if(item.checkAttr(COPYABLE)) menu.pushNewOption("Copy", null);
                menu.pushNewSeparator();
                menu.pushNewOption("Properties", 'wins['+this.id_win+'].openProp()');
            break;
            default:
                console.error("Not found '" + item.type() + "' in CreateMenu(item)");
            break;
        }

        return menu;
    }
}