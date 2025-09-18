import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { baseBGColor, primaryColor } from './Color';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { getActiveSubjects, getDBConnection, Subject } from '../DataBase/db';
import Loader from './Loader';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const Tools = () => {
  
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<any>();
 
  const cardPairs: {name:string}[][] = [];
  const data = [{name:"PDF",icon:"file-pdf",nav:()=>{navigation.navigate("PDFManager")}},
       {name:"GPA Progress",icon:"graduation-cap",nav:()=>{navigation.navigate("GpaProgress")}},
       {name:"Class Notifications",icon:"clock",nav:()=>{}},
       {name:"Grading Scale",icon:"chart-simple",nav:()=>{navigation.navigate("GradingScale")}}];

  for (let i = 0; i < data.length; i += 2) {
    cardPairs.push(data.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.screen}>
      <TopNavigationAccessoriesShowcase title="Tools" />
      <ScrollView contentContainerStyle={styles.container}>
        
     
        {cardPairs.map((pair, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {pair.map((item, colIndex) => (
              <TouchableWithoutFeedback
                key={colIndex}
                onPress={
                  item.nav
                }
              >
                <View style={styles.card}>
                  <FontAwesome6 name={item.icon} size={100} style={[styles.icon]} iconStyle="solid" />
                  <Text   numberOfLines={2}  ellipsizeMode='tail' style={styles.title}>{item.name}</Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
            {pair.length === 1 && (
              <View style={[styles.card, { opacity: 0 }]} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Loader sirf data fetch ke dauran center mein */}
      <Loader visible={loading}  animationSpeedMultiplier={1.0} />
    </SafeAreaView>
  );
};

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 48) / 2;

const styles = StyleSheet.create({
  icon:{
    color:primaryColor,
    flexWrap: 'wrap'
  },
  screen: {
    flex: 1,
    backgroundColor: '#212b46',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    padding:10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderColor: primaryColor,
    borderWidth: 4,
    position: 'relative',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    margin:10,
    flexWrap: 'wrap',        // allow wrapping
    includeFontPadding: false,
    textAlign: 'center',       // ya "justify"
    color: baseBGColor,
  },

  subtitle: {
    fontSize: 14,
    color: baseBGColor,
    marginBottom: 2,
  },

  errorBox: {
    backgroundColor: '#ffe5e5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff4d4d',
  },
  errorText: {
    color: '#900',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Tools;
