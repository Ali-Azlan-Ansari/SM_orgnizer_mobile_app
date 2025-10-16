import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Linking,
  Alert,
  Platform,
  BackHandler,
  Image,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Layout, Card, Text, Button } from '@ui-kitten/components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TopNavigationAccessoriesShowcase } from './TopNavigationAccessoriesShowcase';
import QRCode from 'react-native-qrcode-svg'; // 👈 Make sure you installed: npm install react-native-qrcode-svg

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
  const IBAN = 'PK21SADA0000003108693669';
  const IBANQR = 'PK21 SADA 0000 0031 0869 3669';
  const [btntext,setBtntext]=useState<string>('Copy IBAN')
  
  const donationLink = 'https://sadapay.pk'; // 🔗 Replace with your payment link if available

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Active');
        return true;
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, [navigation]),
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
      ],
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
      ],
    });
  };

  const sendEmail = async ({
    to,
    subject,
    bodyHeader,
  }: {
    to: string;
    subject: string;
    bodyHeader: string[];
  }) => {
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
      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(
        subject,
      )}&body=${body}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        Alert.alert(
          'No Email App',
          'Could not open email client on this device.',
        );
        return;
      }
      await Linking.openURL(mailtoUrl);
    } catch (err) {
      console.warn('sendEmail error', err);
      Alert.alert('Error', 'Unable to compose email.');
    }
  };

  const copyIBAN = async () => {
    Clipboard.setString(IBAN);
    setBtntext('Copied!')
    setTimeout(() => {
      setBtntext(' Copy IBAN')
    }, 500);
  };

  const openDonationLink = async () => {
    const supported = await Linking.canOpenURL(donationLink);
    if (supported) await Linking.openURL(donationLink);
    else Alert.alert('Error', 'Unable to open donation link.');
  };

  return (
    <>
      <TopNavigationAccessoriesShowcase title="Help" />
      <Layout style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* 💚 Donation Card */}
          <Card style={styles.card}>
            <Text category="h6" style={{ marginBottom: 6 }}>
              Donate to Khidmat-e-Khalq 💚
            </Text>
            <Text appearance="hint" style={styles.donateDescription}>
              Help us support <Text status="danger">cancer patients</Text>. Your
              donations bring hope and treatment to those who need it most.
            </Text>

            {/* 👇 Patient images */}
            <View style={styles.imageRow}>
              {/* First Column */}
              <Image
                source={require('./assets/patient1.png')}
                style={[styles.patientImage, { flex: 1, marginRight: 5 }]}
              />

              {/* Second Column with 2 Rows */}
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <Image
                  source={require('./assets/patient2.png')}
                  style={[styles.patientImage2, { marginBottom: 5 }]}
                />
                <Image
                  source={require('./assets/patient3.png')}
                  style={styles.patientImage2}
                />
              </View>
            </View>

            {/* 👇 IBAN Section */}
            <View style={styles.ibanBox}>
              <Text category="label" style={styles.ibanLabel}>
                Bank
              </Text>
              <Text selectable style={styles.ibanText}>
                SADAPAY
              </Text>
              <Text category="label" style={styles.ibanLabel}>
                IBAN
              </Text>
              <Text selectable style={styles.ibanText}>
                {IBAN}
              </Text>
              <Button size="tiny" onPress={copyIBAN} style={styles.copyButton}>
                {btntext}
              </Button>
            </View>

            {/* 👇 QR Code */}
            {/* <View style={styles.qrContainer}>
              <QRCode
                value={IBANQR}
                size={130}
                backgroundColor="#ffffff"
                color="#000000"
              />
              <Text appearance="hint" style={styles.qrText}>
                Scan to Donate
              </Text>
            </View> */}

            {/* 👇 Donate Link */}
            {/* <Button
              onPress={openDonationLink}
              style={styles.donateButton}
              status="success"
            >
              Donate via Link
            </Button> */}
          </Card>

          {/* Existing Help Section */}
          <Card style={styles.card}>
            <Text category="h6" style={{ marginBottom: 6 }}>
              Found a problem?
            </Text>
            <Text>
              If something isn’t working right, send us a bug report. The email
              will prefill useful context — just explain what happened, steps to
              reproduce, and optionally attach a screenshot.
            </Text>
            <Button style={styles.reportButton} onPress={sendBugReport}>
              Report a Bug
            </Button>
            <Text appearance="hint" style={{ marginTop: 6, fontSize: 12 }}>
              Note: Screenshots can’t be auto-attached via the default email
              link; you can attach them manually in the email composer.
            </Text>
          </Card>

          <Card style={styles.card}>
            <Text category="h6" style={{ marginBottom: 6 }}>
              Have a question or feedback?
            </Text>
            <Text>
              You can send us your query or any feedback regarding the app.
              We'll get back to you as soon as possible.
            </Text>
            <Button style={styles.reportButton} onPress={sendUserQuery}>
              Contact Support
            </Button>
          </Card>
        </ScrollView>
      </Layout>
    </>
  );
};

export default HelpGuide;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scroll: { paddingBottom: 24, gap: 12 },
  card: { marginBottom: 12, borderRadius: 12, padding: 12 },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  icon: { fontSize: 24, color: '#7ebe4b' },
  stepTitle: { flex: 1, fontWeight: '600' },
  stepDescription: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  reportButton: { marginTop: 8, alignSelf: 'flex-start' },

  // 🔹 Donation Styles

  donateDescription: { marginBottom: 10, fontSize: 14 },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patientImage: { width: "100%", height: 300, borderRadius: 8 },
  patientImage2:{ width: "100%", height: 150, borderRadius: 8},
  ibanBox: { padding: 8, borderRadius: 8, marginBottom: 10 },
  ibanLabel: { fontWeight: '700' },
  ibanText: { fontWeight: '600', marginTop: 2 },
  copyButton: { marginTop: 6, alignSelf: 'flex-start' },
  qrContainer: {
    width: 'auto',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  qrText: { fontSize: 12, marginTop: 4 },
  donateButton: { marginTop: 8, borderRadius: 8 },
});
