import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Input, Text, Button } from '@ui-kitten/components';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { baseBGColor } from './Color';
import { getDBConnection, getSubjectById, updateSubject } from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';
import { useNavigation } from '@react-navigation/native';
import Loader from './Loader'; // <-- import your loader

const EditSubject = ({ route }: any): React.ReactElement => {
  const { id } = route.params; // get id from route
  const [subjectName, setSubjectName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [semester, setSemester] = useState('');

  const [subjectError, setSubjectError] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [abbreviationError, setAbbreviationError] = useState('');
  const [semesterError, setSemesterError] = useState('');

  const [loading, setLoading] = useState(false); // loader state

  const modalRef = useRef<ModalKittenHandle>(null);
  const navigation = useNavigation<any>();

  const handlePress = (message: string, time: number, status: string) => {
    modalRef.current?.show(message, time, status);
  };

  const fetchSubject = async () => {
    try {
      setLoading(true);

      const db = await getDBConnection();
      const subject = await getSubjectById(db, id);
      if (subject) {
        setSubjectName(subject.name || '');
        setTeacherName(subject.teacher_name || '');
        setAbbreviation(subject.abbreviation || '');
        setSemester(subject.semester || '');
      } else {
        Alert.alert('Not Found', 'Subject not found');
        navigation.goBack();
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, []);

  const validate = (): boolean => {
    let valid = true;

    if (subjectName.trim().length === 0 || subjectName.trim().length > 15) {
      setSubjectError('Subject name must be 1–15 non-space characters');
      valid = false;
    } else {
      setSubjectError('');
    }

    if (teacherName.trim().length === 0 || teacherName.trim().length > 20) {
      setTeacherError('Teacher name must be 1–20 non-space characters');
      valid = false;
    } else {
      setTeacherError('');
    }

    if (!/^[A-Z]{3}$/.test(abbreviation.trim())) {
      setAbbreviationError(
        'Abbreviation must be 3 uppercase letters (A–Z only)'
      );
      valid = false;
    } else {
      setAbbreviationError('');
    }

    const semesterNum = parseInt(semester.trim(), 10);
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 18) {
      setSemesterError('Semester must be a number between 1 and 18');
      valid = false;
    } else {
      setSemesterError('');
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const db = await getDBConnection();
      await updateSubject(db, id, {
        name: subjectName.trim(),
        teacher_name: teacherName.trim(),
        abbreviation: abbreviation.trim(),
        semester: semester.trim(),
        active_subject: 0,
        date: new Date().toISOString(),
      });

      handlePress('Subject Updated Successfully', 2000, 'success');

      setTimeout(() => {
        navigation.navigate('MainTabs', { screen: 'Subject' });
      }, 2200);
    } catch (error) {
      console.error('Error updating subject:', error);
      handlePress('Update Failed', 2000, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderCaption = (message: string): React.ReactElement | null =>
    message ? (
      <View style={styles.captionContainer}>
        <Text style={styles.captionText}>{message}</Text>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      <TopNavigationAccessoriesShowcase rout="Subject" title="Edit Subject" />
      <ScrollView style={styles.scroll}>
        <Input
          label="Subject Name"
          placeholder="e.g. Mathematics"
          value={subjectName}
          onChangeText={setSubjectName}
          maxLength={15}
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(subjectError)}
        />

        <Input
          label="Teacher Name"
          placeholder="e.g. Mr. Ali"
          value={teacherName}
          onChangeText={setTeacherName}
          maxLength={20}
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(teacherError)}
        />

        <Input
          label="Abbreviation (3 Uppercase Letters)"
          placeholder="e.g. MAT"
          value={abbreviation}
          onChangeText={(text) => setAbbreviation(text.toUpperCase())}
          maxLength={3}
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(abbreviationError)}
        />

        <Input
          label="Semester (1–18)"
          placeholder="e.g. 4"
          value={semester}
          onChangeText={setSemester}
          keyboardType="numeric"
          maxLength={2}
          status="success"
          style={styles.input}
          textStyle={styles.inputText}
          caption={() => renderCaption(semesterError)}
        />

        <Button style={styles.button} status="success" onPress={handleSubmit}>
          Update
        </Button>
      </ScrollView>

      <ModalKitten ref={modalRef} />

      {/* Loader Overlay */}
      <Loader visible={loading} animationSpeedMultiplier={1.0} />
    </View>
  );
};

export default EditSubject;

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
