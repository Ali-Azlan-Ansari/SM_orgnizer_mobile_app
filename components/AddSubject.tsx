import React, { useState,useRef} from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Input, Text, Button, Icon, IconElement } from '@ui-kitten/components';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { primaryColor, baseBGColor } from './Color';
import { addSubject, getDBConnection } from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';
import { useNavigation } from '@react-navigation/native';


const AddSubject = (): React.ReactElement => {
  const [subjectName, setSubjectName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [semester, setSemester] = useState('');

  const [subjectError, setSubjectError] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [abbreviationError, setAbbreviationError] = useState('');
  const [semesterError, setSemesterError] = useState('');
  const modalRef = useRef<ModalKittenHandle>(null);
  const navigation = useNavigation<any>();

  const handlePress = (massge:string,time:number,status:string) => {
    modalRef.current?.show(massge, time,status);
  };

  const validate = (): boolean => {
    let valid = true;

    // Subject Name
    if (subjectName.trim().length === 0 || subjectName.trim().length > 30) {
      setSubjectError('Subject name must be 1–30 non-space characters');
      valid = false;
    } else {
      setSubjectError('');
    }

    // Teacher Name
    if (teacherName.trim().length === 0 || teacherName.trim().length > 20) {
      setTeacherError('Teacher name must be 1–20 non-space characters');
      valid = false;
    } else {
      setTeacherError('');
    }

    // Abbreviation (must be exactly 3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(abbreviation.trim())) {
      setAbbreviationError(
        'Abbreviation must be 3 uppercase letters (A–Z only)',
      );
      valid = false;
    } else {
      setAbbreviationError('');
    }

    // Semester (only 1 to 18)
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
    const db = await getDBConnection();

    await addSubject(db, {
      name: subjectName.trim(),
      teacher_name: teacherName.trim(),
      abbreviation: abbreviation.trim(),
      semester: semester.trim(),
      active_subject: 0, // assuming it's active
      date: new Date().toISOString(),
    });
    
 setTimeout(() => {
  navigation.navigate('MainTabs', {screen: 'Subject'});
}, 2200);
    handlePress('Subgect Is Added',2000,'success')

    // Clear form
    setSubjectName('');
    setTeacherName('');
    setAbbreviation('');
    setSemester('');
  } catch (error) {
    console.error("Error adding subject:", error);
     handlePress('Error something wants wrong',2000,'error')
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
      <TopNavigationAccessoriesShowcase rout="Subject" title='Add Subject'/>
      <ScrollView style={styles.scroll}>
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
          onChangeText={text => setAbbreviation(text.toUpperCase())}
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
          Submit
        </Button>
       
      </ScrollView>
       <ModalKitten ref={modalRef} />
    </View>
  );
};

export default AddSubject;

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
  captionIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  captionText: {
    fontSize: 12,
    color: 'red',
  },
  button: {
    marginTop: 16,
  },
});
