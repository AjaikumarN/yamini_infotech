import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/performance_widgets.dart';

/// Daily Report Screen - Salesman End-of-Day Report
///
/// RULES (LOCKED):
/// 1. Attendance MUST be marked first
/// 2. ONE report per day (immutable)
/// 3. Metrics are auto-derived from backend
/// 4. Manual fields: achievements, challenges, tomorrow_plan
/// 5. Voice input converts to text (no audio storage)
class DailyReportScreen extends StatefulWidget {
  const DailyReportScreen({super.key});

  @override
  State<DailyReportScreen> createState() => _DailyReportScreenState();
}

class _DailyReportScreenState extends State<DailyReportScreen> {
  // State
  bool isLoading = true;
  bool isSubmitting = false;
  String? error;
  Map<String, dynamic>? prefillData;
  
  // Form controllers
  final _achievementsController = TextEditingController();
  final _challengesController = TextEditingController();
  final _tomorrowPlanController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  // Speech recognition
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _speechAvailable = false;
  String? _activeVoiceField;

  @override
  void initState() {
    super.initState();
    _initSpeech();
    _fetchPrefillData();
  }
  
  @override
  void dispose() {
    _achievementsController.dispose();
    _challengesController.dispose();
    _tomorrowPlanController.dispose();
    super.dispose();
  }
  
  Future<void> _initSpeech() async {
    try {
      _speechAvailable = await _speech.initialize();
    } catch (e) {
      _speechAvailable = false;
    }
  }

  Future<void> _fetchPrefillData() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await ApiService.instance.get(
        '${ApiConstants.SALESMAN_DAILY_REPORT}/today',
      );

      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        setState(() {
          prefillData = data;
          
          // If already submitted, prefill the text fields (read-only)
          if (data['already_submitted'] == true) {
            _achievementsController.text = data['achievements'] ?? '';
            _challengesController.text = data['challenges'] ?? '';
            _tomorrowPlanController.text = data['tomorrow_plan'] ?? '';
          }
          
          isLoading = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load report data';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Connection error: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => isSubmitting = true);

    try {
      final response = await ApiService.instance.post(
        ApiConstants.SALESMAN_DAILY_REPORT,
        body: {
          'achievements': _achievementsController.text.trim(),
          'challenges': _challengesController.text.trim(),
          'tomorrow_plan': _tomorrowPlanController.text.trim(),
        },
      );

      if (response.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Daily report submitted successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          // Refresh to show submitted state
          _fetchPrefillData();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response.message ?? 'Failed to submit report'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => isSubmitting = false);
      }
    }
  }

  void _startListening(String field, TextEditingController controller) async {
    if (!_speechAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Speech recognition not available')),
      );
      return;
    }
    
    setState(() => _activeVoiceField = field);
    
    await _speech.listen(
      onResult: (result) {
        setState(() {
          controller.text = result.recognizedWords;
        });
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
    );
  }
  
