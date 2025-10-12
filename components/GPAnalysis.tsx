import React, { JSX, useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import Loader from './Loader';
import {
  Layout,
  Select,
  SelectItem,
  IndexPath,
  Text,
} from '@ui-kitten/components';
import { baseBGColor } from './Color';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import {
  getDBConnection,
  getAllGradingScales,
  getAvailableYears,
  getAvailableSemesters,
  getMarksByYear,
  getMarksBySemester,
} from '../DataBase/db';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const GPAnalysis = (): React.ReactElement => {
  const [loading, setLoading] = useState(false);

  const [years, setYears] = useState<number[]>([]);
  const [semesters, setSemesters] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  const [marksYear, setMarksYear] = useState<any[]>([]);
  const [marksSemester, setMarksSemester] = useState<any[]>([]);
  const [gradingData, setGradingData] = useState<any[]>([]);
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

  // load years & grading scale
  useEffect(() => {
    (async () => {
      setLoading(true);
      const db = await getDBConnection();
      const yrs = await getAvailableYears(db);
      setYears(yrs);
      if (yrs.length) setSelectedYear(yrs[0]);
      const gScale = await getAllGradingScales(db);
      setGradingData(gScale);
      setLoading(false);
    })();
  }, []);

  const highestGrade = (): number => {
    if (gradingData && gradingData.length > 0) {
      return Math.max(...gradingData.map(g => g.grade_points));
    }
    return 0; // ✅ fallback if no data
  };
  // when year changes load semesters + year marks
  useEffect(() => {
    (async () => {
      if (selectedYear != null) {
        const db = await getDBConnection();
        const sems = await getAvailableSemesters(db, selectedYear);
        setSemesters(sems);
        if (sems.length) setSelectedSemester(sems[0]);
        const mks = await getMarksByYear(db, selectedYear);
        setMarksYear(mks);
      }
    })();
  }, [selectedYear]);

  // when semester changes load semester marks
  useEffect(() => {
    (async () => {
      if (selectedYear != null && selectedSemester != null) {
        const db = await getDBConnection();
        const mks = await getMarksBySemester(
          db,
          selectedSemester,
          selectedYear,
        );
        setMarksSemester(mks);
      }
    })();
  }, [selectedSemester, selectedYear]);

  // GPA helper
  const getGpForMark = (obt: number, total: number) => {
    const per = (obt / total) * 100;
    const grade = gradingData.find(g => per >= g.min_mark && per <= g.max_mark);
    return grade ? grade.grade_points : 0;
  };

  // BAR CHART data for selected year (subject wise GPA)
  const barData = (marksYear || []).map((m, idx) => {
    const gp = getGpForMark(m.obtained_marks, m.total_marks);
    const highest = highestGrade();
    const percent = highest > 0 ? (gp / highest) * 100 : 0;
    let color = '#ff0099'; // more vivid red
    if (percent >= 80) color = '#8000ff'; // dark green
    else if (percent >= 70) color = '#00ffea'; // light green
    else if (percent >= 50) color = '#ff8400'; // yellow
    return {
      value: gp, // y axis = GPA
      label: m.subject_name,
      frontColor: color,
    };
  });

  // PIE CHART data for selected semester (subject wise GPA)
  const pieData = (marksSemester || []).map((m, idx) => {
    const gp = getGpForMark(m.obtained_marks, m.total_marks);
    const highest = highestGrade();
    const percent = highest > 0 ? (gp / highest) * 100 : 0;
    let color = '#ff0099'; // more vivid red
    if (percent >= 80) color = '#8000ff'; // dark green
    else if (percent >= 70) color = '#00ffea'; // light green
    else if (percent >= 50) color = '#ff8400'; // yellow
    return {
      value: gp,
      color: color,
      text: `${
        m.subject_name.length > 10
          ? m.subject_name.slice(0, 10) + '...'
          : m.subject_name
      } : ${gp.toFixed(2)}`,
    };
  });

  const renderLegendComponent = (): JSX.Element => {
    return (
      <View
        style={{
          marginTop: 16,
          flexWrap: 'wrap',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        {pieData.map((item, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: 140,
              marginBottom: 8,
              marginRight: 12,
            }}
          >
       
            {renderDot(item.color)}
            <Text style={{ color: 'white' }}>{item.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDot = (color: string) => {
    return (
      <View
        style={{
          height: 15,
          width: 15,
          borderRadius: 10,
          backgroundColor: color,
          marginRight: 10,
        }}
      />
    );
  };

  // calculate GPA for semester
  const calSemesterGpa = (): number => {
    let totalWeightedPoints = 0;
    let totalCreditHours = 0;
    (marksSemester || []).forEach(e => {
      const gp = getGpForMark(e.obtained_marks, e.total_marks);
      totalWeightedPoints += e.credit_hour * gp;
      totalCreditHours += e.credit_hour;
    });
    const gpa =
      totalCreditHours > 0 ? totalWeightedPoints / totalCreditHours : 0;
    return Number(gpa.toFixed(2));
  };

  return (
   <>
  <View>
    <TopNavigationAccessoriesShowcase title="GPA Analysis" />
  </View>

  {/* 👇 Layout ke andar ScrollView wrap */}
  <Layout style={styles.mainContainer}>
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Year dropdown */}
      <View style={styles.ddContainet}>
        <Text style={styles.text} category="Label">
          Yearly Progress :
        </Text>
        <Select
          style={styles.dropdown}
          placeholder="Select Year"
          selectedIndex={
            selectedYear != null
              ? new IndexPath(years.indexOf(selectedYear))
              : undefined
          }
          value={selectedYear}
          onSelect={index => {
            const i = Array.isArray(index) ? index[0] : index;
            setSelectedYear(years[i.row]);
          }}
        >
          {years.map(y => (
            <SelectItem title={`${y}`} key={y} />
          ))}
        </Select>
      </View>

      {/* Yearly progress bar chart */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        {barData.length > 0 ? (
          <BarChart
            showFractionalValues
            showGradient
            noOfSections={highestGrade() * 2}
            maxValue={highestGrade()}
            data={barData}
            barWidth={40}
            sideWidth={15}
            side="right"
            isAnimated
          />
        ) : (
          <Text style={{ color: 'white', marginVertical: 20 }}>
            No data available for this year
          </Text>
        )}
      </View>

      {/* Semester dropdown */}
      <View style={styles.ddContainet}>
        <Text style={styles.text} category="Label">
          Semester Progress :
        </Text>
        <Select
          style={styles.dropdown}
          placeholder="Select Semester"
          selectedIndex={
            selectedSemester != null
              ? new IndexPath(semesters.indexOf(selectedSemester))
              : undefined
          }
          value={selectedSemester}
          onSelect={index => {
            const i = Array.isArray(index) ? index[0] : index;
            setSelectedSemester(semesters[i.row]);
          }}
        >
          {semesters.map(s => (
            <SelectItem title={`Semester ${s}`} key={s} />
          ))}
        </Select>
      </View>

      {/* Semester pie chart */}
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        {pieData.length > 0 ? (
          <>
            <PieChart
              donut
              showGradient
              sectionAutoFocus
              radius={128}
              innerRadius={84}
              isAnimated
              strokeColor="#212B46"
              strokeWidth={4}
              innerCircleColor="#212B46"
              textSize={10}
              data={pieData}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text category="label">GPA</Text>
                  <Text category="h6">{calSemesterGpa()}</Text>
                </View>
              )}
            />

            {/* 👇 Legend ab chart ke neeche render hoga */}
            {renderLegendComponent()}
          </>
        ) : (
          <Text style={{ color: 'white', marginVertical: 20 }}>
            No data available for this semester
          </Text>
        )}
      </View>
    </ScrollView>

    <Loader visible={loading} animationSpeedMultiplier={1.0} />
  </Layout>
</>

  );
};

export default GPAnalysis;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: baseBGColor, padding: 12 },
  ddContainet: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    margin: 2,
  },
  dropdown: { width: '50%' },
});
