<script lang="ts" module>
  export type Props<R extends CoValue> = {
    Schema: CoValueClass<R>;
    id: ID<R>;
    resolve: RefsToResolve<R>;
    setResult: (result: R | undefined | null) => void;
  };
</script>

<script lang="ts" generics="R extends CoValue">
  import { useCoState } from '../../jazz.svelte.js';
  import type { CoValue, CoValueClass, RefsToResolve, ID } from 'jazz-tools';

  let { Schema, id, resolve, setResult }: Props<R> = $props();

  const result = $derived(useCoState(Schema, id, { resolve: resolve as any }));

  $effect(() => {
    setResult(result.current);
  });
</script>
