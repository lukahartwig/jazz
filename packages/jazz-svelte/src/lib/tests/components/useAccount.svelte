<script lang="ts" module>
  export type Props = {
    depth?: RefsToResolve<RegisteredAccount>;
    setResult: (result: ReturnType<typeof useAccount> | undefined) => void;
  };
</script>

<script lang="ts">
  import { useAccount, type RegisteredAccount } from '../../jazz.svelte.js';
  import type { RefsToResolve } from 'jazz-tools';

  let { depth, setResult }: Props = $props();

  if (depth) {
    const result = $derived(useAccount({
      resolve: depth
    }));

    $effect(() => {
      setResult(result);
    });
  } else {
    const result = $derived(useAccount());
  
    $effect(() => {
      setResult(result);
    });
  }
</script>
