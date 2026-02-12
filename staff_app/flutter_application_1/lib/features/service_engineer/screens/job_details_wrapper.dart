import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/service_engineer_theme.dart';
import '../models/service_job.dart';
import 'job_details_screen.dart';

/// Wrapper screen that fetches job by ID and displays JobDetailsScreen
/// Used for deep linking / route-based navigation
class JobDetailsWrapper extends StatefulWidget {
  final int jobId;

  const JobDetailsWrapper({super.key, required this.jobId});

  @override
  State<JobDetailsWrapper> createState() => _JobDetailsWrapperState();
}

class _JobDetailsWrapperState extends State<JobDetailsWrapper> {
  bool isLoading = true;
  String? error;
  ServiceJob? job;

  @override
  void initState() {
    super.initState();
    _loadJob();
  }

  Future<void> _loadJob() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await ApiService.instance.get('/api/service-requests/${widget.jobId}');
      
      if (response.success && response.data != null) {
        setState(() {
          job = ServiceJob.fromJson(response.data);
          isLoading = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load job';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Error: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        backgroundColor: ServiceEngineerTheme.background,
        appBar: AppBar(
          title: const Text('Job Details'),
          backgroundColor: ServiceEngineerTheme.primary,
          foregroundColor: Colors.white,
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (error != null || job == null) {
      return Scaffold(
        backgroundColor: ServiceEngineerTheme.background,
        appBar: AppBar(
          title: const Text('Job Details'),
          backgroundColor: ServiceEngineerTheme.primary,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                error ?? 'Job not found',
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadJob,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return JobDetailsScreen(job: job!);
  }
}
