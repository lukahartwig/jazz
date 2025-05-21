<script lang="ts">
import { useAccount } from "jazz-svelte";

const account = useAccount({
  root: {},
});

$inspect(account);
</script>

<div class="container">
  <h1>Welcome back, {account?.me?.profile?.name}</h1>
  <button class="bg-blue-500 text-white p-2 rounded" onclick={() => account.logOut()}
    >Log out</button
  >
</div>
