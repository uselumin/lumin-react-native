import * as React from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';

import { Lumin } from '@uselumin/react-native';

const lumin = new Lumin('clgxl0fc200013t6cbmw74m9b:clgxl0fc200003t6cub9gplzn', {
  url: 'http://localhost:3000',
});

lumin.init();

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Test</Text>
      <Button
        title="Track Event"
        onPress={() => {
          lumin.trackCustomEvent('test_event');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
