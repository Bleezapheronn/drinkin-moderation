import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ActiveSessionScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Active Session</Text>
      <Text style={styles.body}>
        Once session logic is added, this screen will show pacing, drink count,
        spending, and practical warnings as limits approach.
      </Text>

      <View style={styles.metrics}>
        <Metric label="Drinks" value="0 / 0" />
        <Metric label="Next drink" value="Not started" />
        <Metric label="Spent" value="$0" />
        <Metric label="Plan status" value="On track" />
      </View>

      <View style={styles.actions}>
        <Text style={styles.secondaryButton}>Log drink</Text>
        <Text style={styles.secondaryButton}>Log spending</Text>
        <Link href="/session-summary" style={styles.primaryButton}>
          End session
        </Link>
      </View>
    </View>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 20,
    padding: 24,
    backgroundColor: "#f7f4ef",
  },
  title: {
    color: "#1f2a2e",
    fontSize: 28,
    fontWeight: "800",
  },
  body: {
    color: "#52605f",
    fontSize: 16,
    lineHeight: 23,
  },
  metrics: {
    gap: 12,
  },
  metric: {
    gap: 4,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  metricLabel: {
    color: "#52605f",
    fontSize: 14,
    fontWeight: "600",
  },
  metricValue: {
    color: "#1f2a2e",
    fontSize: 22,
    fontWeight: "800",
  },
  actions: {
    gap: 12,
    marginTop: "auto",
  },
  primaryButton: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#2f6f62",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingVertical: 14,
    textAlign: "center",
  },
  secondaryButton: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#cfc6ba",
    borderWidth: 1,
    color: "#1f2a2e",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingVertical: 14,
    textAlign: "center",
  },
});
