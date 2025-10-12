import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, BackHandler } from 'react-native';
import { Input, Text, Button } from '@ui-kitten/components';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { baseBGColor } from './Color';
import { addMark, getDBConnection } from '../DataBase/db'; // adjust import path
import { ModalKitten, ModalKittenHandle } from './Modal';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Loader from './Loader';
import { Mark } from '../DataBase/db';

const AddMarks = (): React.ReactElement => {
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

  const handlePress = (message: string, time: number, status: string) => {
    modalRef.current?.show(message, time, status);
  };

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

  const renderCaption = (msg: string) =>
    msg ? (
      <View style={styles.captionContainer}>
        <Text style={styles.captionText}>{msg}</Text>
      </View>
    ) : null;

  const validate = (): boolean => {
    let valid = true;
    // subject
    if (subjectName.trim().length === 0 || subjectName.trim().length > 30) {
      setSubjectError('Subject name must be 1–30 non-space characters');
      valid = false;
    } else setSubjectError('');

    // total marks
    const total = parseFloat(totalMarks);
    if (isNaN(total) || total <= 0) {
      setTotalError('Total marks must be > 0');
      valid = false;
    } else setTotalError('');

    // obtained
    const obtained = parseFloat(obtainedMarks);
    if (isNaN(obtained) || obtained < 0 || obtained > total) {
      setObtainedError('Obtained marks must be between 0 and total marks');
      valid = false;
    } else setObtainedError('');

    // credit hour
    const credit = parseInt(creditHour);
    if (isNaN(credit) || credit <= 0) {
      setCreditError('Credit hour must be > 0');
      valid = false;
    } else setCreditError('');

    // year
    const y = parseInt(year);
    if (isNaN(y) || y <= 0) {
      setYearError('Year must be > 0');
      valid = false;
    } else setYearError('');

    // semester
    const s = parseInt(semester);
    if (isNaN(s) || s <= 0) {
      setSemesterError('Semester must be > 0');
      valid = false;
    } else setSemesterError('');

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const db = await getDBConnection();
      const newMark: Mark = {
        subject_name: subjectName.trim(),
        total_marks: parseFloat(totalMarks),
        obtained_marks: parseFloat(obtainedMarks),
        credit_hour: parseInt(creditHour),
        year: parseInt(year),
        semester: parseInt(semester),
      };
      await addMark(db, newMark);
      handlePress('Mark Added Successfully', 2000, 'success');
      setTimeout(() => {
        navigation.navigate('GpaProgress');
      }, 2200);

      // reset fields
      setSubjectName('');
      setTotalMarks('');
      setObtainedMarks('');
      setCreditHour('');
      setYear('');
      setSemester('');
    } catch (err) {
      console.error(err);
      handlePress('Error adding mark', 2000, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopNavigationAccessoriesShowcase title="Add Mark" />
      <ScrollView style={styles.scroll}>
        {/* existing inputs */}
        <Input
          label="Subject Name"
          placeholder="e.g. Mathematics"
          value={subjectName}
          onChangeText={setSubjectName}
          maxLength={30}
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(subjectError)}
        />
        <Input
          label="Total Marks"
          placeholder="e.g. 100"
          value={totalMarks}
          onChangeText={setTotalMarks}
          keyboardType="numeric"
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(totalError)}
        />
        <Input
          label="Obtained Marks"
          placeholder="e.g. 85"
          value={obtainedMarks}
          onChangeText={setObtainedMarks}
          keyboardType="numeric"
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(obtainedError)}
        />
        <Input
          label="Credit Hour"
          placeholder="e.g. 3"
          value={creditHour}
          onChangeText={setCreditHour}
          keyboardType="numeric"
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(creditError)}
        />

        {/* new inputs */}
        <Input
          label="Year"
          placeholder="e.g. 2024"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(yearError)}
        />
        <Input
          label="Semester"
          placeholder="e.g. 1"
          value={semester}
          onChangeText={setSemester}
          keyboardType="numeric"
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(semesterError)}
        />

        <Button style={styles.button} status="success" onPress={handleSubmit}>
          Submit
        </Button>
      </ScrollView>
      <ModalKitten ref={modalRef} />
      <Loader visible={loading} animationSpeedMultiplier={1.0} />
    </View>
  );
};


export default AddMarks;

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
