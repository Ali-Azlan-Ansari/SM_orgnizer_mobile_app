/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  // handle events (press, dismiss)
  if (type === EventType.PRESS) {
   
   
  }
});

AppRegistry.registerComponent(appName, () => App);
