import { Account, AnonymousJazzAgent } from "jazz-tools";
import { getJazzContextShape } from "jazz-tools/testing";
import { provide } from "vue";
import { PropType, defineComponent, ref } from "vue";
import { JazzContextSymbol } from "./provider.js";

export const JazzTestProvider = defineComponent({
  name: "JazzTestProvider",
  props: {
    account: {
      type: Object as PropType<Account | { guest: AnonymousJazzAgent }>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const ctx = ref(getJazzContextShape(props.account));
    provide(JazzContextSymbol, ctx);

    return () => slots.default?.();
  },
});

export {
  createJazzTestAccount,
  createJazzTestGuest,
  linkAccounts,
  setActiveAccount,
} from "jazz-tools/testing";
