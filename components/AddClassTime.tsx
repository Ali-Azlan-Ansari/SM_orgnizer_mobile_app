import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Input,
  Text,
  Button,
  Select,
  SelectItem,
  IndexPath,
} from '@ui-kitten/components';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import { baseBGColor } from './Color';
import { getDBConnection, insertSchedule } from '../DataBase/db';
import { ModalKitten, ModalKittenHandle } from './Modal';
import Loader from './Loader';
import { useNavigation } from '@react-navigation/native';

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const AddClassTime = (): React.ReactElement => {
  const [subject, setSubject] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(new IndexPath(0));
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const [loading, setLoading] = useState(false);
  const modalRef = useRef<ModalKittenHandle>(null);
  const navigation = useNavigation<any>();

  const handlePress = (msg: string, time: number, status: string) => {
    modalRef.current?.show(msg, time, status);
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      handlePress('Enter subject name', 2000, 'error');
      return;
    }
    try {
      setLoading(true);
      const db = await getDBConnection();
      await insertSchedule(db, {
        subject: subject.trim(),
        day: days[selectedDayIndex.row],
        start_time: startTime.toLocaleTimeString(),
        end_time: endTime.toLocaleTimeString(),
      });
      handlePress('Schedule added', 2000, 'success');
      setTimeout(() => navigation.goBack(), 2200);
      setSubject('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopNavigationAccessoriesShowcase title="Add Class Time" />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text category="label" style={styles.label}>
          Subject
        </Text>
        <Input
         
          placeholder="e.g. Mathematics"
          value={subject}
          onChangeText={setSubject}
          style={styles.input}
          status="success"
          textStyle={styles.inputText}
        />

        <Text category="label" style={styles.label}>
          Day
        </Text>

        <View style={styles.selectContainer}>
          <Select
           
            selectedIndex={selectedDayIndex}
            onSelect={index => setSelectedDayIndex(index as IndexPath)}
            value={days[selectedDayIndex.row]}
            style={styles.inputsel}
            status="success"
            appearance="outline"
          >
            {days.map(day => (
              <SelectItem key={day} title={day} />
            ))}
          </Select>
        </View>

        <Text category="label" style={styles.label}>
          Start Time
        </Text>
        <Button style={styles.button} onPress={() => setShowStart(true)}>
          Pick Start Time
        </Button>
        <Text style={styles.timeText}>
          Start: {startTime.toLocaleTimeString()}
        </Text>
        {showStart && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(e, d) => {
              setShowStart(false);
              if (d) setStartTime(d);
            }}
          />
        )}

        <Text category="label" style={styles.label}>
          End Time
        </Text>
        <Button style={styles.button} onPress={() => setShowEnd(true)}>
          Pick End Time
        </Button>
        <Text style={styles.timeText}>
          End: {endTime.toLocaleTimeString()}
        </Text>
        {showEnd && (
          <DateTimePicker
            value={endTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(e, d) => {
              setShowEnd(false);
              if (d) setEndTime(d);
            }}
          />
        )}

        <Button style={styles.sbutton} status="success" onPress={handleSubmit}>
          Submit
        </Button>
      </ScrollView>
      <ModalKitten ref={modalRef} />
      <Loader visible={loading} />
    </View>
  );
};

export default AddClassTime;

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
    borderRadius: 8,
    height: 50,
  },
  inputText: {
    color: '#000',
  },
  selectContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputsel: {
    backgroundColor: '#ffffff', // same as Input
    borderRadius: 8,
    width: '100%',
    paddingHorizontal: 0,
  },
  label: {
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  button: {
   
    backgroundColor: '#1A2138',
    borderColor: '#0d111dff',
  },
  sbutton: {
    marginVertical: 16,
  },
  timeText: {
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
});
