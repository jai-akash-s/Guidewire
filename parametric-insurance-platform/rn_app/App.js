import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Switch
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';

const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
const zonesByCity = {
  Mumbai: ['Mumbai Central', 'Andheri East', 'Bandra', 'Navi Mumbai'],
  Delhi: ['South Delhi', 'Dwarka', 'Rohini', 'Saket'],
  Bengaluru: ['Koramangala', 'Indiranagar', 'Whitefield'],
  Hyderabad: ['Gachibowli', 'Hitech City', 'Kukatpally'],
  Chennai: ['T Nagar', 'Adyar', 'Velachery'],
  Kolkata: ['Salt Lake', 'Park Street', 'New Town'],
  Pune: ['Hinjewadi', 'Kalyani Nagar', 'Viman Nagar'],
  Ahmedabad: ['Navrangpura', 'Bopal', 'SG Highway']
};

const tierBase = {
  Basic: { premium: 29, cover: '₹300/day', max: '₹900' },
  Standard: { premium: 49, cover: '₹500/day', max: '₹1,500' },
  Premium: { premium: 79, cover: '₹700/day', max: '₹2,100' }
};

const mockPayouts = [
  { week: 'Week 1', amount: 420 },
  { week: 'Week 2', amount: 0 },
  { week: 'Week 3', amount: 780 },
  { week: 'Week 4', amount: 0 }
];

function calculateRiskScore(city, earnings) {
  const cityBias = {
    Mumbai: 65,
    Delhi: 75,
    Bengaluru: 45,
    Hyderabad: 50,
    Chennai: 60,
    Kolkata: 58,
    Pune: 48,
    Ahmedabad: 52
  };
  const base = cityBias[city] || 50;
  const earningsFactor = Math.min(25, Math.round((earnings - 2000) / 240));
  const score = Math.min(95, Math.max(20, base + earningsFactor));
  const tier = score > 70 ? 'High' : score < 30 ? 'Low' : 'Medium';
  return { score, tier };
}

function adjustedPremium(base, riskScore) {
  if (riskScore > 70) return Math.round(base * 1.2);
  if (riskScore < 30) return Math.round(base * 0.85);
  return base;
}

