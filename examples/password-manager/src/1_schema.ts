import {
  Account,
  CoList,
  CoMap,
  CoPlainText,
  Group,
  Profile,
  co,
} from "jazz-tools";

export class PasswordItem extends CoMap {
  name = co.ref(CoPlainText);
  username = co.optional.ref(CoPlainText);
  username_input_selector = co.optional.string;
  password = co.ref(CoPlainText);
  password_input_selector = co.optional.string;
  uri = co.optional.ref(CoPlainText);
  folder = co.ref(Folder);
  deleted = co.boolean;
}

export class PasswordList extends CoList.Of(co.ref(PasswordItem)) {}

export class Folder extends CoMap {
  name = co.ref(CoPlainText);
  items = co.ref(PasswordList);
}

export class FolderList extends CoList.Of(co.ref(Folder)) {}

export class PasswordManagerAccountRoot extends CoMap {
  folders = co.ref(FolderList);
}

export class PasswordManagerAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(PasswordManagerAccountRoot);

  migrate() {
    if (!this._refs.root) {
      const group = Group.create({ owner: this });
      const firstFolder = Folder.create(
        {
          name: CoPlainText.create("Default", { owner: group }),
          items: PasswordList.create([], { owner: group }),
        },
        { owner: group },
      );

      firstFolder.items?.push(
        PasswordItem.create(
          {
            name: CoPlainText.create("Gmail", { owner: group }),
            username: CoPlainText.create("user@gmail.com", { owner: group }),
            password: CoPlainText.create("password123", { owner: group }),
            uri: CoPlainText.create("https://gmail.com", { owner: group }),
            folder: firstFolder,
            deleted: false,
          },
          { owner: group },
        ),
      );

      firstFolder.items?.push(
        PasswordItem.create(
          {
            name: CoPlainText.create("Facebook", { owner: group }),
            username: CoPlainText.create("user@facebook.com", { owner: group }),
            password: CoPlainText.create("facebookpass", { owner: group }),
            uri: CoPlainText.create("https://facebook.com", { owner: group }),
            folder: firstFolder,
            deleted: false,
          },
          { owner: group },
        ),
      );

      this.root = PasswordManagerAccountRoot.create(
        {
          folders: FolderList.create([firstFolder], {
            owner: this,
          }),
        },
        { owner: this },
      );
    }
  }
}
