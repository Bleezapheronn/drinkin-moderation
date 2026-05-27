import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SessionSummaryScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Session Summary</Text>
      <Text style={styles.body}>
        This placeholder will summarize total drinks, spending, duration, and whether
        the session stayed within the plan.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>No session data yet</Text>
        <Text style={styles.body}>
          Persistence and session calculations will come later. For now, this screen
          confirms the review flow.
        </Text>
      </View>

      <Link href="/" style={styles.primaryButton}>
        Back home
      </Link>
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
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  cardTitle: {
    color: "#1f2a2e",
    fontSize: 20,
    fontWeight: "700",
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
});
