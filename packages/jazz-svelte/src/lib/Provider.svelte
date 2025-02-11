<script lang="ts" module>
  export type Props<Acc extends Account = Account> = JazzContextManagerProps<Acc> & {
    children?: Snippet;
  };
</script>

<script lang="ts" generics="Acc extends Account">
  import { JazzBrowserContextManager, type JazzContextManagerProps } from 'jazz-browser';
  import type { AuthSecretStorage } from 'jazz-tools';
  import { Account } from 'jazz-tools';
  import { type Snippet, setContext, untrack } from 'svelte';
  import { JAZZ_AUTH_CTX, JAZZ_CTX, type JazzContext } from './jazz.svelte.js';

  let props: Props<Acc> = $props();

  const contextManager = new JazzBrowserContextManager<Acc>();

  const ctx = $state<JazzContext<Acc>>({ current: undefined });
  setContext<JazzContext<Acc>>(JAZZ_CTX, ctx);
  setContext<AuthSecretStorage>(JAZZ_AUTH_CTX, contextManager.getAuthSecretStorage());

  $effect(() => {
    props.sync.when;
    props.sync.peer;
    props.storage;
    props.guestMode;
    return untrack(() => {
      if (!props.sync) return;

      contextManager
        .createContext({
          sync: props.sync,
          storage: props.storage,
          guestMode: props.guestMode,
          AccountSchema: props.AccountSchema,
          defaultProfileName: props.defaultProfileName,
          onAnonymousAccountDiscarded: props.onAnonymousAccountDiscarded,
          onLogOut: props.onLogOut,
        })
        .catch((error) => {
          console.error('Error creating Jazz browser context:', error);
        });
    });
  });

  $effect(() => {
    return contextManager.subscribe(() => {
      ctx.current = contextManager.getCurrentValue();
    });
  });
</script>

{#if ctx.current}
  {@render props.children?.()}
{/if}