export default function App() {
  const [screen, setScreen] = useState('onboarding');
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [zone, setZone] = useState('Mumbai Central');
  const [platform, setPlatform] = useState('Zomato');
  const [earnings, setEarnings] = useState(5000);
  const [selectedTier, setSelectedTier] = useState('Standard');
  const [autoRenew, setAutoRenew] = useState(true);
  const [alert, setAlert] = useState(false);
  const riskAnim = useRef(new Animated.Value(0)).current;

  const risk = useMemo(() => calculateRiskScore(city, earnings), [city, earnings]);
  const tierCards = useMemo(() => (
    Object.entries(tierBase).map(([key, value]) => ({
      name: key,
      price: adjustedPremium(value.premium, risk.score),
      cover: value.cover,
      max: value.max
    }))
  ), [risk.score]);

  useEffect(() => {
    Animated.timing(riskAnim, {
      toValue: risk.score,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [risk.score, riskAnim]);

  const renderOnboarding = () => {
    if (step === 0) {
      return (
        <View style={styles.card}>
          <Text style={styles.title}>GigShield Login</Text>
          <Text style={styles.muted}>Enter your phone number to receive a mock OTP.</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            accessibilityLabel="Phone number"
          />
          <TextInput
            style={styles.input}
            placeholder="OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            accessibilityLabel="OTP"
          />
          <Pressable style={styles.primaryButton} onPress={() => setStep(1)} accessibilityRole="button">
            <Text style={styles.primaryText}>Verify OTP</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View style={styles.card}>
          <Text style={styles.title}>Profile Setup</Text>
          <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} accessibilityLabel="Full name" />
          <Text style={styles.label}>City</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={city} onValueChange={value => {
              setCity(value);
              const newZone = zonesByCity[value][0];
              setZone(newZone);
            }}>
              {cities.map(item => (
                <Picker.Item label={item} value={item} key={item} />
              ))}
            </Picker>
          </View>
          <Text style={styles.label}>Zone</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={zone} onValueChange={value => setZone(value)}>
              {zonesByCity[city].map(item => (
                <Picker.Item label={item} value={item} key={item} />
              ))}
            </Picker>
          </View>
          <Text style={styles.label}>Platform</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, platform === 'Zomato' && styles.toggleActive]}
              onPress={() => setPlatform('Zomato')}
              accessibilityRole="button"
            >
              <Text style={styles.toggleText}>Zomato</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, platform === 'Swiggy' && styles.toggleActive]}
              onPress={() => setPlatform('Swiggy')}
              accessibilityRole="button"
            >
              <Text style={styles.toggleText}>Swiggy</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>Avg Weekly Earnings (₹{earnings})</Text>
          <Slider
            minimumValue={2000}
            maximumValue={8000}
            step={100}
            value={earnings}
            onValueChange={setEarnings}
            minimumTrackTintColor="#4CE0B3"
            maximumTrackTintColor="#2E3448"
          />
          <Pressable style={styles.primaryButton} onPress={() => setStep(2)} accessibilityRole="button">
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 2) {
      const widthInterpolate = riskAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
      });
      return (
        <View style={styles.card}>
          <Text style={styles.title}>AI Risk Score</Text>
          <Text style={styles.muted}>Calculated from flood history, AQI, curfews, and disruptions.</Text>
          <View style={styles.riskCard}>
            <Text style={styles.riskScore}>{risk.score}</Text>
            <Text style={styles.riskTier}>{risk.tier} Risk</Text>
            <View style={styles.riskBar}>
              <Animated.View style={[styles.riskFill, { width: widthInterpolate }]} />
            </View>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => setStep(3)} accessibilityRole="button">
            <Text style={styles.primaryText}>See Plans</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.title}>Weekly Plan Selection</Text>
        {tierCards.map(tier => (
          <Pressable
            key={tier.name}
            style={[styles.tierCard, selectedTier === tier.name && styles.tierActive]}
            onPress={() => setSelectedTier(tier.name)}
            accessibilityRole="button"
          >
            <View>
              <Text style={styles.tierTitle}>{tier.name}</Text>
              <Text style={styles.tierMeta}>{tier.cover} • Max {tier.max}</Text>
            </View>
            <Text style={styles.tierPrice}>₹{tier.price}/wk</Text>
          </Pressable>
        ))}
        <Pressable style={styles.primaryButton} onPress={() => setScreen('home')} accessibilityRole="button">
          <Text style={styles.primaryText}>Activate {selectedTier}</Text>
        </Pressable>
      </View>
    );
  };

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.cardHero}>
        <Text style={styles.title}>Hi {name || 'Partner'}</Text>
        <Text style={styles.muted}>{platform} • {city}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>Policy {selectedTier}</Text>
          <Text style={styles.badgeAlt}>{autoRenew ? 'Auto-Renew On' : 'Paused'}</Text>
        </View>
        <Text style={styles.metricLabel}>Earnings Protected</Text>
        <Text style={styles.metricValue}>₹1,500</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Live Weather</Text>
        <Text style={styles.muted}>{city} • 31°C • AQI 210</Text>
        <View style={styles.weatherRow}>
          <Text>Rainfall 2mm/hr</Text>
          <Text>Visibility 6km</Text>
        </View>
        <Pressable style={[styles.alertBanner, alert && styles.alertBannerActive]} onPress={() => setAlert(!alert)} accessibilityRole="button">
          <Text style={styles.alertText}>{alert ? 'Disruption Alert Active' : 'No Disruptions'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>My Zone Risk Score</Text>
        <Text style={styles.riskScore}>{risk.score}</Text>
        <Text style={styles.riskTier}>{risk.tier} Risk</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payout History</Text>
        {mockPayouts.map(item => (
          <View key={item.week} style={styles.payoutRow}>
            <Text>{item.week}</Text>
            <Text>₹{item.amount}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryButton} onPress={() => setScreen('policy')} accessibilityRole="button">
        <Text style={styles.primaryText}>Manage Policy</Text>
      </Pressable>
    </ScrollView>
  );

  const renderPolicy = () => (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <Text style={styles.title}>Policy Settings</Text>
        <View style={styles.switchRow}>
          <Text style={styles.sectionTitle}>Weekly Auto-Renew</Text>
          <Switch value={autoRenew} onValueChange={setAutoRenew} accessibilityLabel="Weekly auto renew" />
        </View>
        <Text style={styles.sectionTitle}>Coverage Breakdown</Text>
        <Text style={styles.muted}>Rain, heat, AQI, curfew, platform outage.</Text>
        <Text style={styles.muted}>Max payout per week: {tierBase[selectedTier].max}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => setAutoRenew(false)} accessibilityRole="button">
          <Text style={styles.secondaryText}>Pause Coverage</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => setScreen('home')} accessibilityRole="button">
          <Text style={styles.primaryText}>Back to Home</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {screen === 'onboarding' && renderOnboarding()}
      {screen === 'home' && renderHome()}
      {screen === 'policy' && renderPolicy()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f111a',
    padding: 16
  },
  scroll: {
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#171c28',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16
  },
  cardHero: {
    backgroundColor: '#1f2434',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16
  },
  title: {
    color: '#f5f7ff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8
  },
  sectionTitle: {
    color: '#f5f7ff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  muted: {
    color: '#9aa0b4',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#0f121c',
    color: '#f5f7ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  label: {
    color: '#f5f7ff',
    marginBottom: 6
  },
  pickerWrap: {
    backgroundColor: '#0f121c',
    borderRadius: 12,
    marginBottom: 12
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  toggleButton: {
    flex: 1,
    backgroundColor: '#0f121c',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10
  },
  toggleActive: {
    backgroundColor: '#4ce0b3'
  },
  toggleText: {
    color: '#f5f7ff',
    fontWeight: '600'
  },
  primaryButton: {
    backgroundColor: '#4ce0b3',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12
  },
  primaryText: {
    color: '#0b0f19',
    fontWeight: '700'
  },
  secondaryButton: {
    borderColor: '#4ce0b3',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center'
  },
  secondaryText: {
    color: '#4ce0b3',
    fontWeight: '600'
  },
  riskCard: {
    backgroundColor: '#101522',
    padding: 16,
    borderRadius: 14,
    marginVertical: 12
  },
  riskScore: {
    color: '#f5f7ff',
    fontSize: 32,
    fontWeight: '700'
  },
  riskTier: {
    color: '#4ce0b3',
    fontWeight: '600',
    marginBottom: 10
  },
  riskBar: {
    height: 8,
    backgroundColor: '#1f2533',
    borderRadius: 999,
    overflow: 'hidden'
  },
  riskFill: {
    height: '100%',
    backgroundColor: '#f8b26a'
  },
  tierCard: {
    backgroundColor: '#0f121c',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tierActive: {
    borderColor: '#4ce0b3',
    borderWidth: 1
  },
  tierTitle: {
    color: '#f5f7ff',
    fontWeight: '700'
  },
  tierMeta: {
    color: '#9aa0b4',
    marginTop: 4
  },
  tierPrice: {
    color: '#f5f7ff',
    fontWeight: '700'
  },
  badgeRow: {
    flexDirection: 'row',
    marginVertical: 10
  },
  badge: {
    backgroundColor: '#4ce0b3',
    color: '#0b0f19',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8
  },
  badgeAlt: {
    backgroundColor: '#2d3344',
    color: '#f5f7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  metricLabel: {
    color: '#9aa0b4',
    marginTop: 8
  },
  metricValue: {
    color: '#f5f7ff',
    fontSize: 28,
    fontWeight: '700'
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  alertBanner: {
    marginTop: 12,
    backgroundColor: '#1f2533',
    padding: 12,
    borderRadius: 12
  },
  alertBannerActive: {
    backgroundColor: '#4a2222'
  },
  alertText: {
    color: '#f5f7ff',
    fontWeight: '600'
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  }
});