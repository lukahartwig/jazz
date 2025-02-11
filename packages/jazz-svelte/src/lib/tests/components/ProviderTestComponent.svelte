<script lang="ts">
  import { JazzProvider } from "../../jazz.svelte.js";

  const { guestMode } = $props();
</script>

<div data-testid="provider-test">
  <JazzProvider {guestMode} peer="wss://cloud.jazz.tools/?key=jazz-svelte-test">
    <span data-testid="provider-auth-test">Hello</span>
  </JazzProvider>
</div>
