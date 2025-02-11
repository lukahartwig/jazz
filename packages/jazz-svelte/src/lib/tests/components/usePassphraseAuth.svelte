<script lang="ts">
  import { usePassphraseAuth } from "../../auth/PassphraseAuth.svelte.js";

  let { wordlist, setResult }: { wordlist: string[]; setResult: (value: ReturnType<typeof usePassphraseAuth>) => void } = $props();

  const auth = usePassphraseAuth({ wordlist });
  
  $effect(() => {
    setResult({
      state: auth.state,
      passphrase: auth.passphrase,
      logIn: auth.logIn,
      signUp: auth.signUp
    });
  });
</script>

<div>Test Component</div> 