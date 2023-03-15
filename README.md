# @lumin/react-native

The Lumin SDK for React Native apps.

## Installation

```sh
npm install @uselumin/react-native @react-native-async-storage/async-storage
```

Then run:

```sh
npx pod-install
```

## Usage

```js
import { Lumin } from '@uselumin/react-native';

// ...

const lumin = new Lumin("<yourLuminToken>");

lumin.init();
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
