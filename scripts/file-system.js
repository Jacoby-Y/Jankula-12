const ERRFILE = -1;

const BINDER = "Binder Object";
const FILE = "File";
const DIR = "Directory";
const ALL = "dirs&files";

class FileSystem {
    // VALUE: start_dir_name => basic folder where tree hierarchy starts. For instance 'C:'
    constructor(start_dir_name) {
        if(start_dir_name == "" || start_dir_name == undefined) {
            this.stdirn = "R:";
        } else {
            this.stdirn = start_dir_name;
        }

        this.root_folder = new Folder(this.begin());
    }

    // Reads input path and returns directory on which path pointed
    // ERROR CASE: Returns ERRFILE
    readPath(path) {
        let dirs = path.split('/');
        let curr_dir = this.root_folder;
        let curr_level = 0;

        if(dirs[dirs.length-1] == ' ' || dirs[dirs.length-1] == '') {
            dirs.pop();
        }

        while(curr_level < dirs.length)
        {
            if(dirs[curr_level] == curr_dir.name)
            {
                curr_level++;
                if(curr_level < dirs.length)
                    curr_dir = curr_dir.getByName(dirs[curr_level]);
            }
            else {
                
                return ERRFILE;
            }
        } 
        return curr_dir;
    }

    // Checks is path in the system
    // RETURNS: true or false
    existPath(path) {
        let f = this.readPath(path);
        if(f != ERRFILE) {
            return true;
        } else {
            return false;
        }
    }

    // Print ALL system files, folder etc. in the js console.
    printHierarchyTree() {
        let c = "TREE DIRS\n"+this.begin()+"\n";

        this.root_folder.binder_list.forEach(bind => {
            if(bind.type() == FILE) {
                c += "  \\_ [FILE] | " + bind.name + '\n';
            } else {
                c += "  \\_ [DIR]  | " + bind.name + '\n';
                c += bind.__print_tree(2);
            }
        });

        console.log(c);
    }

    // Returns begin of every path in this system
    begin() {
        return this.stdirn;
    }
}

class DirFollower {
    constructor(system) {
        this.system = system;
        this.curr_path = system.begin() + '/';
    }

    //[TO FIX] USING FILE IN THE PATH AS FOLDER
    // moving pointer in the files ['..' -> go out ; 'path' -> go to typed path]
    goto(dir) {
        if(dir == "..") {
            if(this.curr_path == this.system.begin() + '/') {
                return "Cannot go back directory";
            } else {
                let splitp = this.curr_path.split('/');
                let new_p = "";
                for (let i = 0; i < splitp.length-2; i++) {
                    new_p += splitp[i] + '/';
                }
                if(this.system.existPath(new_p)) {
                    this.curr_path = new_p;
                    this.onChangePathEvent();
                    return "Successful executed";
                } else {
                    return "ERRGO: Invalid Coming back";
                }
            }
        } else if(!dir.includes("/")) {
            let new_p;
            if(dir[0] == 'R' && dir[1] == ':' && dir[2] == '/') {
                new_p = dir;
            } else {
                new_p = this.curr_path + dir + '/';
            }
            if(this.system.existPath(new_p) && this.system.readPath(new_p).type() == DIR) {
                this.curr_path = new_p;
                this.onChangePathEvent();
                return "Successful executed";
            } else {
                return "ERRFIND: Invalid Directory '" + dir +"'";
            }
        } else {
            return "FORBBIDEN_SIGNS";
        }
    }

    // Returns currently chose directory [object]
    getCurrentDir() {
        return this.system.readPath(this.curr_path);
    }

    // Create directory in the current path
    mkdir(name_dir) {
        if(this.system.existPath(this.curr_path)) {
            this.system.readPath(this.curr_path).pushBinder(new Folder(name_dir));
            return "Directory Created at place '" + this.curr_path + name_dir + "/'";
        } else {
            return "ERREXT: Path to make directory doesn't exist";
        }
    }

    // Create file in the current path
    mkfile(name_file) {
        if(this.system.existPath(this.curr_path)) {
            this.system.readPath(this.curr_path).pushBinder(new File(name_file));
            return "File Created at place '" + this.curr_path + name_file + "'";
        } else {
            return "ERREXT: Path to make directory doesn't exist";
        }
    }

    // Delete the binder from current path
    del(name) {
        if(this.system.existPath(this.curr_path)) {
            if(this.system.readPath(this.curr_path + name).type() == DIR) {
                if(this.system.readPath(this.curr_path + name).countAll() != 0) {
                    let ans = prompt("Are you sure to delete " + name + "? This folder contains other files. [Y/N]");
                    if(ans.toLowerCase() == 'y') {
                        return this.del_noq(name);
                    } else if(ans.toLowerCase() == 'n') {
                        return "Deleting directory cancelled.";
                    }
                } else {
                    this.onChangePathEvent();
                    return this.del_noq(name);
                }
            } else {
                this.onChangePathEvent();
                return this.del_noq(name);
            }
        } else {
            return "ERREXT: Path to delete directory doesn't exist";
        }
    }

