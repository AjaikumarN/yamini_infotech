import 'package:flutter/material.dart';

/// Jobs Screen - List of assigned jobs for engineer
class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  bool isLoading = false;
  List<Map<String, dynamic>> jobs = [];

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    setState(() => isLoading = true);
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      jobs = _getMockJobs();
      isLoading = false;
    });
  }

  List<Map<String, dynamic>> _getMockJobs() {
    return [
      {
        'id': 'JOB001',
        'customer_name': 'Tech Solutions Ltd',
        'phone': '+91 98765 11111',
        'address': '100 Industrial Park, Mumbai',
        'issue': 'Motor overheating - needs inspection',
        'status': 'in_progress',
        'priority': 'high',
        'scheduled_date': '2026-01-11',
        'scheduled_time': '10:00 AM',
        'equipment': 'Industrial Motor 5HP',
        'notes': 'Customer reported unusual noise. Check bearings.',
      },
      {
        'id': 'JOB002',
        'customer_name': 'Global Manufacturing',
        'phone': '+91 87654 22222',
        'address': '250 Factory Road, Delhi',
        'issue': 'Annual maintenance - Control Panel',
        'status': 'pending',
        'priority': 'normal',
        'scheduled_date': '2026-01-11',
        'scheduled_time': '02:00 PM',
        'equipment': 'Control Panel Unit A',
        'notes': 'Routine AMC visit. Check all connections.',
      },
      {
        'id': 'JOB003',
        'customer_name': 'Quick Services',
        'phone': '+91 76543 33333',
        'address': '15 Market Street, Pune',
        'issue': 'Emergency - Machine breakdown',
        'status': 'pending',
        'priority': 'high',
        'scheduled_date': '2026-01-11',
        'scheduled_time': '04:30 PM',
        'equipment': 'Automation System',
        'notes': 'Production line stopped. Urgent fix needed.',
      },
      {
        'id': 'JOB004',
        'customer_name': 'Enterprise Corp',
        'phone': '+91 65432 44444',
        'address': '500 Business Center, Chennai',
        'issue': 'Installation - New equipment',
        'status': 'completed',
        'priority': 'normal',
        'scheduled_date': '2026-01-11',
        'scheduled_time': '09:00 AM',
        'equipment': 'Industrial Motor 10HP',
        'notes': 'Installation completed successfully.',
      },
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Assigned Jobs'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadJobs),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : jobs.isEmpty
              ? const Center(child: Text('No jobs assigned'))
              : RefreshIndicator(
                  onRefresh: _loadJobs,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: jobs.length,
                    itemBuilder: (context, index) => _buildJobCard(jobs[index]),
                  ),
                ),
    );
  }

  Widget _buildJobCard(Map<String, dynamic> job) {
    final status = job['status'] ?? 'pending';
    final priority = job['priority'] ?? 'normal';
    
    Color statusColor;
    switch (status) {
      case 'completed':
        statusColor = Colors.green;
        break;
      case 'in_progress':
        statusColor = Colors.blue;
        break;
      default:
        statusColor = Colors.orange;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: statusColor.withValues(alpha: 0.2),
          child: Icon(Icons.build, color: statusColor),
        ),
        title: Row(
          children: [
            Text('#${job['id']}  ', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            Expanded(
              child: Text(
                job['customer_name'] ?? '',
                style: const TextStyle(fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(job['issue'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.circle, size: 8, color: statusColor),
                const SizedBox(width: 6),
                Text(status.toUpperCase().replaceAll('_', ' '), 
                  style: TextStyle(color: statusColor, fontWeight: FontWeight.w600, fontSize: 12)),
                if (priority == 'high') ...[
                  const SizedBox(width: 12),
                  const Icon(Icons.priority_high, size: 16, color: Colors.red),
                  const Text('URGENT', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ],
            ),
            const SizedBox(height: 4),
            Text('${job['scheduled_time']}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Opening job #${job['id']}...')),
          );
        },
      ),
    );
  }
}
