# @uselumin/react-native

The Lumin SDK for React Native apps.

## Installation

### Without Expo

```sh
npm install @uselumin/react-native @react-native-async-storage/async-storage
```

Then run:

```sh
npx pod-install
```

### With Expo

```sh
npx expo install @uselumin/react-native @react-native-async-storage/async-storage
```

There's no need to run `npx pod-install` when using Expo.

## Usage

```js
import { Lumin } from '@uselumin/react-native';

// ...

const lumin = new Lumin("<yourLuminToken>");

lumin.init();
```

You can find your app's token in the app's settings on Lumin.

## Sending Custom Events

If you want to send custom events that are then counted and displayed by Lumin, you can use the following function:

```javascript
lumin.trackCustomEvent("EVENT_NAME", {
    // ... any additional JSON data you might want to pass.
    // Lumin doesn't do anything with this data (yet), but it will be saved and part of any data exports.
});
```

## Why is async-storage needed?

Lumin's goal is not to collect and persist any data would allow anyone to differentiate one user from another. Data of this kind is often called personally identifiable information (PII), and it's what GDPR is all about. This poses a problem though: to say that someone using your app is a "daily active user" (DAU) or even a "monthly active user" (MAU), we need a way to tell if this person has used your app before and when. (e.g. if they used the app earlier today) So we need a way to record the last time someone was counted as a DAU and then see if that time was before the beginning of the current day. If it was, they are a DAU for today. But if it wasn't, that means that they already opened the app earlier today and they won't be counted again. All this has to happen on the user's device, because, again, we don't want to save any PII. That's what we use async-storage for: the timestamps of the last time a user (or really, a device) was counted as a DAU, WAU, MAU or YAU.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