  void _stopListening() {
    _speech.stop();
    setState(() => _activeVoiceField = null);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Daily Report'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: isLoading ? null : _fetchPrefillData,
          ),
        ],
      ),
      body: isLoading
          ? const ShimmerDashboard(cardCount: 3)
          : error != null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(
              'Error Loading Report',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchPrefillData,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    final attendanceMarked = prefillData?['attendance_marked'] ?? false;
    final alreadySubmitted = prefillData?['already_submitted'] ?? false;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Card
            _buildDateCard(),
            const SizedBox(height: 16),
            
            // Attendance Gate
            if (!attendanceMarked) ...[
              _buildAttendanceWarning(),
            ] else ...[
              // Auto-derived Metrics (READ-ONLY)
              _buildMetricsSection(),
              const SizedBox(height: 24),
              
              if (alreadySubmitted) ...[
                // Already submitted - show read-only
                _buildSubmittedBanner(),
                const SizedBox(height: 16),
                _buildReadOnlyFields(),
              ] else ...[
                // Form for submission
                _buildFormSection(),
                const SizedBox(height: 24),
                _buildSubmitButton(),
              ],
            ],
            
            const SizedBox(height: 16),
            _buildWarningFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildDateCard() {
    final today = DateTime.now();
    final dateStr = '${today.day}/${today.month}/${today.year}';
    
    return Card(
      color: Colors.teal.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.calendar_today, color: Colors.teal.shade700),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Today\'s Report',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.teal.shade700,
                  ),
                ),
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.teal.shade900,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceWarning() {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(Icons.warning_amber, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 12),
            Text(
              'Attendance Required',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.red.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You must mark attendance before submitting your daily report.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red.shade700),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade400,
                foregroundColor: Colors.white,
              ),
              child: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Today\'s Activity (Auto-calculated)',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade800,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                'Calls Made',
                prefillData?['calls_made']?.toString() ?? '0',
                Icons.phone,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildMetricCard(
                'Meetings',
                prefillData?['meetings_done']?.toString() ?? '0',
                Icons.groups,
                Colors.green,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildMetricCard(
                'Orders',
                prefillData?['orders_closed']?.toString() ?? '0',
                Icons.shopping_cart,
                Colors.orange,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmittedBanner() {
    final submissionTime = prefillData?['submission_time'];
    String timeStr = '';
    if (submissionTime != null) {
      try {
        final dt = DateTime.parse(submissionTime);
        timeStr = ' at ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (_) {}
    }
    
    return Card(
      color: Colors.green.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green.shade700, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Report Submitted',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.green.shade800,
                    ),
                  ),
                  Text(
                    'Submitted$timeStr. Reports cannot be edited.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.green.shade700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReadOnlyFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildReadOnlyField(
          'Today\'s Achievements',
          prefillData?['achievements'] ?? '',
          Icons.emoji_events,
        ),
        const SizedBox(height: 16),
        _buildReadOnlyField(
          'Challenges Faced',
          prefillData?['challenges'] ?? '',
          Icons.warning_amber,
        ),
        const SizedBox(height: 16),
        _buildReadOnlyField(
          'Tomorrow\'s Plan',
          prefillData?['tomorrow_plan'] ?? '',
          Icons.calendar_today,
        ),
      ],
    );
  }

  Widget _buildReadOnlyField(String label, String value, IconData icon) {
    return Card(
      color: Colors.grey.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: Colors.grey.shade600),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value.isNotEmpty ? value : 'No data',
              style: TextStyle(
                fontSize: 14,
                color: value.isNotEmpty ? Colors.grey.shade800 : Colors.grey.shade400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Your Daily Summary',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade800,
          ),
        ),
        const SizedBox(height: 12),
        
        // Achievements
        _buildTextFieldWithVoice(
          controller: _achievementsController,
          label: 'Today\'s Achievements 🏆',
          hint: 'What did you accomplish today?',
          icon: Icons.emoji_events,
          fieldId: 'achievements',
        ),
        const SizedBox(height: 16),
        
        // Challenges
        _buildTextFieldWithVoice(
          controller: _challengesController,
          label: 'Challenges Faced ⚠️',
          hint: 'Any issues, objections, or problems?',
          icon: Icons.warning_amber,
          fieldId: 'challenges',
        ),
        const SizedBox(height: 16),
        
        // Tomorrow's Plan
        _buildTextFieldWithVoice(
          controller: _tomorrowPlanController,
          label: 'Tomorrow\'s Plan 📅',
          hint: 'What do you plan to do tomorrow?',
          icon: Icons.calendar_today,
          fieldId: 'tomorrow_plan',
        ),
      ],
    );
  }

  Widget _buildTextFieldWithVoice({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    required String fieldId,
  }) {
    final isListening = _activeVoiceField == fieldId;
    
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: Colors.grey.shade600),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade700,
                    ),
                  ),
                ),
                if (_speechAvailable)
                  GestureDetector(
                    onTap: () {
                      if (isListening) {
                        _stopListening();
                      } else {
                        _startListening(fieldId, controller);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isListening ? Colors.red.shade100 : Colors.blue.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isListening ? Icons.stop : Icons.mic,
                        size: 20,
                        color: isListening ? Colors.red : Colors.blue,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: controller,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: hint,
                border: const OutlineInputBorder(),
                contentPadding: const EdgeInsets.all(12),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'This field is required';
                }
                return null;
              },
            ),
            if (isListening)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Listening...',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red.shade700,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isSubmitting ? null : _submitReport,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.teal,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: isSubmitting
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.send),
                  SizedBox(width: 8),
                  Text(
                    'Submit Daily Report',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildWarningFooter() {
    return Card(
      color: Colors.amber.shade50,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(Icons.info, color: Colors.amber.shade700, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'You can submit only one daily report per day. Reports cannot be edited after submission.',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.amber.shade900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
