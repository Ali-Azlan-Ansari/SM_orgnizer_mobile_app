import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { baseBGColor, primaryColor } from './Color';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { getActiveSubjects, getDBConnection, Subject } from '../DataBase/db';
import Loader from './Loader';

const ActiveSubject = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();


useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // 👇 Back button press → close app
        BackHandler.exitApp();
        return true; // prevent default
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  
  useEffect(() => {
    const fetchActiveSubjects = async () => {
      setLoading(true);
      try {
        const db = await getDBConnection();
        const result = await getActiveSubjects(db);
        setSubjects(result);
      } catch (e: any) {
        console.warn('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    if (isFocused) {
      fetchActiveSubjects();
    }
  }, [isFocused]);

  const cardPairs: Subject[][] = [];
  const data = subjects;

  for (let i = 0; i < data.length; i += 2) {
    cardPairs.push(data.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.screen}>
      <TopNavigationAccessoriesShowcase title="Active Subject" />
      <ScrollView contentContainerStyle={styles.container}>
        
     
        {cardPairs.map((pair, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {pair.map((item, colIndex) => (
              <TouchableWithoutFeedback
                key={colIndex}
                onPress={() =>
                  navigation.navigate('ImageGalleryScreen', {
                    subjectId: item.id,
                  })
                }
              >
                <View style={styles.card}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.subtitle}>
                    Teacher: {item.teacher_name}
                  </Text>
                  <Text style={styles.subtitle}>
                    Abbr: {item.abbreviation}
                  </Text>
                  <Text style={styles.subtitle}>
                    Semester: {item.semester}
                  </Text>
                  <Text style={styles.subtitle}>
                    Date:
                    {item.date
                      ? new Date(item.date)
                          .toLocaleDateString('en-US', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit',
                          })
                          .replace(/\//g, '-')
                      : 'No date'}
                  </Text>
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
    padding: 10,
    borderRadius: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
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

export default ActiveSubject;
