# m-redux

## Description

Mini Redux-like state manage tool with Immer built-in.

## Install

npm

```bash
npm install m-redux
```

yarn

```bash
yarn add m-redux
```

## Usage

### Model

src/store.ts

```ts
import { createStore } from "m-redux";

export interface IGlobalStore {
  count: number;
  obj: {
    objCount: number;
  };
}

const initialStore: IGlobalStore = {
  count: 0,
  obj: { objCount: 0 },
};

const globalStore = createStore<IGlobalStore>(initialStore);

export default globalStore;
```

### Controller

src/controller.ts

```ts
import { globalStore } from "./store";

const countInc = () => {
  globalStore.update((store) => {
    store.count += 1;
  });
};

const objCountInc = () => {
  globalStore.updateAt("obj", (obj) => {
    obj.objCount += 1;
  });
};

export { countInc, objCountInc };
```

### View

First step is to add `MReduxProvider` in root component:

src/main.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom";
import { MReduxProvider } from "m-redux";

import { globalStore } from "./store";

import { Container } from "./Container";

const renderApp = () => {
  ReactDOM.render(
    <MReduxProvider value={globalStore}>
      <Container store={globalStore.getState()} />
    </MReduxProvider>,
    document.querySelector("#app"),
  );
};

window.onload = () => {
  renderApp();

  globalStore.subscribe(renderApp);
};
```

To read data in child components with hooks, use `useMReduxContext`:

src/hooks-child.tsx

```tsx
import React, { FC } from "react";
import { useMReduxContext } from "m-redux";

import { IGlobalStore } from "./store";
import { countInc } from "./controller";

interface IProps {}

const HooksChild: FC<IProps> = (props) => {
  const count = useMReduxContext((store: IGlobalStore) => {
    return store.count;
  });

  return (
    <>
      <pre>count:{count}</pre>
      <a onClick={countInc}>countInc</a>
    </>
  );
};

export default HooksChild;
```

Child components with class, use `connectMRedux`:

src/class-child.tsx

```tsx
import React, { PureComponent } from "react";
import { connectMRedux } from "m-redux";

import { IGlobalStore } from "./store";
import { objCountInc } from "./controller";

interface IProps {
  objCount: number;
}

interface IState {}

@connectMRedux((store: IGlobalStore, ownProps: IProps) => {
  console.log("ownProps", ownProps);

  return { objCount: store.obj.objCount };
})
class ClassChild extends PureComponent<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const { objCount } = this.props;

    return (
      <>
        <pre>objCount:{objCount}</pre>
        <a onClick={objCountInc}>objCountInc</a>
      </>
    );
  }
}

export default ClassChild;
```

### Debug

```ts
window.MREDUX_DEV_LOG = true;
```

## License

[MIT](./LICENSE)
