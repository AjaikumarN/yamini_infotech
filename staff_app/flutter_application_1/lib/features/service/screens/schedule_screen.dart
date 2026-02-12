import 'package:flutter/material.dart';

/// Schedule Screen - Today's schedule for engineer
class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key});

  List<Map<String, dynamic>> _getMockSchedule() {
    return [
      {
        'id': 'JOB004',
        'customer_name': 'Enterprise Corp',
        'time': '09:00 AM',
        'status': 'completed',
        'issue': 'Installation - New equipment',
        'address': '500 Business Center, Chennai',
        'phone': '+91 65432 44444',
        'equipment': 'Industrial Motor 10HP',
        'priority': 'normal',
        'scheduled_date': '2026-01-11',
        'scheduled_time': '09:00 AM',
        'notes': 'Completed',
      },
      {
        'id': 'JOB001',
        'customer_name': 'Tech Solutions Ltd',
        'time': '10:00 AM',
        'status': 'in_progress',
        'issue': 'Motor overheating',
        'address': '100 Industrial Park, Mumbai',
        'phone': '+91 98765 11111',
        'equipment': 'Industrial Motor 5HP',
        'priority': 'high',
        'scheduled_date': '2026-01-11',
        'scheduled_time': '10:00 AM',
        'notes': 'Check bearings',
      },
      {
        'id': 'JOB002',
        'customer_name': 'Global Manufacturing',
        'time': '02:00 PM',
        'status': 'pending',
        'issue': 'Annual maintenance',
        'address': '250 Factory Road, Delhi',
        'phone': '+91 87654 22222',
        'equipment': 'Control Panel Unit A',
        'priority': 'normal',
        'scheduled_date': '2026-01-11',
        'scheduled_time': '02:00 PM',
        'notes': 'AMC visit',
      },
      {
        'id': 'JOB003',
        'customer_name': 'Quick Services',
        'time': '04:30 PM',
        'status': 'pending',
        'issue': 'Emergency breakdown',
        'address': '15 Market Street, Pune',
        'phone': '+91 76543 33333',
        'equipment': 'Automation System',
        'priority': 'high',
        'scheduled_date': '2026-01-11',
        'scheduled_time': '04:30 PM',
        'notes': 'Urgent',
      },
    ];
  }

  @override
  Widget build(BuildContext context) {
    final schedule = _getMockSchedule();
    
    return Scaffold(
      appBar: AppBar(title: const Text('Today\'s Schedule')),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: schedule.length,
        itemBuilder: (context, index) {
          final job = schedule[index];
          final status = job['status'] ?? 'pending';
          
          Color statusColor;
          IconData statusIcon;
          switch (status) {
            case 'completed':
              statusColor = Colors.green;
              statusIcon = Icons.check_circle;
              break;
            case 'in_progress':
              statusColor = Colors.blue;
              statusIcon = Icons.play_circle;
              break;
            default:
              statusColor = Colors.orange;
              statusIcon = Icons.schedule;
          }

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Opening job #${job['id']}...')),
                );
              },
              child: Row(
                children: [
                  Container(
                    width: 80,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        bottomLeft: Radius.circular(12),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(statusIcon, color: statusColor),
                        const SizedBox(height: 4),
                        Text(job['time'], style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: statusColor)),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(job['customer_name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(job['issue'], style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          if (job['priority'] == 'high')
                            const Padding(
                              padding: EdgeInsets.only(top: 4),
                              child: Row(
                                children: [
                                  Icon(Icons.priority_high, size: 14, color: Colors.red),
                                  Text('URGENT', style: TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: Colors.grey),
                  const SizedBox(width: 8),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
