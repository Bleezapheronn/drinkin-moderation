import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NewSessionScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Set the plan while clear-headed.</Text>
      <Text style={styles.body}>
        This screen will collect the session context, drink interval, maximum drinks,
        optional spending cap, and planned end time.
      </Text>

      <View style={styles.list}>
        <Text style={styles.item}>Default interval: 60 minutes</Text>
        <Text style={styles.item}>Drink maximum: not set yet</Text>
        <Text style={styles.item}>Spending cap: optional</Text>
        <Text style={styles.item}>Planned end time: optional</Text>
      </View>

      <Link href="/active-session" style={styles.primaryButton}>
        Preview active session
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
    lineHeight: 34,
  },
  body: {
    color: "#52605f",
    fontSize: 16,
    lineHeight: 23,
  },
  list: {
    gap: 12,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  item: {
    color: "#1f2a2e",
    fontSize: 16,
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
