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


const Stack = createStackNavigator();
const TabNav=()=>(
 <Tab.Navigator
  screenOptions={({ route }) => ({
    headerShown: false,

    // ✅ Tab bar styling
    tabBarStyle: {
      backgroundColor: backgroundColor, // your defined dark background
      borderTopWidth: 0,                // no top border
      elevation: 0,                     // remove shadow on Android
      shadowOpacity: 0,                 // remove shadow on iOS
      height: 70,
      paddingTop: 10,
      paddingBottom: 10,
    },

    // ✅ Label styling
    tabBarLabelStyle: {
      marginTop: -4,
      fontSize: 12,
    },

    // ✅ Active/inactive color
    tabBarActiveTintColor: primaryColor,
    tabBarInactiveTintColor: '#ffffff',

    // ✅ Icon rendering
    tabBarIcon: ({ focused, color, size }) => {
      const iconStyle = {
        fontSize: size,
        color: color,
        marginBottom: 4,
      };

      switch (route.name) {
        case 'Active':
          return <FontAwesome6 name="book-open" style={iconStyle} iconStyle="solid" />;
        case 'Set Active':
          return <FontAwesome6 name="list-check" style={iconStyle} iconStyle="solid" />;
        case 'Scanner':
          return <FontAwesome6 name="camera-retro" style={iconStyle} iconStyle="solid" />;
        case 'Subject':
          return <FontAwesome6 name="book" style={iconStyle} iconStyle="solid" />;
        case 'Crater':
          return <FontAwesome6 name="laptop-code" style={iconStyle} iconStyle="solid" />;
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
  <Tab.Screen name="Crater" component={Crater} />
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



const HomeScreen = () => (
  <Layout style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text category='h1'>Under Development</Text>
  </Layout>
);
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
const ActiveSubject1 = () => {
   const [selectedIndex, setSelectedIndex] = React.useState<IndexPath[]>([
    new IndexPath(0),
    new IndexPath(1),
  ]);
  
    
 

  return (
    <Layout
      style={styles.container}
      level='1'
    >
      <Select
        multiSelect={true}
        selectedIndex={selectedIndex}
        onSelect={(index) => setSelectedIndex(index as IndexPath[])}
      >
        <SelectItem title='Option 1' />
        <SelectItem title='Option 2' />
        <SelectItem title='Option 3' />
      </Select>
    </Layout>
  );
};


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


   /* <IconRegistry icons={EvaIconsPack} />
    <ApplicationProvider {...eva} theme={eva.light}>
      <ActiveSubject/>
      <Scanner /> 
      <BNB/>
    </ApplicationProvider> */
 
  
)};
