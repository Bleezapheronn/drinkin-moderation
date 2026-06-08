import { router } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DrinkingSession, useSession } from "../context/session";
import { useSettings } from "../context/settings";
import {
  getSessionDateRange,
  getSessionSummaryLine,
  getSessionTitle,
} from "../utils/session-format";

export default function SessionHistoryScreen() {
  const { completedSessions, isRestoring, storageError } = useSession();
  const { settings } = useSettings();

  if (isRestoring) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Session History</Text>
        <Text style={styles.body}>Checking saved sessions on this device.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Session History</Text>
        <Text style={styles.body}>Review completed sessions without changing them.</Text>
      </View>

      {storageError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{storageError}</Text>
        </View>
      ) : null}

      {completedSessions.length > 0 ? (
        <View style={styles.list}>
          {completedSessions.map((session, index) => (
            <HistoryCard
              key={`${session.startedAt}-${session.endedAt}`}
              currency={settings.currency}
              sessionIndex={index}
              session={session}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No completed sessions yet</Text>
          <Text style={styles.body}>
            No completed sessions yet. Start a session to build your history.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

type HistoryCardProps = {
  currency: "KES" | "USD";
  session: DrinkingSession;
  sessionIndex: number;
};

function HistoryCard({ currency, session, sessionIndex }: HistoryCardProps) {
  return (
    <Pressable
      onPress={() =>
        router.push(`/session-detail/${sessionIndex}` as Href)
      }
      style={styles.card}
    >
      <Text style={styles.cardTitle}>{getSessionTitle(session)}</Text>
      <Text style={styles.cardMeta}>{getSessionDateRange(session)}</Text>
      <Text style={styles.cardText}>{getSessionSummaryLine(session, currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: 20,
    padding: 24,
    backgroundColor: "#f7f4ef",
  },
  header: {
    gap: 8,
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
  list: {
    gap: 12,
  },
  card: {
    gap: 6,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  cardTitle: {
    color: "#1f2a2e",
    fontSize: 18,
    fontWeight: "800",
  },
  cardMeta: {
    color: "#52605f",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  cardText: {
    color: "#52605f",
    fontSize: 15,
    lineHeight: 21,
  },
  emptyCard: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#e5ded3",
    borderWidth: 1,
  },
  emptyTitle: {
    color: "#1f2a2e",
    fontSize: 18,
    fontWeight: "800",
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
