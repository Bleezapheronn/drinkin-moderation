import { Link, router } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DrinkingSession, useSession } from "../context/session";
import {
  getSessionDateRange,
  getSessionSummaryLine,
  getSessionTitle,
} from "../utils/session-format";

export default function HomeScreen() {
  const { completedSessions, isRestoring, session, storageError } = useSession();
  const recentSessions = completedSessions.slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>DIM</Text>
        <Text style={styles.title}>DrinkInModeration</Text>
        <Text style={styles.subtitle}>
          Make a sober plan, then let the app help you keep it.
        </Text>
      </View>

      {storageError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{storageError}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tonight plan</Text>
        <Text style={styles.body}>
          {isRestoring
            ? "Checking this device for a saved active session."
            : session
              ? "There is an active session saved on this device."
              : "Start by setting your drink interval, drink maximum, and optional spending cap."}
        </Text>

        {session ? (
          <Link href="/active-session" style={styles.primaryButton}>
            Resume Session
          </Link>
        ) : (
          <Link href="/new-session" style={styles.primaryButton}>
            Start a new session
          </Link>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {recentSessions.length > 0 ? (
          <>
            {recentSessions.map((recentSession, index) => (
              <RecentSessionCard
                key={`${recentSession.startedAt}-${recentSession.endedAt}`}
                sessionIndex={index}
                session={recentSession}
              />
            ))}
            <Link href={"/session-history" as Href} style={styles.secondaryButton}>
              View all sessions
            </Link>
          </>
        ) : (
          <Text style={styles.body}>Completed sessions will appear here after you end them.</Text>
        )}
      </View>
    </ScrollView>
  );
}

type RecentSessionCardProps = {
  session: DrinkingSession;
  sessionIndex: number;
};

function RecentSessionCard({ session, sessionIndex }: RecentSessionCardProps) {
  return (
    <Pressable
      onPress={() =>
        router.push(`/session-detail/${sessionIndex}` as Href)
      }
      style={styles.recentCard}
    >
      <Text style={styles.recentTitle}>{getSessionTitle(session)}</Text>
      <Text style={styles.recentDate}>{getSessionDateRange(session)}</Text>
      <Text style={styles.recentText}>{getSessionSummaryLine(session)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#1f2a2e",
    fontSize: 22,
    fontWeight: "800",
  },
  recentCard: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  recentTitle: {
    color: "#1f2a2e",
    fontSize: 18,
    fontWeight: "800",
  },
  recentDate: {
    color: "#52605f",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  recentText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  notice: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fbe9e6",
    borderColor: "#df9b8f",
    borderWidth: 1,
  },
  noticeText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
});
