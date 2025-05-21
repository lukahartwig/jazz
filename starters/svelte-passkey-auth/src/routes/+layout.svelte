<script lang="ts">
import { JazzProvider } from "jazz-svelte";
import { apiKey } from "../apiKey";
import "../app.css";

let { children } = $props();
</script>

<JazzProvider
  sync={{
    peer: `wss://cloud.jazz.tools/?key=${apiKey}`
  }}
>
  {@render children?.()}
</JazzProvider>
