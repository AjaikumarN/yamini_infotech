import 'package:flutter/material.dart';

/// Notifications Screen
/// 
/// Shared screen accessible by all roles
/// Displays system notifications and alerts
/// 
/// TODO: Implement notifications UI
/// TODO: Connect to notifications API
/// TODO: Add notification filtering/sorting
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications, size: 80),
            SizedBox(height: 24),
            Text(
              'Notifications',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              'TODO: Implement notifications screen',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
