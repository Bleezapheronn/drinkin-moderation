import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>DIM</Text>
        <Text style={styles.title}>DrinkInModeration</Text>
        <Text style={styles.subtitle}>
          Make a sober plan, then let the app help you keep it.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tonight plan</Text>
        <Text style={styles.body}>
          Start by setting your drink interval, drink maximum, and optional spending cap.
        </Text>
        <Link href="/new-session" style={styles.primaryButton}>
          Start a new session
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 24,
    padding: 24,
    paddingTop: 56,
    backgroundColor: "#f7f4ef",
  },
  header: {
    gap: 8,
  },
  kicker: {
    color: "#3f6f63",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  title: {
    color: "#1f2a2e",
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    color: "#52605f",
    fontSize: 17,
    lineHeight: 24,
  },
  card: {
    gap: 16,
    padding: 20,
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
  body: {
    color: "#52605f",
    fontSize: 16,
    lineHeight: 23,
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
