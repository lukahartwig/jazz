import {
  Account,
  AccountClass,
  JazzContextManager,
  KvStore,
  SyncConfig,
} from "jazz-tools";
import { JazzContextManagerAuthProps } from "jazz-tools";
import {
  BaseReactNativeContextOptions,
  createJazzReactNativeContext,
  createJazzReactNativeGuestContext,
} from "./platform.js";
import { KvStoreContext } from "./storage/kv-store-context.js";

export type JazzContextManagerProps<Acc extends Account> = {
  guestMode?: boolean;
  sync: SyncConfig;
  onLogOut?: () => void;
  storage?: BaseReactNativeContextOptions["storage"];
  AccountSchema?: AccountClass<Acc>;
  defaultProfileName?: string;
  onAnonymousAccountDiscarded?: (anonymousAccount: Acc) => Promise<void>;
  CryptoProvider?: BaseReactNativeContextOptions["CryptoProvider"];
};

export class ReactNativeContextManager<
  Acc extends Account,
> extends JazzContextManager<Acc, JazzContextManagerProps<Acc>> {
  async createContext(
    props: JazzContextManagerProps<Acc>,
    authProps?: JazzContextManagerAuthProps,
  ) {
    let currentContext;

    // We need to store the props here to block the double effect execution
    // on React. Otherwise when calling propsChanged this.props is undefined.
    this.props = props;

    if (props.guestMode) {
      currentContext = await createJazzReactNativeGuestContext({
        sync: props.sync,
        storage: props.storage,
        authSecretStorage: this.authSecretStorage,
        CryptoProvider: props.CryptoProvider,
      });
    } else {
      currentContext = await createJazzReactNativeContext<Acc>({
        sync: props.sync,
        storage: props.storage,
        AccountSchema: props.AccountSchema,
        credentials: authProps?.credentials,
        newAccountProps: authProps?.newAccountProps,
        defaultProfileName: props.defaultProfileName,
        authSecretStorage: this.authSecretStorage,
        CryptoProvider: props.CryptoProvider,
      });
    }

    await this.updateContext(props, currentContext, authProps);
  }

  getKvStore(): KvStore {
    return KvStoreContext.getInstance().getStorage();
  }

  propsChanged(props: JazzContextManagerProps<Acc>) {
    if (!this.props) {
      return true;
    }

    return (
      this.props.sync.when !== props.sync.when ||
      this.props.sync.peer !== props.sync.peer ||
      this.props.guestMode !== props.guestMode
    );
  }
}
