<script lang="ts" module>
  export type Props = {
    depth?: RefsToResolve<RegisteredAccount>;
    setResult: (result: ReturnType<typeof useAccountOrGuest> | undefined) => void;
  };
</script>

<script lang="ts">
  import { useAccountOrGuest, type RegisteredAccount } from '../../jazz.svelte.js';
  import type { RefsToResolve } from 'jazz-tools';

  let { depth, setResult }: Props = $props();

  if (depth) {
    const result = $derived(useAccountOrGuest({
      resolve: depth
    }));

    $effect(() => {
      setResult(result);
    });
  } else {
    const result = $derived(useAccountOrGuest());
  
    $effect(() => {
      setResult(result);
    });
  }
</script>
