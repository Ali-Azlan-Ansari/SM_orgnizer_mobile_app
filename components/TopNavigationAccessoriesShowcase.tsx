import React from 'react';
import {
  Icon,
  IconElement,
  Layout,
  MenuItem,
  OverflowMenu,
  TopNavigation,
  TopNavigationAction,
} from '@ui-kitten/components';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { TouchableWebElement } from '@ui-kitten/components/devsupport';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { backgroundColor } from './Color';
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

  const handleBackPress = (rout:String) => {
console.log("hello")
    if(rout){
      navigation.navigate(rout)
    }else{
      if(navigation.canGoBack()){
      navigation.goBack()
      }
    }  
  };



export const TopNavigationAccessoriesShowcase = (props:{rout:string,title:string}): React.ReactElement => {

  const [menuVisible, setMenuVisible] = React.useState(false);

  const toggleMenu = (): void => {
    setMenuVisible(!menuVisible);
  };



  const renderRightActions = (): React.ReactElement => (
    <FontAwesome6 name="square-plus" style={styles.iconStyle} iconStyle="solid" />
  
  );

  const renderBackAction = () => (
    <FontAwesome6 onPress={() => handleBackPress(props.rout)} name="arrow-left" style={styles.iconStyle} iconStyle="solid" />
  );

  return (
    <Layout
      style={styles.container}
      level='1'
    >
      <TopNavigation
        alignment='center'
        title={props.title}
        style={styles.nav}
        accessoryLeft={renderBackAction}
        // accessoryRight={renderRightActions}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
   
  },
  nav:{
     backgroundColor:backgroundColor
  },
  iconStyle:{
        fontSize: 24,
        color: "#ffffff",
        marginBottom: 4,
        marginHorizontal:8,
        width:50
  }
});