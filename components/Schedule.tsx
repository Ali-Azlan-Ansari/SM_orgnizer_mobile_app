import { View, StyleSheet, ScrollView, BackHandler } from 'react-native';
import Accordion from 'react-native-collapsible/Accordion';
import { Button, Layout, List, ListItem, Text } from '@ui-kitten/components';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { primaryColor, baseBGColor, backgroundColor } from './Color';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import {
  getDBConnection,
  deleteSchedule,
  getSchedules,
  Schedule as ScheduleType,
} from '../DataBase/db';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import dayjs from 'dayjs';
import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import Loader from './Loader';
import React, { useState, useEffect, useCallback } from 'react';

const days = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

const Schedule = () => {
  const [activeSections, setActiveSections] = useState<number[]>([]); // initially empty
  const [sections, setSections] = useState<any[]>([]);
  const [data, setData] = useState<ScheduleType[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('MainTabs', { screen: 'Tools' });
        return true;
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, [navigation]),
  );

  const setupNotificationChannel = async () => {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const db = await getDBConnection();
      const data = await getSchedules(db);
      setData(data);
      const grouped = days.map(day => ({
        title: day,
        content: data.filter((s: any) => s.day === day),
      }));
      setSections(grouped);
      setActiveSections([]); // <- Accordion will close all sections when loading
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setupNotificationChannel();
    const unsubscribe = navigation.addListener('focus', loadSchedules);
    return unsubscribe;
  }, [navigation]);

  const daysMap: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  };

  const getNextDateForDayAndTime = async (
    day: string,
    time: string,
  ): Promise<Date> => {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

    let now = dayjs();
    let target = now
      .day(daysMap[day.toLowerCase().slice(0, 3)])
      .hour(hours)
      .minute(minutes)
      .second(0);

    if (target.isBefore(now)) target = target.add(7, 'day');
    return target.toDate();
  };

  const scheduleNotification = async (schedule: ScheduleType) => {
    const date = await getNextDateForDayAndTime(schedule.day, schedule.start_time);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: RepeatFrequency.WEEKLY,
      alarmManager: { allowWhileIdle: true },
    };

    await notifee.createTriggerNotification(
      {
        id: `schedule-${schedule.id}`,
        title: `Class: ${schedule.subject}`,
        body: `Your Class Starts at ${schedule.start_time} - Ends at ${schedule.end_time}`,
        android: {
          channelId: 'default',
          smallIcon: 'ic_stat_notify',
          largeIcon: 'ic_launcher_round',
          pressAction: { id: 'default' },
        },
      },
      trigger,
    );
  };

  const renderHeader = (section: any, _: number, isActive: boolean) => (
    <View style={[styles.header, isActive && styles.headerActive]}>
      <Text style={styles.headerText}>{section.title}</Text>
    </View>
  );

  const renderListItem = ({ item }: { item: any }) => (
    <ListItem
      title={`${item.subject}`}
      description={`${item.start_time} - ${item.end_time}`}
      accessoryRight={() => (
        <View style={styles.iconButtonContainer}>
          <Button
            onPress={() =>
              navigation.navigate('EditClassTime', { id: item.id })
            }
            style={styles.iconButton}
            size="tiny"
            status="primary"
            accessoryLeft={
              <FontAwesome6 name="pen" color={'#fff'} iconStyle="solid" />
            }
          />
          <Button
            onPress={async () => {
              setLoading(true);
              const db = await getDBConnection();
              await deleteSchedule(db, item.id);
              await loadSchedules();
              setLoading(false);
            }}
            style={styles.iconButton}
            size="tiny"
            status="danger"
            accessoryLeft={
              <FontAwesome6 name="trash" color={'#fff'} iconStyle="solid" />
            }
          />
        </View>
      )}
    />
  );

  const renderContent = (section: any) => (
    <View style={styles.content}>
      {section.content.length === 0 ? (
        <Text style={styles.contentText}>Empty</Text>
      ) : (
        <List
          style={styles.list}
          data={section.content}
          renderItem={renderListItem}
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: baseBGColor }}>
      <TopNavigationAccessoriesShowcase title="Schedule" />
      <Button
        style={styles.addBtn}
        status="success"
        onPress={() => navigation.navigate('AddClassTime')}
      >
        Add Class Time
      </Button>
      <Button
        style={styles.addBtn}
        status="primary"
        onPress={async () => {
          setLoading(true);
          notifee.cancelAllNotifications();
          for (const s of data) await scheduleNotification(s);
          setLoading(false);
        }}
      >
        Set or Refresh Notification
      </Button>
      <Layout style={styles.container}>
        <ScrollView>
          <Accordion
            sections={sections}
            activeSections={activeSections}
            renderHeader={renderHeader}
            renderContent={renderContent}
            onChange={setActiveSections}
            expandMultiple={false}
          />
        </ScrollView>
      </Layout>
      <Loader visible={loading} animationSpeedMultiplier={1.0} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: {
    padding: 14,
    backgroundColor: '#fff',
    marginTop: 3,
    borderRadius: 5,
    borderWidth: 4,
    borderColor: primaryColor,
  },
  headerActive: { backgroundColor: '#fff' },
  headerText: { color: primaryColor, fontSize: 16, fontWeight: '600' },
  content: {
    padding: 12,
    backgroundColor: '#4a536bd5',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  contentText: { color: '#fff', paddingVertical: 4 },
  addBtn: { margin: 6 },
  iconButtonContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconButton: {
    borderRadius: 25,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { backgroundColor: backgroundColor, borderRadius: 8 },
});

export default Schedule;
