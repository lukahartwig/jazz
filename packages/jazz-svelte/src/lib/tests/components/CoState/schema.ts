import { Account, co, CoMap } from "jazz-tools";

export class Dog extends CoMap {
    name = co.string;
  }

export class Person extends CoMap {
    name = co.string;
    age = co.number;
    dog = co.ref(Dog);
}

export class MyAccount extends Account {
    root = co.ref(Person);

    migrate() {
        if (!this._refs.root) {
            this.root = Person.create({ name: "John", age: 30, dog: Dog.create({ name: "Rex" }, this) }, this);
        }
    }
}