    // Continuation of del(name) method. Permanently delete item
    del_noq(name) {
        let index = this.system.readPath(this.curr_path).getIndexOf(name);
        this.system.readPath(this.curr_path).removeBinder(index);
        return "Item " + name + " successfuly deleted from '" + this.curr_path + "'";

    }

    // Count sepcific items by filterring data [DIR, FILE, ALL]
    count(filter) {
        switch (filter) {
            case DIR:
                return this.system.readPath(this.curr_path).countDirs();
                break;
            case FILE:
                return this.system.readPath(this.curr_path).countFiles();
            break;
            case ALL:
                return this.system.readPath(this.curr_path).countAll();
                break;
            default:
                return "ERRCNT: Invalid filter. Available filters counting: [DIR], [FILE], [ALL]";
                break;
        }
    }

    // Returns list of all items in the currently chosen directory
    getBinders() {
        if(this.system.existPath(this.curr_path)) {
            return this.system.readPath(this.curr_path).binder_list;
        }
    }

    //Returns item with index
    getItemBy(index) {
        if(index > -1 && index < this.getBinders().length) {
            return this.getBinders()[index];
        } else {
            return "INVALID INDEX";
        }
    }

    // Print currently chosen directory
    pdir() {
        this.system.readPath(this.curr_path).printDirectory();
    }

    // Return full path going to current directory
    getPath() {
        return this.curr_path;
    }

    // Event is called if path is changed
    onChangePathEvent() { ; }
}

class BinderObject {
    // VALUE: name => name of item
    constructor(name) {
        this.name = name;
        let dd = new Date();
        this.date = dd.getMonth() + "/" + dd.getDay() + "/" + dd.getFullYear();
        this.time = ((dd.getHours() < 10)? "0":"") + dd.getHours() + ":" + ((dd.getMinutes() < 10)? "0":"") + dd.getMinutes();
        this.icon = "icon-default-app";
    }

    getByName(name) {
        return 'x-BinderObject-x';
    }

    type() {
        return BINDER;
    }
}

class Folder extends BinderObject {
    // VALUE: name => name of new folder
    constructor(name) {
        super(name); // calls constructor of BinderObject
        this.binder_list = [];
        this.slct_pos = NONE;
        this.icon = "icon-folder-open";
    }

    // Pushes to folder new Item
    pushBinder(ext_binder) {
        this.binder_list.push(ext_binder);
    }

    // Removes from folder item with index
    removeBinder(index) {
        this.binder_list.splice(index, 1);
    }

    // Returns index in the folder of the item with name
    getIndexOf(name) {
        for (let i = 0; i < this.binder_list.length; i++) {
            if(this.binder_list[i].name == name) {
                return i;
            }
        }
    }

    // Returns item object by index
    getByIndex(index) {
        if(index < this.binder_list.length && index >= 0) {
            return this.binder_list[index];
        }
    }

    // Returns item object by name
    // ERROR CASE: Returns ERRFILE
    getByName(name) {
        let result = ERRFILE;

        this.binder_list.forEach(bind => {
            if(bind.name == name) {
                result = bind;
            }
        });

        return result;
    }

    // Prints in the js console items of the folder
    printDir() {
        let c = "DIR " + this.name + ":\n";

        this.binder_list.forEach(bind => {
            if(bind.type() == FILE) {
                c += "\\_ [FILE] | " + bind.name + '\n';
            } else {
                c += "\\_ [DIR]  | " + bind.name + '\n';
            }
        });

        console.log(c);
    }

    __print_tree(a) {
        let c = "";
        let add = "";
        for(let i=0; i < a; i++) {
            add += "   ";
        }
        this.binder_list.forEach(bind => {
            if(bind.type() == FILE) {
                c += add + "\\_ [FILE] | " + bind.name + '\n';
            } else {
                c += add + "\\_ [DIR]  | " + bind.name + '\n';
                c += bind.__print_tree(a+2);
            }
        });
        return c;
    }

    // Count all files & dirs.
    countAll() {
        return this.binder_list.length;
    }

    // Count only files.
    countFiles() {
        let n = 0;

        this.binder_list.forEach(bind => {
            if(bind.type() == FILE) {
                n++;
            }
        });

        return n;
    }

    // Count only dirs.
    countDirs(){
        let n = -1;

        this.binder_list.forEach(bind => {
            if(bind.type() == DIR) {
                if(n == -1) {
                    n = 0;
                }
                n++;
            }
        });

        return n;
    }

    // Returns type of item [DIR]
    type() {
        return DIR;
    }
}

class File extends BinderObject {
    // VALUE: name => name of new folder
    constructor(name, ico) {
        super(name); // calls constructor of BinderObject
        if(ico == undefined) {
            this.icon = "icon-file";
        } else {
            this.icon = ico;
        }
        
    }

    // Returns THIS object. Method extended
    getByName(name) {
        return this;
    }
    // Returns type of item [FILE]
    type() {
        return FILE;
    }
}