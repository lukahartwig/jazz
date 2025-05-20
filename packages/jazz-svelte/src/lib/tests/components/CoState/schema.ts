import { Account, coField, CoMap } from "jazz-tools";

export class Dog extends CoMap {
    name = coField.string;
  }

export class Person extends CoMap {
    name = coField.string;
    age = coField.number;
    dog = coField.ref(Dog);
}

export class MyAccount extends Account {
    root = coField.ref(Person);

    migrate() {
        if (!this._refs.root) {
            this.root = Person.create({ name: "John", age: 30, dog: Dog.create({ name: "Rex" }, this) }, this);
        }
    }
}
