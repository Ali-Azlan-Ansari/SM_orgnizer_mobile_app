import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import {
  IndexPath,
  Layout,
  Select,
  SelectItem,
  Button,
} from '@ui-kitten/components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { primaryColor } from './Color';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { getDBConnection, getAllSubjects, updateSubject } from '../DataBase/db'; // adjust path if needed
import { useIsFocused } from '@react-navigation/native';
import Loader from './Loader'; // added loader

type Subject = {
  id: number;
  name: string;
  teacher_name: string;
  semester: string;
  abbreviation: string;
  active_subject: number;
};

export const SetActiveSubject = (): React.ReactElement => {
  const [selectedIndex, setSelectedIndex] = useState<IndexPath[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const db = await getDBConnection();
        const result = await getAllSubjects(db);
        setSubjects(result);

        // 🔸 Preselect active subjects
        const activeIndexes: IndexPath[] = result
          .map((s, i) => (s.active_subject === 1 ? new IndexPath(i) : null))
          .filter((i): i is IndexPath => i !== null);

        setSelectedIndex(activeIndexes);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const options = subjects.map(s => s.name);

  const handleActivate = async () => {
    setLoading(true);
    try {
      const db = await getDBConnection();
      const selectedNames = selectedIndex.map(idx => options[idx.row]);

      await Promise.all(
        subjects.map(async subject => {
          const updatedSubject = {
            ...subject,
            active_subject: selectedNames.includes(subject.name) ? 1 : 0,
          };
          await updateSubject(db, subject.id, updatedSubject);
        }),
      );

      const result = await getAllSubjects(db);
      setSubjects(result);
    } finally {
      setLoading(false);
    }
  };

  const GreenCheckIcon = ({ state, icon }: { state: boolean; icon: any }) => (
    <FontAwesome6
      name={icon}
      size={20}
      color={state ? primaryColor : '#676767ff'}
      style={state ? styles.Aico : styles.Iico}
      iconStyle="solid"
    />
  );

  return (
    <Layout style={styles.container} level="1">
      <Loader visible={loading} animationSpeedMultiplier={1.0} />
      <View>
        <TopNavigationAccessoriesShowcase rout="" title='Set Active Subject'/>
      </View>

      {/* Top Select - 10% */}
      <View style={styles.top}>
        <Select
          multiSelect
          selectedIndex={selectedIndex}
          onSelect={index => setSelectedIndex(index as IndexPath[])}
          placeholder="Select subjects"
          value="Selected"
          style={styles.select}
          status="success"
        >
          {options.map((title, index) => (
            <SelectItem key={index} title={title} />
          ))}
        </Select>
      </View>

      {/* Button - 10% */}
      <View style={styles.middle}>
        <Button
          style={styles.containerButton}
          status="success"
          onPress={handleActivate}
          disabled={loading}
        >
          Activate
        </Button>
      </View>

      {/* Cards - 80% scrollable */}
      <View style={styles.bottom}>
        <ScrollView contentContainerStyle={styles.cardsContainerScroll}>
          {subjects.map((subject, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardText}>{subject.name}</Text>
              <GreenCheckIcon
                state={subject.active_subject === 1}
                icon={subject.active_subject === 1 ? 'circle-check' : 'lock'}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  bottom: {
    flex: 8,
  },
  select: {
    width: '100%',
  },
  containerButton: {
    width: '100%',
  },
  cardsContainerScroll: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 10,
    color:'#000000'
  },
  Aico: {
    flex: 1,
    fontSize: 20,
  },
  Iico: {
    flex: 1,
    fontSize: 20,
  },
});
