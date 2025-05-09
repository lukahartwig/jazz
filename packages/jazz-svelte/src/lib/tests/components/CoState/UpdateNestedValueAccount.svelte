<script lang="ts" module>
  export type Props = {
    id: ID<Person>;
  };
</script>

<script lang="ts">
  import { AccountCoState } from '../../../jazz.class.svelte.js';

  import { type ID } from 'jazz-tools';
  import { MyAccount, Person } from './schema.js';

  const person = new AccountCoState<MyAccount, { root: { dog: true } }>({
    resolve: {
      root: {
        dog: true
      }
    }
  });
</script>

<!-- Using non-null assertions because we want to test that locally available values are never null -->
<label>
  Name
  <input type="text" bind:value={person.current!.root.name} />
</label>

<label>
  Dog
  <input type="text" bind:value={person.current!.root.dog.name} />
</label>

<div data-testid="person-name">{person.current!.root.name}</div>
<div data-testid="person-dog-name">{person.current!.root.dog.name}</div>
