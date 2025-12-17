// app/(dashboard)/child/activities.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal } from "react-native";
import { useActivity, Activity, Question, Submission } from "../../../context/ActivityContext";
import { useGamification } from "../../../context/GamificationContext";
import { useTheme } from "../../../context/ThemeContext";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { showAlert } from '@/utils/showAlert';

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

export default function ActivitiesScreen() {
  const { activities, getActivities, completeActivity, submitAnswer, getMySubmission, loading } = useActivity();
  const { refreshStats } = useGamification();
  const { colors, themeColors } = useTheme();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'submitted'>('all');
  const [completing, setCompleting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textResponse, setTextResponse] = useState('');
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);

  useEffect(() => {
    getActivities();
  }, [getActivities]);

  const handleComplete = async (activityId: string, activityTitle: string) => {
    Alert.alert(
      "Complete Activity",
      `Mark "${activityTitle}" as complete?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              setCompleting(activityId);
              await completeActivity(activityId);
              await refreshStats();
              showAlert("Success!", "Activity completed! Points earned! 🎉");
            } catch {
              showAlert("Error", "Failed to complete activity");
            } finally {
              setCompleting(null);
            }
          },
        },
      ]
    );
  };

  const openActivityModal = async (activity: Activity) => {
    setSelectedActivity(activity);
    setAnswers({});
    setTextResponse('');
    setMySubmission(null);
    
    // Fetch existing submission if any
    const result = await getMySubmission(activity._id);
    if (result.success && result.submission) {
      setMySubmission(result.submission);
      // Pre-fill answers if revising
      if (result.submission.status === 'needs_revision') {
        const existingAnswers: Record<string, string> = {};
        result.submission.answers?.forEach(ans => {
          existingAnswers[ans.questionId] = ans.answer;
        });
        setAnswers(existingAnswers);
        setTextResponse(result.submission.textResponse || '');
      } else if (result.submission.textResponse) {
        // Pre-fill text response for viewing
        setTextResponse(result.submission.textResponse);
      }
    }
    
    setModalVisible(true);
  };

  const handleSubmitAnswers = async () => {
    if (!selectedActivity) return;

    // Validate required fields
    const hasQuestions = selectedActivity.questions && selectedActivity.questions.length > 0;
    
    // Check if questions are answered
    if (hasQuestions) {
      const unanswered = selectedActivity.questions.filter(q => !answers[q._id]?.trim());
      if (unanswered.length > 0) {
        showAlert("Missing Answers", "Please answer all questions before submitting.");
        return;
      }
    }
    
    // Always require a text response for all activities
    if (!textResponse.trim()) {
      showAlert("Missing Response", "Please describe what you did for this activity before submitting.");
      return;
    }

    try {
      setSubmitting(selectedActivity._id);
      
      const submitData: { answers?: { questionId: string; answer: string }[]; textResponse: string } = {
        textResponse: textResponse.trim() // Always include text response
      };
      
      if (hasQuestions) {
        submitData.answers = Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer
        }));
      }

      const result = await submitAnswer(selectedActivity._id, submitData);
      
      if (result.success) {
        await refreshStats();
        await getActivities(); // Refresh activities list to show updated submission status
        showAlert("Submitted! 🎉", result.message || "Your response has been submitted for your parent to review!");
        setModalVisible(false);
      } else {
        showAlert("Error", result.message || "Failed to submit");
      }
    } catch {
      showAlert("Error", "Failed to submit response");
    } finally {
      setSubmitting(null);
    }
  };

  // Get submission status for an activity
  const getActivitySubmission = (activity: Activity): Submission | undefined => {
    return activity.submissions?.find(sub => sub.status);
  };

  const filteredActivities = activities.filter(activity => {
    const submission = getActivitySubmission(activity);
    if (filter === 'pending') return !activity.completed && !submission;
    if (filter === 'completed') return activity.completed;
    if (filter === 'submitted') return submission && !activity.completed;
    return true;
  });

  const pendingCount = activities.filter(a => !a.completed && !getActivitySubmission(a)).length;
  const completedCount = activities.filter(a => a.completed).length;
  const submittedCount = activities.filter(a => getActivitySubmission(a) && !a.completed).length;

  if (loading && activities.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Activities</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {pendingCount} pending • {submittedCount} submitted • {completedCount} completed
        </Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'completed', label: 'Done' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab, 
              { backgroundColor: colors.card },
              filter === f.key && { backgroundColor: themeColors.primary }
            ]}
            onPress={() => setFilter(f.key as 'all' | 'pending' | 'completed' | 'submitted')}
          >
            <Text style={[
              styles.filterText, 
              { color: colors.textSecondary },
              filter === f.key && styles.filterTextActive
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activities list */}
      <ScrollView style={styles.listContainer}>
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {filter === 'completed' ? '🎉' : filter === 'submitted' ? '📤' : '📝'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'completed' 
                ? "No completed activities yet. Start completing some!" 
                : filter === 'submitted'
                ? "No submitted activities waiting for review"
                : "No activities assigned yet"}
            </Text>
          </View>
        ) : (
          filteredActivities.map(activity => {
            const categoryColor = CATEGORY_COLORS[activity.category] || '#666';
            const categoryIcon = CATEGORY_ICONS[activity.category] || 'cube-outline';
            const isCompleting = completing === activity._id;
            const submission = getActivitySubmission(activity);
            const hasQuestions = activity.questions && activity.questions.length > 0;
            // All activities now require a response submission for parent review
            const requiresAnswer = true;

            return (
              <View 
                key={activity._id} 
                style={[
                  styles.activityCard,
                  { backgroundColor: colors.surface },
                  activity.completed && styles.activityCardCompleted
                ]}
              >
                {/* Header */}
                <View style={styles.activityHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                    <Ionicons name={categoryIcon as any} size={16} color={categoryColor} />
                    <Text style={[styles.categoryText, { color: categoryColor }]}>
                      {activity.category}
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>⭐ {activity.points}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>{activity.description}</Text>

                {/* Questions indicator */}
                {hasQuestions && (
                  <View style={[styles.questionsIndicator, { backgroundColor: themeColors.primary + '15' }]}>
                    <Ionicons name="help-circle-outline" size={16} color={themeColors.primary} />
                    <Text style={[styles.questionsText, { color: themeColors.primary }]}>
                      {activity.questions.length} question{activity.questions.length > 1 ? 's' : ''} to answer
                    </Text>
                  </View>
                )}

                {/* Meta info */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{activity.duration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{activity.difficulty}</Text>
                  </View>
                  {activity.dueDate && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {new Date(activity.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Submission status */}
                {submission && !activity.completed && (
                  <View style={[styles.submissionStatus, { backgroundColor: STATUS_COLORS[submission.status] + '15' }]}>
                    <Text style={[styles.submissionStatusText, { color: STATUS_COLORS[submission.status] }]}>
                      {STATUS_LABELS[submission.status]}
                    </Text>
                    {submission.parentFeedback && (
                      <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>
                        "{submission.parentFeedback}"
                      </Text>
                    )}
                  </View>
                )}

                {/* Action buttons */}
                {!activity.completed && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.answerButton, 
                        { backgroundColor: submission?.status === 'needs_revision' ? '#EF4444' : themeColors.primary }
                      ]}
                      onPress={() => openActivityModal(activity)}
                    >
                      <Ionicons 
                        name={submission?.status === 'needs_revision' ? 'create-outline' : hasQuestions ? 'help-circle-outline' : 'document-text-outline'} 
                        size={20} 
                        color="white" 
                      />
                      <Text style={styles.answerButtonText}>
                        {submission?.status === 'needs_revision' 
                          ? 'Revise & Resubmit' 
                          : submission?.status === 'pending_review'
                          ? 'View Submission'
                          : hasQuestions 
                          ? 'Answer Questions'
                          : 'Submit Response'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activity.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.completedText}>Completed</Text>
                    {activity.completedAt && (
                      <Text style={styles.completedDate}>
                        on {new Date(activity.completedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Answer Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
              {selectedActivity?.title}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Activity Description */}
            <View style={[styles.descriptionBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>Instructions:</Text>
              <Text style={[styles.descriptionText, { color: colors.text }]}>
                {selectedActivity?.description}
              </Text>
            </View>

            {/* Show existing submission status */}
            {mySubmission && (
              <View style={[
                styles.existingSubmission, 
                { backgroundColor: STATUS_COLORS[mySubmission.status] + '15' }
              ]}>
                <Text style={[styles.existingSubmissionTitle, { color: STATUS_COLORS[mySubmission.status] }]}>
                  {STATUS_LABELS[mySubmission.status]}
                </Text>
                {mySubmission.parentFeedback && (
                  <View style={styles.feedbackBox}>
                    <Text style={[styles.feedbackLabel, { color: colors.textSecondary }]}>Parent's Feedback:</Text>
                    <Text style={[styles.feedbackContent, { color: colors.text }]}>
                      "{mySubmission.parentFeedback}"
                    </Text>
                  </View>
                )}
                {mySubmission.status === 'approved' && (
                  <Text style={styles.pointsAwardedText}>
                    🎉 You earned {mySubmission.pointsAwarded} points!
                  </Text>
                )}
              </View>
            )}

            {/* Questions */}
            {selectedActivity?.questions && selectedActivity.questions.length > 0 && (
              <View style={styles.questionsContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  📝 Questions ({selectedActivity.questions.length})
                </Text>
                {selectedActivity.questions.map((question, index) => (
                  <View key={question._id} style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.questionNumber, { color: themeColors.primary }]}>
                      Question {index + 1}
                    </Text>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {question.questionText}
                    </Text>
                    
                    {question.questionType === 'multiple_choice' && question.options ? (
                      <View style={styles.optionsContainer}>
                        {question.options.map((option, optIndex) => (
                          <TouchableOpacity
                            key={optIndex}
                            style={[
                              styles.optionButton,
                              { borderColor: colors.border },
                              answers[question._id] === option && { 
                                backgroundColor: themeColors.primary + '20',
                                borderColor: themeColors.primary 
                              }
                            ]}
                            onPress={() => setAnswers({ ...answers, [question._id]: option })}
                            disabled={mySubmission?.status === 'pending_review' || mySubmission?.status === 'approved'}
                          >
                            <View style={[
                              styles.optionRadio,
                              { borderColor: colors.border },
                              answers[question._id] === option && { 
                                backgroundColor: themeColors.primary,
                                borderColor: themeColors.primary 
                              }
                            ]} />
                            <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : question.questionType === 'true_false' ? (
                      <View style={styles.trueFalseContainer}>
                        {['True', 'False'].map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.trueFalseButton,
                              { borderColor: colors.border },
                              answers[question._id] === option && { 
                                backgroundColor: themeColors.primary,
                                borderColor: themeColors.primary 
                              }
                            ]}
                            onPress={() => setAnswers({ ...answers, [question._id]: option })}
                            disabled={mySubmission?.status === 'pending_review' || mySubmission?.status === 'approved'}
                          >
                            <Text style={[
                              styles.trueFalseText,
                              { color: colors.text },
                              answers[question._id] === option && { color: 'white' }
                            ]}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <TextInput
                        style={[
                          styles.answerInput,
                          { 
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border 
                          }
                        ]}
                        placeholder="Type your answer here..."
                        placeholderTextColor={colors.textSecondary}
                        value={answers[question._id] || ''}
                        onChangeText={(text) => setAnswers({ ...answers, [question._id]: text })}
                        multiline
                        editable={mySubmission?.status !== 'pending_review' && mySubmission?.status !== 'approved'}
                      />
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Text Response for activities without specific questions */}
            {/* Always show text response section for all activities */}
            <View style={styles.responseContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ✍️ Your Response
              </Text>
              <Text style={[styles.responseHint, { color: colors.textSecondary }]}>
                Tell your parent what you did, what you learned, or share your work!
              </Text>
              <TextInput
                style={[
                  styles.responseInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border 
                  }
                ]}
                placeholder="Describe what you did for this activity..."
                placeholderTextColor={colors.textSecondary}
                value={textResponse}
                onChangeText={setTextResponse}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={mySubmission?.status !== 'pending_review' && mySubmission?.status !== 'approved'}
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          {(!mySubmission || mySubmission.status === 'needs_revision') && (
            <View style={[styles.modalFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.submitButton, 
                  { backgroundColor: themeColors.primary },
                  submitting && styles.submitButtonLoading
                ]}
                onPress={handleSubmitAnswers}
                disabled={submitting === selectedActivity?._id}
              >
                {submitting === selectedActivity?._id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color="white" />
                    <Text style={styles.submitButtonText}>
                      {mySubmission?.status === 'needs_revision' ? 'Resubmit Response' : 'Submit for Review'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  filterContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterText: { fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: 'white' },
  listContainer: { flex: 1, padding: 16, paddingTop: 0 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, textAlign: 'center' },
  activityCard: { padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  activityCardCompleted: { opacity: 0.7 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 6 },
  categoryText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  pointsBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  pointsText: { fontSize: 12, fontWeight: '700', color: '#856404' },
  activityTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  activityDescription: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  questionsIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, marginBottom: 12 },
  questionsText: { fontSize: 13, fontWeight: '500' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, textTransform: 'capitalize' },
  submissionStatus: { padding: 12, borderRadius: 8, marginBottom: 12 },
  submissionStatusText: { fontSize: 14, fontWeight: '600' },
  feedbackText: { fontSize: 13, fontStyle: 'italic', marginTop: 6 },
  actionButtons: { marginTop: 4 },
  answerButton: { flexDirection: 'row', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  answerButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  completeButton: { flexDirection: 'row', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  completeButtonLoading: { backgroundColor: '#9CA3AF' },
  completeButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D1FAE5', padding: 12, borderRadius: 8 },
  completedText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  completedDate: { fontSize: 12, color: '#059669', marginLeft: 'auto' },
  
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 16 },
  modalContent: { flex: 1, padding: 16 },
  descriptionBox: { padding: 16, borderRadius: 12, marginBottom: 16 },
  descriptionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  descriptionText: { fontSize: 15, lineHeight: 22 },
  existingSubmission: { padding: 16, borderRadius: 12, marginBottom: 16 },
  existingSubmissionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  feedbackBox: { marginTop: 8 },
  feedbackLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  feedbackContent: { fontSize: 14, fontStyle: 'italic' },
  pointsAwardedText: { fontSize: 16, fontWeight: '600', color: '#10B981', marginTop: 8 },
  questionsContainer: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  questionCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  questionNumber: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  questionText: { fontSize: 16, marginBottom: 12, lineHeight: 22 },
  answerInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  optionsContainer: { gap: 8 },
  optionButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 12 },
  optionRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  optionText: { fontSize: 15, flex: 1 },
  trueFalseContainer: { flexDirection: 'row', gap: 12 },
  trueFalseButton: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  trueFalseText: { fontSize: 16, fontWeight: '600' },
  responseContainer: { marginBottom: 16 },
  responseHint: { fontSize: 13, marginBottom: 10, lineHeight: 18 },
  responseInput: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 15, minHeight: 150 },
  modalFooter: { padding: 16, borderTopWidth: 1 },
  submitButton: { flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitButtonLoading: { opacity: 0.7 },
  submitButtonText: { color: 'white', fontSize: 17, fontWeight: '600' },
});
