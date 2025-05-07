import {
  Account,
  CoList,
  CoMap,
  CoPlainText,
  Group,
  Profile,
  co,
} from "jazz-tools";

export class ToDoItem extends CoMap {
  name = co.ref(CoPlainText);
  completed = co.boolean;
}

export class ToDoList extends CoList.Of(co.ref(ToDoItem)) {}

export class Folder extends CoMap {
  name = co.ref(CoPlainText);
  items = co.ref(ToDoList);
}

export class FolderList extends CoList.Of(co.ref(Folder)) {}

export class ToDoAccountRoot extends CoMap {
  folders = co.ref(FolderList);
}

export class ToDoAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(ToDoAccountRoot);

  migrate() {
    if (!this._refs.root) {
      const group = Group.create({ owner: this });
      const exampleTodo = ToDoItem.create(
        {
          name: CoPlainText.create("Example todo", { owner: group }),
          completed: false,
        },
        { owner: group },
      );

      const defaultFolder = Folder.create(
        {
          name: CoPlainText.create("Default", { owner: group }),
          items: ToDoList.create([exampleTodo], { owner: group }),
        },
        { owner: group },
      );

      this.root = ToDoAccountRoot.create(
        {
          folders: FolderList.create([defaultFolder], {
            owner: this,
          }),
        },
        { owner: this },
      );
    }
  }
}
