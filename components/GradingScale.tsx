import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Card,
  Input,
  Select,
  Modal,
  SelectItem,
  IndexPath,
} from '@ui-kitten/components';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { primaryColor, baseBGColor } from './Color';
import {
  getAllGradingScales,
  getDBConnection,
  deleteAllGradingScales,
  insertGradingScales,
} from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';
import Loader from './Loader';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type GradingScale = {
  id: number;
  min_mark: number;
  max_mark: number;
  letter_grade: string;
  grade_points: number;
};

const letterGrades = [
  'A',
  'A+',
  'A-',
  'B',
  'B+',
  'B-',
  'C',
  'C+',
  'C-',
  'D',
  'D+',
  'D-',
  'E',
  'E+',
  'E-',
  'F',
];

const GradingScaleScreen = (): React.ReactElement => {
  const [data, setData] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<ModalKittenHandle>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  // initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const db = await getDBConnection();
        const rows = await getAllGradingScales(db);
        setData(rows);
      } catch (err) {
        console.error('Error loading grading scales:', err);
        modalRef.current?.show('Error loading data', 2000, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddField = () => {
    const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
    setData([
      ...data,
      {
        id: newId,
        min_mark: 0,
        max_mark: 0,
        letter_grade: 'A',
        grade_points: 0,
      },
    ]);
  };

  const handleRemoveField = (id: number) => {
    setData(data.filter(item => item.id !== id));
  };

  const updateField = (
    id: number,
    key: keyof GradingScale,
    value: string | number,
  ) => {
    setData(
      data.map(item => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const db = await getDBConnection();

      // 1 delete all
      await deleteAllGradingScales(db);

      // 2 insert current data
      const toInsert = data.map(d => ({
        min_mark: d.min_mark,
        max_mark: d.max_mark,
        letter_grade: d.letter_grade,
        grade_points: d.grade_points,
      }));
      await insertGradingScales(db, toInsert);
    
      // 3 reload
      const rows = await getAllGradingScales(db);
      setData(rows);
      setConfirmVisible(false)

      modalRef.current?.show('Changes saved successfully!', 2000, 'success');
    } catch (err) {
      console.error(err);
      modalRef.current?.show('Failed to save changes', 2000, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopNavigationAccessoriesShowcase title="Grading Scale" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {data.map((item, index) => (
          <Card key={item.id} style={styles.sectionCard} disabled>
            <View style={styles.sectionHeader}>
              <Text category="s1" style={styles.sectionTitle}>
                Grade Section {index + 1}
              </Text>

              <Button
                onPress={() => handleRemoveField(item.id)}
                style={styles.minusButton}
                size="tiny"
                status="danger"
                accessoryLeft={
                  <FontAwesome6
                    name="trash"
                    color="#ffffff"
                    style={[styles.icon]}
                    iconStyle="solid"
                  />
                }
              />
            </View>

            <Input
              label="Max Mark"
              value={String(item.max_mark)}
              keyboardType="numeric"
              style={styles.input}
              textStyle={styles.inputText}
              onChangeText={val =>
                updateField(item.id, 'max_mark', Number(val))
              }
            />
            <Input
              label="Min Mark"
              value={String(item.min_mark)}
              keyboardType="numeric"
              style={styles.input}
              textStyle={styles.inputText}
              onChangeText={val =>
                updateField(item.id, 'min_mark', Number(val))
              }
            />

            <Select
              label="Letter Grade"
              selectedIndex={
                new IndexPath(letterGrades.indexOf(item.letter_grade))
              }
              value={item.letter_grade}
              onSelect={index => {
                const i = (index as IndexPath).row;
                updateField(item.id, 'letter_grade', letterGrades[i]);
              }}
              style={styles.input}
            >
              {letterGrades.map(grade => (
                <SelectItem key={grade} title={grade} />
              ))}
            </Select>

            <Input
              label="Grade Points"
              value={String(item.grade_points)}
              keyboardType="numeric"
              style={styles.input}
              textStyle={styles.inputText}
              onChangeText={val =>
                updateField(item.id, 'grade_points', Number(val))
              }
            />
          </Card>
        ))}

        <Button
          style={styles.addButton}
          status="success"
          onPress={handleAddField}
        >
          Add Field
        </Button>

        <Button
          style={styles.saveButton}
          status="primary"
          onPress={() => {
            setConfirmVisible(true);
          }}
        >
          Save Changes
        </Button>
      </ScrollView>

      <ModalKitten ref={modalRef} />

      <Modal
        visible={confirmVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => {
          setConfirmVisible(false);
        }}
      >
        <Card disabled={true} style={styles.confirmCard}>
          <Text category="h6" style={styles.confirmTitle}>
            Warning
          </Text>
          <Text appearance="hint" style={styles.confirmMessage}>
            Entering incorrect grading data may cause problems.
          </Text>
          <View style={styles.confirmButtons}>
            <Button
              style={styles.confirmButton}
              onPress={() => {
                setConfirmVisible(false);
              }}
              appearance="outline"
              status="basic"
            >
              Cancel
            </Button>
            <Button
              style={[styles.confirmButton]}
              onPress={handleSaveChanges}
              status="primary"
            >
              Save
            </Button>
          </View>
        </Card>
      </Modal>

      <Loader visible={loading} animationSpeedMultiplier={1.0} />
    </View>
  );
};

export default GradingScaleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseBGColor,
  },
  scroll: {
    paddingHorizontal: 12,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  inputText: {
    color: '#000000',
  },
  minusButton: {
    width: 35,
    height: 35,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: primaryColor,
  },
  icon: {
    fontSize: 14,
    color: '#fff',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  confirmCard: {
    width: 300,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  confirmTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  confirmMessage: {
    marginBottom: 20,
    color: '#ffffffff',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmButton: {
    borderRadius: 8,
    minWidth: 100,
  },
});
