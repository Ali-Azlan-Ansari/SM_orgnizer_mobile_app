import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert, BackHandler } from 'react-native';
import { Input, Text, Button } from '@ui-kitten/components';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { baseBGColor } from './Color';
import { getDBConnection, getMarkById, updateMark } from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Loader from './Loader';
import { Mark } from '../DataBase/db';

const EditMarks = ({ route }: any): React.ReactElement => {
  const { id } = route.params;
  const [subjectName, setSubjectName] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [obtainedMarks, setObtainedMarks] = useState('');
  const [creditHour, setCreditHour] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  const [subjectError, setSubjectError] = useState('');
  const [totalError, setTotalError] = useState('');
  const [obtainedError, setObtainedError] = useState('');
  const [creditError, setCreditError] = useState('');
  const [yearError, setYearError] = useState('');
  const [semesterError, setSemesterError] = useState('');

  const [loading, setLoading] = useState(false);
  const modalRef = useRef<ModalKittenHandle>(null);
  const navigation = useNavigation<any>();

    useFocusEffect(
        useCallback(() => {
          const onBackPress = () => {
            // 👇 Back press → go to "Home" screen
            navigation.navigate('GpaProgress');
            return true; // default back ko cancel kar do
          };
    
          const subscription = BackHandler.addEventListener(
            'hardwareBackPress',
            onBackPress,
          );
    
          return () => subscription.remove();
        }, [navigation]),
      );

  const handlePress = (message: string, time: number, status: string) => {
    modalRef.current?.show(message, time, status);
  };

  const renderCaption = (msg: string) =>
    msg ? (
      <View style={styles.captionContainer}>
        <Text style={styles.captionText}>{msg}</Text>
      </View>
    ) : null;

  const fetchMark = async () => {
    try {
      setLoading(true);
      const db = await getDBConnection();
      const mark = await getMarkById(db, id);
      if (mark) {
        setSubjectName(mark.subject_name);
        setTotalMarks(mark.total_marks.toString());
        setObtainedMarks(mark.obtained_marks.toString());
        setCreditHour(mark.credit_hour.toString());
        setYear(mark.year?.toString() || '');
        setSemester(mark.semester?.toString() || '');
      } else {
        Alert.alert('Not Found', 'Mark not found');
        navigation.goBack();
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMark();
  }, []);

  const validate = (): boolean => {
    let valid = true;
    if (subjectName.trim().length === 0 || subjectName.trim().length > 30) {
      setSubjectError('Subject name must be 1–30 non-space characters');
      valid = false;
    } else setSubjectError('');

    const total = parseFloat(totalMarks);
    if (isNaN(total) || total <= 0) {
      setTotalError('Total marks must be > 0');
      valid = false;
    } else setTotalError('');

    const obtained = parseFloat(obtainedMarks);
    if (isNaN(obtained) || obtained < 0 || obtained > total) {
      setObtainedError('Obtained marks must be between 0 and total marks');
      valid = false;
    } else setObtainedError('');

    const credit = parseInt(creditHour);
    if (isNaN(credit) || credit <= 0) {
      setCreditError('Credit hour must be > 0');
      valid = false;
    } else setCreditError('');

    const y = parseInt(year);
    if (isNaN(y) || y <= 0) {
      setYearError('Year must be > 0');
      valid = false;
    } else setYearError('');

    const s = parseInt(semester);
    if (isNaN(s) || s <= 0) {
      setSemesterError('Semester must be > 0');
      valid = false;
    } else setSemesterError('');

    return valid;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const db = await getDBConnection();
      const updated: Mark = {
        subject_name: subjectName.trim(),
        total_marks: parseFloat(totalMarks),
        obtained_marks: parseFloat(obtainedMarks),
        credit_hour: parseInt(creditHour),
        year: parseInt(year),
        semester: parseInt(semester),
      };
      await updateMark(db, id, updated);
      handlePress('Mark Updated Successfully', 2000, 'success');
      setTimeout(() => {
        navigation.navigate('GpaProgress');
      }, 2200);
    } catch (err) {
      console.error(err);
      handlePress('Update Failed', 2000, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopNavigationAccessoriesShowcase title="Edit Mark" />
      <ScrollView style={styles.scroll}>
        {/* existing inputs */}
        <Input label="Subject Name" placeholder="e.g. Mathematics" value={subjectName} onChangeText={setSubjectName} maxLength={30} status="success" style={styles.input} textStyle={styles.inputText} caption={() => renderCaption(subjectError)} />
        <Input label="Total Marks" placeholder="e.g. 100" value={totalMarks} onChangeText={setTotalMarks} keyboardType="numeric" status="success" style={styles.input} textStyle={styles.inputText} caption={() => renderCaption(totalError)} />
        <Input label="Obtained Marks" placeholder="e.g. 85" value={obtainedMarks} onChangeText={setObtainedMarks} keyboardType="numeric" status="success" style={styles.input} textStyle={styles.inputText} caption={() => renderCaption(obtainedError)} />
        <Input label="Credit Hour" placeholder="e.g. 3" value={creditHour} onChangeText={setCreditHour} keyboardType="numeric" status="success" style={styles.input} textStyle={styles.inputText} caption={() => renderCaption(creditError)} />

        {/* new inputs */}
        <Input label="Year" placeholder="e.g. 2024" value={year} onChangeText={setYear} keyboardType="numeric" status="success" style={styles.input} textStyle={styles.inputText} caption={() => renderCaption(yearError)} />
        <Input label="Semester" placeholder="e.g. 1" value={semester} onChangeText={setSemester} keyboardType="numeric" status="success" style={styles.input} textStyle={styles.inputText} caption={() => renderCaption(semesterError)} />

        <Button style={styles.button} status="success" onPress={handleUpdate}>
          Update
        </Button>
      </ScrollView>
      <ModalKitten ref={modalRef} />
      <Loader visible={loading} animationSpeedMultiplier={1.0} />
    </View>
  );
};


export default EditMarks;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseBGColor,
  },
  scroll: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  inputText: {
    color: '#000000',
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  captionText: {
    fontSize: 12,
    color: 'red',
  },
  button: {
    marginTop: 16,
  },
});
