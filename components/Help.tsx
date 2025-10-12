import React, { useCallback } from 'react';
import { StyleSheet, View, ScrollView, Linking, Alert, Platform, BackHandler } from 'react-native';
import { Layout, Card, Text, Button } from '@ui-kitten/components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';

const Step = ({ number, title, description, iconName }: any) => (
  <Card style={styles.card}>
    <View style={styles.stepHeader}>
      <FontAwesome6 name={iconName} style={styles.icon} />
      <Text category="h6" style={styles.stepTitle}>
        {number}. {title}
      </Text>
    </View>
    <Text style={styles.stepDescription}>{description}</Text>
  </Card>
);

const HelpGuide = () => {
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Active');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const sendBugReport = async () => {
    await sendEmail({
      to: 'aliazlanansari@gmail.com',
      subject: 'Bug Report: SM_organizer v1.0.0',
      bodyHeader: [
        'Please describe the bug here:\n',
        'Steps to reproduce:',
        '--- ',
        '',
        'Expected behavior:',
        '---',
        'Actual behavior:',
        '',
      ]
    });
  };

  const sendUserQuery = async () => {
    await sendEmail({
      to: 'aliazlanansari@gmail.com',
      subject: 'User Query: SM_organizer v1.0.0',
      bodyHeader: [
        'Your query or feedback:\n',
        'Describe your question or request here:',
        '',
      ]
    });
  };

  const sendEmail = async ({ to, subject, bodyHeader }: { to: string; subject: string; bodyHeader: string[] }) => {
    try {
      const appName = 'SM_organizer';
      const appVersion = '1.0.0';
      const platformInfo = `${Platform.OS} ${Platform.Version}`;
      const timestamp = new Date().toISOString();

      const bodyLines = [
        ...bodyHeader,
        '---',
        `App: ${appName}`,
        `Version: ${appVersion}`,
        `Platform: level ${platformInfo}`,
        `Time: ${timestamp}`,
      ];
      const body = encodeURIComponent(bodyLines.join('\n'));
      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        Alert.alert('No Email App', 'Could not open email client on this device.');
        return;
      }
      await Linking.openURL(mailtoUrl);
    } catch (err) {
      console.warn('sendEmail error', err);
      Alert.alert('Error', 'Unable to compose email.');
    }
  };

  return (
     <><TopNavigationAccessoriesShowcase title="Help" /><Layout style={styles.container}>



      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text category="h6" style={{ marginBottom: 6 }}>Found a problem?</Text>
          <Text>
            If something isn’t working right, send us a bug report. The email will prefill useful context — just explain what happened, steps to reproduce, and optionally attach a screenshot.
          </Text>
          <Button style={styles.reportButton} onPress={sendBugReport}>Report a Bug</Button>
          <Text appearance="hint" style={{ marginTop: 6, fontSize: 12 }}>
            Note: Screenshots can’t be auto-attached via the default email link; you can attach them manually in the email composer.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text category="h6" style={{ marginBottom: 6 }}>Have a question or feedback?</Text>
          <Text>
            You can send us your query or any feedback regarding the app. We'll get back to you as soon as possible.
          </Text>
          <Button style={styles.reportButton} onPress={sendUserQuery}>Contact Support</Button>
        </Card>
      </ScrollView>
    </Layout></>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scroll: { paddingBottom: 24, gap: 12 },
  card: { marginBottom: 12, borderRadius: 12, padding: 12 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  icon: { fontSize: 24, color: '#7ebe4b' },
  stepTitle: { flex: 1, fontWeight: '600' },
  stepDescription: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  reportButton: { marginTop: 8, alignSelf: 'flex-start' },
});

export default HelpGuide;
