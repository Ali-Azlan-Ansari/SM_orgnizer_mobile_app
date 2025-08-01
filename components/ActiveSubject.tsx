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

const ActiveSubject = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchActiveSubjects = async () => {
      const db = await getDBConnection();
      const result = await getActiveSubjects(db);
      setSubjects(result);
    };
    if (isFocused) {
      fetchActiveSubjects();
    }
  }, [isFocused]);

  const cardPairs = [];
  const data = subjects;

  for (let i = 0; i < data.length; i += 2) {
    cardPairs.push(data.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.screen}>
      <TopNavigationAccessoriesShowcase rout="" title='Active Subject'/>
      <ScrollView contentContainerStyle={styles.container}>
        {cardPairs.map((pair, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {pair.map((item, colIndex) => (
              <TouchableWithoutFeedback
                key={colIndex}
                onPress={() => navigation.navigate('ImageGalleryScreen', { subjectId: item.id })}
              >
                <View style={styles.card}>
                  <View style={styles.label}>
                    <Text style={styles.labelText}>Subject</Text>
                  </View>

                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.subtitle}>
                    Teacher: {item.teacher_name}
                  </Text>
                  <Text style={styles.subtitle}>Abbr: {item.abbreviation}</Text>
                  <Text style={styles.subtitle}>Semester: {item.semester}</Text>
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
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'flex-start', // Left align text like a book
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

  label: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: primaryColor,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 1,
  },

  labelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ActiveSubject;
