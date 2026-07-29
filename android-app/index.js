/**
 * @format
 */

// Must be the very first import: react-native-gesture-handler requires this to
// run before anything else so its native handlers are registered correctly.
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
