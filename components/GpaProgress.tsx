// MarksManager.tsx
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import {
  Layout,
  Input,
  Button,
  List,
  ListItem,
  Text,
  Modal,
  Card,
} from '@ui-kitten/components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import {
  getDBConnection,
  getAllMarks,
  deleteMarkById,
  Mark,
  getAllGradingScales,
} from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';
import { backgroundColor, baseBGColor } from './Color';
import Loader from './Loader';
import { PieChart } from 'react-native-gifted-charts';

const PlusIcon = () => (
  <FontAwesome6 name="plus" style={[styles.icon]} iconStyle="solid" />
);
const EditIcon = () => (
  <FontAwesome6 name="pen" style={[styles.icon]} iconStyle="solid" />
);
const DeleteIcon = () => (
  <FontAwesome6 name="trash" style={[styles.icon]} iconStyle="solid" />
);
const SearchIcon = () => (
  <FontAwesome6
    name="magnifying-glass"
    style={[styles.icon]}
    iconStyle="solid"
  />
);

export default function GpaProgress() {
  const [value, setValue] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [greadingData, setGradingData] = useState<any[] | null>(null);

  const modalRef = useRef<ModalKittenHandle>(null);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const fetchData = async () => {
    try {
      setLoading(true);
      const db = await getDBConnection();
      const data = await getAllGradingScales(db);
      const res = await getAllMarks(db);
      setGradingData(data);
      setMarks(res);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (gpaValue: number) => {
    if (gpaValue < 1.5) return 'red'; // 0 – 1.4
    if (gpaValue < 2.5) return 'yellow'; // 1.5 – 2.4
    if (gpaValue < 3.5) return 'lightgreen'; // 2.5 – 3.4
    return 'green'; // 3.5 – 4.0
  };

  useEffect(() => {
    // run fetchData only when screen is focused
    if (isFocused) {
      fetchData();
    }

    // back button handler
    const backAction = () => {
      if (isFocused) {
        // only when this screen is active
        navigation.navigate('MainTabs', {
          screen: 'Tools', 
        });
        return true; // block default back
      }
      return false; // let other screens handle back
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    // cleanup on unmount or when screen loses focus
    return () => backHandler.remove();
  }, [isFocused, navigation]);

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      const db = await getDBConnection();
      await deleteMarkById(db, selectedId);
      await fetchData();
      modalRef.current?.show('Deleted successfully', 2000, 'success');
    } catch {
      modalRef.current?.show('Delete failed', 2000, 'error');
    } finally {
      setConfirmVisible(false);
      setSelectedId(null);
      setLoading(false);
    }
  };

  const filteredMarks = marks.filter(m =>
    m.subject_name.toLowerCase().includes(value.toLowerCase()),
  );

  const renderItem = ({ item }: { item: Mark }) => (
    <ListItem
      title={`${item.subject_name}`}
      description={`Marks: ${item.obtained_marks}/${item.total_marks} | CH: ${
        item.credit_hour
      } | Per: ${((item.obtained_marks / item.total_marks) * 100).toFixed(1)}%`}
      accessoryRight={() => (
        <View style={styles.iconButtonContainer}>
          <Button
            onPress={() => navigation.navigate('EditMarks', { id: item.id })}
            style={styles.iconButton}
            size="tiny"
            status="primary"
            accessoryLeft={EditIcon}
          />
          <Button
            onPress={() => {
              setSelectedId(item.id!);
              setConfirmVisible(true);
            }}
            style={styles.iconButton}
            size="tiny"
            status="danger"
            accessoryLeft={DeleteIcon}
          />
        </View>
      )}
    />
  );

  const calGpa = (): number => {
    let totalWeightedPoints = 0;
    let totalCreditHours = 0;

    (marks || []).forEach(e => {
      const per = (e.obtained_marks / e.total_marks) * 100;

      const grade = (greadingData || []).filter(
        i => per >= i.min_mark && per <= i.max_mark,
      )[0];

      if (grade) {
        const gp = grade.grade_points;
        totalWeightedPoints += e.credit_hour * gp;
        totalCreditHours += e.credit_hour;
      }
    });

    const gpa =
      totalCreditHours > 0 ? totalWeightedPoints / totalCreditHours : 0;

    return Number(gpa.toFixed(2)); // ✅ number with 2 decimals
  };

  const highestGrade = (): number => {
    if (greadingData && greadingData.length > 0) {
      return Math.max(...greadingData.map(g => g.grade_points));
    }
    return 0; // ✅ fallback if no data
  };

  const DonutChart = () => {
    // compute gpa and highest grade
    const gpa = calGpa();
    const highest = highestGrade();

    // compute percentage of max
    const percent = highest > 0 ? (gpa / highest) * 100 : 0;

    // pick color based on percent
    let color = '#FF4C4C'; // more vivid red
    if (percent >= 80) color = '#00C853'; // dark green
    else if (percent >= 70) color = '#69F0AE'; // light green
    else if (percent >= 50) color = '#FFD600'; // yellow

    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          paddingVertical: 10,
        }}
      >
        <PieChart
          donut
          radius={100}
          innerRadius={80}
          innerCircleColor={'#212B46'} // matches your dark blue theme
          data={[
            { value: percent, color: color }, // filled part
            { value: 100 - percent, color: '#444C70' }, // empty part matches dark theme
          ]}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: color }}>
                {`${gpa.toFixed(2)}/${highest}`}
              </Text>
              <Text style={{ fontSize: 14, color: color }}>GPA</Text>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <>
      <Layout style={styles.mainContainer}>
        <DonutChart />
        <View style={styles.topBar}>
          <Input
            style={styles.searchInput}
            value={value}
            placeholder="Search Subject"
            accessoryLeft={SearchIcon}
            onChangeText={setValue}
            status="success"
          />
          <Button
            style={styles.addButton}
            status="success"
            accessoryLeft={PlusIcon}
            onPress={() => navigation.navigate('AddMarks')}
          />
        </View>

        <List
          style={styles.list}
          data={filteredMarks}
          renderItem={renderItem}
        />
      </Layout>

      <Loader visible={loading} animationSpeedMultiplier={1.0} />
      <ModalKitten ref={modalRef} />

      <Modal
        visible={confirmVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setConfirmVisible(false)}
      >
        <Card disabled={true} style={styles.confirmCard}>
          <Text category="h6" style={styles.confirmTitle}>
            Confirm Deletion
          </Text>
          <Text appearance="hint" style={styles.confirmMessage}>
            Are you sure you want to delete this entry?
          </Text>
          <View style={styles.confirmButtons}>
            <Button
              style={[styles.confirmButton, { backgroundColor: '#ff3d71' }]}
              onPress={handleDelete}
              status="danger"
            >
              Yes, Delete
            </Button>
            <Button
              style={styles.confirmButton}
              onPress={() => setConfirmVisible(false)}
              appearance="outline"
              status="basic"
            >
              Cancel
            </Button>
          </View>
        </Card>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: baseBGColor, padding: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: baseBGColor,
    borderRadius: 8,
  },
  addButton: {
    borderRadius: 50,
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { backgroundColor: backgroundColor, borderRadius: 12 },
  icon: { fontSize: 12, color: '#fff' },
  iconButtonContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconButton: {
    borderRadius: 25,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },
  confirmCard: {
    width: 300,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  confirmTitle: { marginBottom: 8, fontWeight: 'bold', color: '#ffffff' },
  confirmMessage: { marginBottom: 20, color: '#ffffff' },
  confirmButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  confirmButton: { borderRadius: 8, minWidth: 100 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#212b46',
  },
});
