import React, { useEffect } from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry, Layout,Text } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';
import { IndexPath, Select, SelectItem } from '@ui-kitten/components';
import { Scanner } from './components/Scanner';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { backgroundColor, primaryColor } from './components/Color';
import ActiveSubject from './components/ActiveSubject';
import { SetActiveSubject } from './components/SetActiveSubject';
import { TopNavigationAccessoriesShowcase } from './components/TopNavigationAccessoriesShowcase';
import SubjectManager from './components/SubjectManager';
import { createStackNavigator } from '@react-navigation/stack';
import AddSubject from './components/AddSubject';
import EditSubject from './components/EditSubject';
import ImageGalleryScreen from './components/ImageGalleryScreen';
import MyGallery from './components/ImageGalleryScreen';
import { getDBConnection, setupDatabaseTables } from './DataBase/db';
import HelpGuide from './components/Help';


const Stack = createStackNavigator();
const TabNav=()=>(
 <Tab.Navigator
 screenOptions={({ route }) => ({
  headerShown: false,

  tabBarStyle: {
    backgroundColor: backgroundColor, // kept as-is
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },

  tabBarLabelStyle: {
    fontSize: 12,
    marginTop: 0, // remove negative offset
    paddingTop: 2,
  },

  tabBarActiveTintColor: primaryColor,
  tabBarInactiveTintColor: '#ffffff',

  tabBarIcon: ({ focused, color, size }) => {
    // use the size prop directly for consistency
    switch (route.name) {
      case 'Active':
        return <FontAwesome6 name="book-open" size={size} color={color} iconStyle="solid" />;
      case 'Set Active':
        return <FontAwesome6 name="list-check" size={size} color={color} iconStyle="solid" />;
      case 'Scanner':
        return <FontAwesome6 name="camera-retro" size={size} color={color} iconStyle="solid" />;
      case 'Subject':
        return <FontAwesome6 name="book" size={size} color={color} iconStyle="solid" />;
      case 'Help':
        return <FontAwesome6 name="circle-info" size={size} color={color} iconStyle="solid" />;
      default:
        return null;
    }
  },
})}

>
  <Tab.Screen name="Active" component={ActiveSubject} />
  <Tab.Screen name="Set Active" component={SetActiveSubject} />
  <Tab.Screen name="Scanner" component={Scanner} />
  <Tab.Screen name="Subject" component={SubjectManager} />
  <Tab.Screen name="Help" component={HelpGuide} />
</Tab.Navigator>

)
const StackNav=()=>(
  <Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen name="MainTabs" component={TabNav} />
  <Stack.Screen name="AddSubject" component={AddSubject} />
  <Stack.Screen name="EditSubject" component={EditSubject} />
  <Stack.Screen name="ImageGalleryScreen" component={MyGallery} />
  
</Stack.Navigator>
)




const Crater = () => (
  <Layout style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text category='h1'>Under Development</Text>
  </Layout>
);
const styles = StyleSheet.create({
  container: {
    height:100,
  },
});



const Tab = createBottomTabNavigator();
 
export default () =>{
  useEffect(() => {
    const initDB = async () => {
      try {
        await setupDatabaseTables();
        console.log('Tables created successfully');
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    };

    initDB();
  }, []);

  return (
  <>
  <IconRegistry icons={EvaIconsPack} />
  <ApplicationProvider {...eva} theme={eva.dark}>
    <NavigationContainer>
   <StackNav/>  
    </NavigationContainer>
  </ApplicationProvider>
  </>

)};
