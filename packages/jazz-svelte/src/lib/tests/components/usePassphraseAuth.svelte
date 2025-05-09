<script lang="ts">
  import { usePassphraseAuth } from '../../auth/PassphraseAuth.svelte.js';

  let {
    wordlist,
    setResult
  }: { wordlist: string[]; setResult: (value: Result) => void } = $props();

  const auth = usePassphraseAuth({ wordlist });

  const result = $derived({
    state: auth.state,
    passphrase: auth.passphrase,
    logIn: auth.logIn,
    signUp: auth.signUp
  });

  type Result = typeof result;

  $effect(() => {
    setResult(result);
  });
</script>

<div>Test Component</div>
