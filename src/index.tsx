import React, {
  SFC,
  useState,
  useEffect,
  ReactNode,
  Component,
  useContext,
  createContext,
} from "react";

import produce from "immer";
import shallowequal from "shallowequal";

const logKey = "MREDUX_DEV_LOG";

if (typeof window !== "undefined") {
  window[logKey] = false;
}

const devLog = (...args: any[]) => {
  if (window && window[logKey]) {
    console.log(...args);
  }
};

const devTrace = (...args: any[]) => {
  if (window && window[logKey]) {
    console.trace(...args);
  }
};

export interface IMReduxStore<T> {
  getState: () => T;
  update: (f: (store: T) => void) => void;
  updateAt: <K extends keyof T>(k: K, f: (x: T[K]) => void) => void;
  subscribe: (f: (store: T) => void) => { unsubscribe: () => void };
}

interface IMReduxProviderProps {
  value: IMReduxStore<any>;
  children: ReactNode;
}

interface IMReduxDataLayerProps {
  Child: any;
  parentProps: any;
  computedProps: any;
}

const MReduxContext = createContext(null);

const { Provider } = MReduxContext;

const createStore = <T extends unknown>(initalState: T) => {
  const mReduxContainer = {
    currentState: initalState,
    listeners: [],
  };

  const emitChange = () => {
    devLog("Emit data", mReduxContainer.currentState);

    mReduxContainer.listeners.forEach((cb) => {
      cb(mReduxContainer.currentState);
    });
  };

  return {
    getState: () => mReduxContainer.currentState,
    update: (f: (store: T) => void) => {
      devTrace("Update with f", f);

      mReduxContainer.currentState = produce(
        mReduxContainer.currentState as any,
        f,
      );

      emitChange();
    },
    updateAt: <K extends keyof T>(k: K, f: (x: T[K]) => void) => {
      devTrace("Update partial with f", f);

      mReduxContainer.currentState = produce(
        mReduxContainer.currentState as any,

        (store) => {
          f(store[k]);
        },
      );

      emitChange();
    },
    subscribe: (f: (store: T) => void) => {
      mReduxContainer.listeners.unshift(f);

      return {
        unsubscribe: () => {
          mReduxContainer.listeners = mReduxContainer.listeners.filter(
            (x) => x !== f,
          );
        },
      };
    },
  } as IMReduxStore<T>;
};

const MReduxProvider: SFC<IMReduxProviderProps> = (props) => {
  const { value, children } = props;

  const [storeValue, setStoreValue] = useState(value.getState());

  devLog("Provide value:", storeValue);

  useEffect(() => {
    const result = value.subscribe(() => {
      setStoreValue(value.getState());

      devLog("Provide new value:", value.getState());
    });

    console.info("MRedux provider is now listening.");

    return () => {
      result.unsubscribe();
    };
  }, [value]);

  return <Provider value={storeValue}>{children}</Provider>;
};

class MReduxDataLayer extends Component<IMReduxDataLayerProps> {
  render() {
    const { Child, computedProps, parentProps } = this.props;

    return <Child {...computedProps} {...parentProps} />;
  }

  shouldComponentUpdate(nextProps: IMReduxDataLayerProps) {
    const { computedProps, parentProps } = this.props;

    if (!shallowequal(nextProps.parentProps, parentProps)) return true;

    if (!shallowequal(nextProps.computedProps, computedProps)) return true;

    return false;
  }
}

const connectMRedux = <T extends unknown>(
  selector: (s: T, ownProps?: any) => any,
): any => {
  return (Target: any) => {
    const MReduxContainer: SFC = (props) => {
      const storeValue: T = useContext(MReduxContext);

      return (
        <MReduxDataLayer
          Child={Target}
          parentProps={props}
          computedProps={selector(storeValue, props)}
        />
      );
    };

    return MReduxContainer;
  };
};

const useMReduxContext = <S, T>(selector: (s: S) => T): T => {
  let contextValue: S = useContext(MReduxContext);

  return selector(contextValue);
};

export { createStore, MReduxProvider, connectMRedux, useMReduxContext };
