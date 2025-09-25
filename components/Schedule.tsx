import React, {useState,useEffect} from 'react';
import {View,StyleSheet,ScrollView} from 'react-native';
import Accordion from 'react-native-collapsible/Accordion';
import {Button,Layout,List,ListItem,Text} from '@ui-kitten/components';
import {useNavigation} from '@react-navigation/native';
import {primaryColor,baseBGColor, backgroundColor} from './Color';
import {TopNavigationAccessoriesShowcase} from './TopNavigationAccessoriesShowcase';
import {getDBConnection,deleteSchedule, getSchedules, Schedule as ScheduleType} from '../DataBase/db';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import dayjs from 'dayjs';
import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const Schedule=()=>{
  const [activeSections,setActiveSections]=useState<number[]>([]);
  const [sections,setSections]=useState<any[]>([]);
  const [data,setData]=useState<ScheduleType[]>([]);
  const navigation=useNavigation<any>();

  // --- 1) Notification channel + test notification ---
  const setupNotificationChannel=async()=> {
    // Ask for permission (iOS + Android 13+)
    await notifee.requestPermission();

    // Android channel (required)
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
   
  };

  // --- 2) Load schedules and schedule notifications ---
  const loadSchedules=async()=>{
    const db=await getDBConnection();
    const data=await getSchedules(db);
    setData(data)
    // group by day
    const grouped=days.map(day=>({
      title:day,
      content:data.filter((s:any)=>s.day===day)
    }));
    setSections(grouped);
   
    // schedule notifications for each class
  };

  useEffect(()=>{
    setupNotificationChannel(); // ask permission + create channel + test
    debugger
    const unsubscribe=navigation.addListener('focus',loadSchedules);
    return unsubscribe;
  },[navigation]);

  // --- 3) Helpers for day/time ---
  const daysMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  // get next Date for a given day/time like "10:20 PM"
  const getNextDateForDayAndTime=async(day: string, time: string): Promise<Date>=>{
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

    let now = dayjs();
    let target = now
      .day(daysMap[day.toLowerCase().slice(0,3)]) // 'mon' 'tue' etc.
      .hour(hours)
      .minute(minutes)
      .second(0);

    if (target.isBefore(now)) {
      target = target.add(7, 'day'); // next week
    }

    console.log('Target JS Date:', target.toDate().toString());
    return target.toDate()
  };

  // --- 4) Schedule one notification for a class ---
  const scheduleNotification=async(schedule: {
    id:number;
    day: string;
    subject: string;
    start_time: string;
    end_time: string;
  })=>{
    debugger
    const date = await getNextDateForDayAndTime(schedule.day, schedule.start_time);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: 2, // weekly repeat
    };

    await notifee.createTriggerNotification(
      {
        id: `schedule-${schedule.id}`,
        title: `Class: ${schedule.subject}`,
        body: `Starts at ${schedule.start_time} - Ends at ${schedule.end_time}`,
        android: {
          channelId: 'default',
          pressAction: { id: 'default' },
        },
      },
      trigger
    );
  };

  // --- 5) Accordion rendering ---
  const renderHeader=(section:any,_:number,isActive:boolean)=>( 
    <View style={[styles.header,isActive&&styles.headerActive]}>
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
            onPress={() => navigation.navigate('EditClassTime', { id: item.id })}
            style={styles.iconButton}
            size="tiny"
            status="primary"
            accessoryLeft={<FontAwesome6 name="pen" color={'#fff'}  iconStyle="solid" />}
          />
          <Button
            onPress={async()=>{
                const db=await getDBConnection();
                await deleteSchedule(db,item.id);
                loadSchedules();
            }}
            style={styles.iconButton}
            size="tiny"
            status="danger"
            accessoryLeft={<FontAwesome6 name="trash" color={'#fff'} iconStyle="solid" />}
          />
        </View>
      )}
    />
  );

  const renderContent=(section:any)=>( 
    <View style={styles.content}>
      {section.content.length===0?(
        <Text style={styles.contentText}>Empty</Text>
      ):  <List
          style={styles.list}
          data={section.content}
          renderItem={renderListItem}
        />}
    </View>
  );

  return(
    <View style={{flex:1,backgroundColor:baseBGColor}}>
      <TopNavigationAccessoriesShowcase title="Schedule"/>
      <Button style={styles.addBtn} status='success'
        onPress={()=>navigation.navigate('AddClassTime')}>
        Add Class Time
      </Button>
      <Button style={styles.addBtn} status='primery'
        onPress={()=>{ data.forEach((s: any) => {scheduleNotification(s)})}}>
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
    </View>
  );
};

const styles=StyleSheet.create({
  container:{flex:1,padding:10},
  header:{padding:14,backgroundColor:'#fff',marginTop:3,borderRadius:5,borderWidth:4,borderColor:primaryColor},
  headerActive:{backgroundColor:'#fff'},
  headerText:{color:primaryColor,fontSize:16,fontWeight:'600'},
  content:{padding:12,backgroundColor:"#4a536bd5",borderBottomLeftRadius:4,borderBottomRightRadius:4},
  contentText:{color:'#fff',paddingVertical:4},
  addBtn:{margin:6},
  iconButtonContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    borderRadius: 25,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    backgroundColor: backgroundColor,
    borderRadius: 8,
  },
});

export default Schedule;
