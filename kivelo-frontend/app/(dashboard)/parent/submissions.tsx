// app/(dashboard)/parent/submissions.tsx - Parent Submissions Review
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useActivity, AllSubmissionsItem, Question, Submission } from "../../../context/ActivityContext";
import { useTheme } from "../../../context/ThemeContext";
import { showAlert } from "@/utils/showAlert";

const CATEGORY_COLORS: Record<string, string> = {
  education: '#3B82F6',
  physical: '#EF4444',
  creative: '#A855F7',
  chores: '#F59E0B',
  social: '#10B981',
  mindfulness: '#8B5CF6',
};

const CATEGORY_ICONS: Record<string, string> = {
  education: 'book-outline',
  physical: 'fitness-outline',
  creative: 'color-palette-outline',
  chores: 'home-outline',
  social: 'people-outline',
  mindfulness: 'flower-outline',
};

const STATUS_COLORS: Record<string, string> = {
  pending_review: '#F59E0B',
  approved: '#10B981',
  needs_revision: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: '⏳ Pending Review',
  approved: '✅ Approved',
  needs_revision: '🔄 Needs Revision',
};

export default function ParentSubmissions() {
  const { getAllSubmissions, reviewSubmission, loading } = useActivity();
  const { colors, themeColors } = useTheme();
  
  const [submissions, setSubmissions] = useState<AllSubmissionsItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'needs_revision'>('all');
  
  // Review modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AllSubmissionsItem | null>(null);
  const [feedback, setFeedback] = useState('');
  const [pointsToAward, setPointsToAward] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const loadSubmissions = useCallback(async () => {
    const result = await getAllSubmissions();
    if (result.success && result.submissions) {
      setSubmissions(result.submissions);
      setPendingCount(result.pendingCount || 0);
    }
  }, [getAllSubmissions]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  };

  const openReviewModal = (item: AllSubmissionsItem) => {
    setSelectedSubmission(item);
    setFeedback('');
    setPointsToAward(item.points.toString());
    setModalVisible(true);
  };

  const handleReview = async (status: 'approved' | 'needs_revision') => {
    if (!selectedSubmission) return;

    if (status === 'needs_revision' && !feedback.trim()) {
      showAlert("Feedback Required", "Please provide feedback when requesting revisions.");
      return;
    }

    try {
      setIsReviewing(true);
      const result = await reviewSubmission(
        selectedSubmission.activityId,
        selectedSubmission.submission._id,
        {
          status,
          feedback: feedback.trim(),
          pointsAwarded: status === 'approved' ? parseInt(pointsToAward) || selectedSubmission.points : 0
        }
      );

      if (result.success) {
        showAlert(
          status === 'approved' ? "Approved! 🎉" : "Revision Requested",
          result.message || (status === 'approved' ? "Submission approved and points awarded!" : "Child has been notified to revise.")
        );
        setModalVisible(false);
        await loadSubmissions();
      } else {
        showAlert("Error", result.message || "Failed to review submission");
      }
    } catch {
      showAlert("Error", "Failed to review submission");
    } finally {
      setIsReviewing(false);
    }
  };

  const filteredSubmissions = submissions.filter(item => {
    if (filter === 'all') return true;
    return item.submission.status === filter;
  });

  const getChildName = (submission: Submission): string => {
    if (typeof submission.childId === 'object' && submission.childId.name) {
      return submission.childId.name;
    }
    return 'Child';
  };

  const renderSubmissionCard = (item: AllSubmissionsItem, index: number) => {
    const categoryColor = CATEGORY_COLORS[item.category] || '#666';
    const categoryIcon = CATEGORY_ICONS[item.category] || 'cube-outline';
    const statusColor = STATUS_COLORS[item.submission.status];

    return (
      <Animated.View
        key={item.submission._id}
        entering={FadeInDown.delay(index * 100).springify()}
      >
        <TouchableOpacity
          style={[styles.submissionCard, { backgroundColor: colors.surface }]}
          onPress={() => openReviewModal(item)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
              <Ionicons name={categoryIcon as any} size={14} color={categoryColor} />
              <Text style={[styles.categoryText, { color: categoryColor }]}>{item.category}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[item.submission.status]}
              </Text>
            </View>
          </View>

          {/* Activity Title */}
          <Text style={[styles.activityTitle, { color: colors.text }]}>{item.activityTitle}</Text>

          {/* Child Info */}
          <View style={styles.childInfo}>
            <View style={[styles.childAvatar, { backgroundColor: themeColors.primary + '20' }]}>
              <Ionicons name="person" size={16} color={themeColors.primary} />
            </View>
            <Text style={[styles.childName, { color: colors.text }]}>
              {getChildName(item.submission)}
            </Text>
            <Text style={[styles.submissionDate, { color: colors.textSecondary }]}>
              • {new Date(item.submission.submittedAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Preview of submission */}
          {item.submission.textResponse && (
            <View style={[styles.previewBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.previewText, { color: colors.textSecondary }]} numberOfLines={2}>
                "{item.submission.textResponse}"
              </Text>
            </View>
          )}

          {/* Questions answered */}
          {item.questions.length > 0 && (
            <View style={styles.questionsInfo}>
              <Ionicons name="help-circle-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.questionsInfoText, { color: colors.textSecondary }]}>
                {item.submission.answers?.length || 0}/{item.questions.length} questions answered
              </Text>
            </View>
          )}

          {/* Points badge */}
          <View style={styles.cardFooter}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>⭐ {item.points} pts</Text>
            </View>
            {item.submission.status === 'pending_review' && (
              <View style={[styles.reviewButton, { backgroundColor: themeColors.primary }]}>
                <Text style={styles.reviewButtonText}>Review →</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={themeColors.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📝 Submissions</Text>
          <Text style={styles.headerSubtitle}>Review your children's work</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </LinearGradient>

      {/* Filter tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending_review', label: '⏳ Pending' },
            { key: 'approved', label: '✅ Approved' },
            { key: 'needs_revision', label: '🔄 Revision' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterTab,
                { backgroundColor: colors.card },
                filter === f.key && { backgroundColor: themeColors.primary }
              ]}
              onPress={() => setFilter(f.key as any)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.textSecondary },
                filter === f.key && { color: 'white' }
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Submissions List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && submissions.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading submissions...</Text>
          </View>
        ) : filteredSubmissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Submissions</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'pending_review'
                ? "No submissions waiting for review"
                : filter === 'approved'
                ? "No approved submissions yet"
                : filter === 'needs_revision'
                ? "No submissions needing revision"
                : "Your children haven't submitted any activities yet"}
            </Text>
          </View>
        ) : (
          filteredSubmissions.map((item, index) => renderSubmissionCard(item, index))
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Review Submission</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedSubmission && (
              <>
                {/* Activity Info */}
                <View style={[styles.activityInfo, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.modalActivityTitle, { color: colors.text }]}>
                    {selectedSubmission.activityTitle}
                  </Text>
                  <View style={styles.modalChildRow}>
                    <Ionicons name="person-circle-outline" size={20} color={themeColors.primary} />
                    <Text style={[styles.modalChildName, { color: colors.text }]}>
                      {getChildName(selectedSubmission.submission)}
                    </Text>
                    <Text style={[styles.modalDate, { color: colors.textSecondary }]}>
                      Submitted {new Date(selectedSubmission.submission.submittedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Answers */}
                {selectedSubmission.questions.length > 0 && (
                  <View style={styles.answersSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      📝 Answers ({selectedSubmission.submission.answers?.length || 0}/{selectedSubmission.questions.length})
                    </Text>
                    {selectedSubmission.questions.map((question, index) => {
                      const answer = selectedSubmission.submission.answers?.find(
                        a => a.questionId === question._id
                      );
                      return (
                        <View key={question._id} style={[styles.answerCard, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.questionLabel, { color: themeColors.primary }]}>
                            Question {index + 1}
                          </Text>
                          <Text style={[styles.questionText, { color: colors.text }]}>
                            {question.questionText}
                          </Text>
                          <View style={[styles.answerBox, { backgroundColor: colors.card }]}>
                            <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>Answer:</Text>
                            <Text style={[styles.answerText, { color: colors.text }]}>
                              {answer?.answer || '(No answer provided)'}
                            </Text>
                            {answer?.isCorrect !== null && answer?.isCorrect !== undefined && (
                              <View style={[
                                styles.correctBadge,
                                { backgroundColor: answer.isCorrect ? '#10B981' + '20' : '#EF4444' + '20' }
                              ]}>
                                <Ionicons
                                  name={answer.isCorrect ? 'checkmark-circle' : 'close-circle'}
                                  size={16}
                                  color={answer.isCorrect ? '#10B981' : '#EF4444'}
                                />
                                <Text style={{
                                  color: answer.isCorrect ? '#10B981' : '#EF4444',
                                  fontSize: 12,
                                  fontWeight: '600'
                                }}>
                                  {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Text Response */}
                {selectedSubmission.submission.textResponse && (
                  <View style={styles.responseSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>✍️ Written Response</Text>
                    <View style={[styles.responseBox, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.responseText, { color: colors.text }]}>
                        {selectedSubmission.submission.textResponse}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Review Controls */}
                {selectedSubmission.submission.status === 'pending_review' && (
                  <View style={styles.reviewControls}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Your Review</Text>

                    {/* Points to award */}
                    <View style={[styles.pointsControl, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.pointsLabel, { color: colors.text }]}>Points to Award:</Text>
                      <View style={styles.pointsInputRow}>
                        <TouchableOpacity
                          style={[styles.pointsButton, { backgroundColor: colors.card }]}
                          onPress={() => setPointsToAward(String(Math.max(0, parseInt(pointsToAward) - 5)))}
                        >
                          <Ionicons name="remove" size={20} color={colors.text} />
                        </TouchableOpacity>
                        <TextInput
                          style={[styles.pointsInput, { backgroundColor: colors.card, color: colors.text }]}
                          value={pointsToAward}
                          onChangeText={setPointsToAward}
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={[styles.pointsButton, { backgroundColor: colors.card }]}
                          onPress={() => setPointsToAward(String(parseInt(pointsToAward) + 5))}
                        >
                          <Ionicons name="add" size={20} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.maxPointsText, { color: colors.textSecondary }]}>
                        Max: {selectedSubmission.points} pts
                      </Text>
                    </View>

                    {/* Feedback */}
                    <View style={[styles.feedbackControl, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.feedbackLabel, { color: colors.text }]}>
                        Feedback (required for revision request):
                      </Text>
                      <TextInput
                        style={[styles.feedbackInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder="Great job! / Please try again because..."
                        placeholderTextColor={colors.textSecondary}
                        value={feedback}
                        onChangeText={setFeedback}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          {selectedSubmission?.submission.status === 'pending_review' && (
            <View style={[styles.modalFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.revisionButton, isReviewing && styles.buttonDisabled]}
                onPress={() => handleReview('needs_revision')}
                disabled={isReviewing}
              >
                {isReviewing ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={20} color="#EF4444" />
                    <Text style={styles.revisionButtonText}>Request Revision</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveButton, { backgroundColor: '#10B981' }, isReviewing && styles.buttonDisabled]}
                onPress={() => handleReview('approved')}
                disabled={isReviewing}
              >
                {isReviewing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Already reviewed message */}
          {selectedSubmission && selectedSubmission.submission.status !== 'pending_review' && (
            <View style={[styles.modalFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <View style={[
                styles.alreadyReviewedBadge,
                { backgroundColor: STATUS_COLORS[selectedSubmission.submission.status] + '20' }
              ]}>
                <Text style={[
                  styles.alreadyReviewedText,
                  { color: STATUS_COLORS[selectedSubmission.submission.status] }
                ]}>
                  {STATUS_LABELS[selectedSubmission.submission.status]}
                </Text>
                {selectedSubmission.submission.parentFeedback && (
                  <Text style={[styles.reviewedFeedback, { color: colors.textSecondary }]}>
                    Your feedback: "{selectedSubmission.submission.parentFeedback}"
                  </Text>
                )}
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  pendingBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start' },
  pendingBadgeText: { color: 'white', fontSize: 13, fontWeight: '600' },
  filterContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 14, fontWeight: '500' },
  listContainer: { flex: 1 },
  listContent: { padding: 16 },
  loadingState: { alignItems: 'center', paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  submissionCard: { padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  categoryText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  activityTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  childInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  childAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  childName: { fontSize: 14, fontWeight: '500' },
  submissionDate: { fontSize: 12, marginLeft: 4 },
  previewBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  previewText: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  questionsInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  questionsInfoText: { fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pointsText: { fontSize: 12, fontWeight: '700', color: '#856404' },
  reviewButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  reviewButtonText: { color: 'white', fontSize: 13, fontWeight: '600' },
  
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalContent: { flex: 1, padding: 16 },
  activityInfo: { padding: 16, borderRadius: 12, marginBottom: 16 },
  modalActivityTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  modalChildRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  modalChildName: { fontSize: 15, fontWeight: '500' },
  modalDate: { fontSize: 12 },
  answersSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  answerCard: { padding: 14, borderRadius: 12, marginBottom: 12 },
  questionLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  questionText: { fontSize: 15, marginBottom: 10, lineHeight: 21 },
  answerBox: { padding: 12, borderRadius: 8 },
  answerLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  answerText: { fontSize: 15, lineHeight: 21 },
  correctBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  responseSection: { marginBottom: 16 },
  responseBox: { padding: 16, borderRadius: 12 },
  responseText: { fontSize: 15, lineHeight: 22 },
  reviewControls: { marginBottom: 16 },
  pointsControl: { padding: 16, borderRadius: 12, marginBottom: 12 },
  pointsLabel: { fontSize: 14, fontWeight: '500', marginBottom: 10 },
  pointsInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsButton: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pointsInput: { flex: 1, height: 44, borderRadius: 8, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  maxPointsText: { fontSize: 12, marginTop: 8 },
  feedbackControl: { padding: 16, borderRadius: 12 },
  feedbackLabel: { fontSize: 14, fontWeight: '500', marginBottom: 10 },
  feedbackInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, minHeight: 80 },
  modalFooter: { padding: 16, borderTopWidth: 1, flexDirection: 'row', gap: 12 },
  revisionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#EF4444', gap: 6 },
  revisionButtonText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 6 },
  approveButtonText: { fontSize: 15, fontWeight: '600', color: 'white' },
  buttonDisabled: { opacity: 0.6 },
  alreadyReviewedBadge: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  alreadyReviewedText: { fontSize: 16, fontWeight: '600' },
  reviewedFeedback: { fontSize: 13, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
});
