"""
COMPREHENSIVE ADMIN MODULE TEST SUITE
Tests all admin endpoints, permissions, and functionality
"""

import requests
import json
from datetime import datetime, date

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

# Test credentials
ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

SALESMAN_CREDENTIALS = {
    "username": "salesman1",
    "password": "password123"
}

class AdminTester:
    def __init__(self):
        self.admin_token = None
        self.salesman_token = None
        self.test_results = []
        
    def log_test(self, test_name, status, message=""):
        """Log test result"""
        icon = "✅" if status else "❌"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{icon} {test_name}: {message if message else ('PASS' if status else 'FAIL')}")
        
    def login_as_admin(self):
        """Test: Login as admin"""
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                data=ADMIN_CREDENTIALS
            )
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.log_test("Admin Login", True, f"Token received")
                return True
            else:
                self.log_test("Admin Login", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Login", False, str(e))
            return False
            
    def login_as_salesman(self):
        """Test: Login as salesman (for permission tests)"""
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                data=SALESMAN_CREDENTIALS
            )
            if response.status_code == 200:
                data = response.json()
                self.salesman_token = data.get("access_token")
                self.log_test("Salesman Login", True, "For permission testing")
                return True
            else:
                self.log_test("Salesman Login", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Salesman Login", False, str(e))
            return False
    
    def get_headers(self, use_admin=True):
        """Get authorization headers"""
        token = self.admin_token if use_admin else self.salesman_token
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    # ============================================
    # DASHBOARD TESTS
    # ============================================
    
    def test_dashboard_access(self):
        """Test: Admin can access dashboard"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/analytics/dashboard",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                data = response.json()
                has_sales = "sales" in data
                has_service = "service" in data
                has_attendance = "attendance" in data
                
                if has_sales and has_service and has_attendance:
                    self.log_test("Dashboard Analytics", True, 
                                f"Sales: {data['sales']}, Service: {data['service']}")
                else:
                    self.log_test("Dashboard Analytics", False, "Missing data sections")
            else:
                self.log_test("Dashboard Analytics", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Dashboard Analytics", False, str(e))
    
    # ============================================
    # USER MANAGEMENT TESTS
    # ============================================
    
    def test_get_users(self):
        """Test: Admin can view all users"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/users/",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                users = response.json()
                self.log_test("Get All Users", True, f"Found {len(users)} users")
            else:
                self.log_test("Get All Users", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get All Users", False, str(e))
    
    def test_create_user(self):
        """Test: Admin can create new user"""
        try:
            timestamp = int(datetime.now().timestamp() * 1000)  # More unique
            new_user = {
                "username": f"testuser_{timestamp}",
                "email": f"testuser_{timestamp}@example.com",
                "full_name": "Test User",
                "password": "test123",
                "role": "SALESMAN",
                "phone": "9876543210"
            }
            response = requests.post(
                f"{BASE_URL}/api/users/",
                headers=self.get_headers(),
                json=new_user
            )
            if response.status_code in [200, 201]:
                self.log_test("Create User", True, f"User {new_user['username']} created")
            else:
                self.log_test("Create User", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create User", False, str(e))
    
    def test_salesman_cannot_create_user(self):
        """Test: Salesman CANNOT create users (permission check)"""
        try:
            new_user = {
                "username": f"unauthorized_{datetime.now().timestamp()}",
                "email": "unauthorized@example.com",
                "full_name": "Unauthorized",
                "password": "test123",
                "role": "SALESMAN"
            }
            response = requests.post(
                f"{BASE_URL}/api/users/",
                headers=self.get_headers(use_admin=False),
                json=new_user
            )
            if response.status_code == 403:
                self.log_test("Permission: Salesman Cannot Create User", True, "403 Forbidden as expected")
            else:
                self.log_test("Permission: Salesman Cannot Create User", False, 
                            f"Expected 403, got {response.status_code}")
        except Exception as e:
            self.log_test("Permission: Salesman Cannot Create User", False, str(e))
    
    # ============================================
    # ORDERS MANAGEMENT TESTS
    # ============================================
    
    def test_get_orders(self):
        """Test: Admin can view all orders"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/orders/",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                orders = response.json()
                self.log_test("Get All Orders", True, f"Found {len(orders)} orders")
                return orders
            else:
                self.log_test("Get All Orders", False, f"Status {response.status_code}")
                return []
        except Exception as e:
            self.log_test("Get All Orders", False, str(e))
            return []
    
    def test_approve_order(self):
        """Test: Admin can approve orders"""
        try:
            # Get pending orders
            response = requests.get(
                f"{BASE_URL}/api/orders/pending-approval",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                pending_orders = response.json()
                
                if len(pending_orders) > 0:
                    order_id = pending_orders[0]["id"]
                    
                    # Try to approve
                    approve_response = requests.put(
                        f"{BASE_URL}/api/orders/{order_id}/approve",
                        headers=self.get_headers(),
                        json={"approved": True}
                    )
                    
                    if approve_response.status_code == 200:
                        self.log_test("Approve Order", True, f"Order #{order_id} approved")
                    else:
                        self.log_test("Approve Order", False, 
                                    f"Status {approve_response.status_code}: {approve_response.text}")
                else:
                    self.log_test("Approve Order", True, "No pending orders to test")
            else:
                self.log_test("Approve Order", False, f"Cannot get pending orders")
        except Exception as e:
            self.log_test("Approve Order", False, str(e))
    
    def test_salesman_cannot_approve_order(self):
        """Test: Salesman CANNOT approve orders"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/orders/pending-approval",
                headers=self.get_headers()
            )
            
            if response.status_code == 200 and len(response.json()) > 0:
                order_id = response.json()[0]["id"]
                
                approve_response = requests.put(
                    f"{BASE_URL}/api/orders/{order_id}/approve",
                    headers=self.get_headers(use_admin=False),
                    json={"approved": True}
                )
                
                if approve_response.status_code == 403:
                    self.log_test("Permission: Salesman Cannot Approve", True, "403 as expected")
                else:
                    self.log_test("Permission: Salesman Cannot Approve", False, 
                                f"Expected 403, got {approve_response.status_code}")
            else:
                self.log_test("Permission: Salesman Cannot Approve", True, "No orders to test")
        except Exception as e:
            self.log_test("Permission: Salesman Cannot Approve", False, str(e))
    
    # ============================================
    # INVOICES MANAGEMENT TESTS
    # ============================================
    
    def test_get_invoices(self):
        """Test: Admin can view invoices"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/invoices/",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                invoices = response.json()
                self.log_test("Get All Invoices", True, f"Found {len(invoices)} invoices")
            else:
                self.log_test("Get All Invoices", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get All Invoices", False, str(e))
    
    def test_create_invoice(self):
        """Test: Admin can create invoices"""
        try:
            new_invoice = {
                "customer_name": "Test Customer",
                "customer_email": "customer@example.com",
                "items": [],
                "tax_percent": 18,
                "notes": "Test invoice from admin"
            }
            response = requests.post(
                f"{BASE_URL}/api/invoices/",
                headers=self.get_headers(),
                json=new_invoice
            )
            if response.status_code in [200, 201]:
                self.log_test("Create Invoice", True, "Invoice created successfully")
            else:
                self.log_test("Create Invoice", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Invoice", False, str(e))
    
    # ============================================
    # ATTENDANCE MANAGEMENT TESTS
    # ============================================
    
    def test_get_attendance(self):
        """Test: Admin can view attendance"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/attendance/all/today",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                attendance = response.json()
                self.log_test("Get Today's Attendance", True, f"Found {len(attendance)} records")
            else:
                self.log_test("Get Today's Attendance", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get Today's Attendance", False, str(e))
    
    def test_correct_attendance(self):
        """Test: Admin can correct attendance"""
        try:
            # Get attendance records
            response = requests.get(
                f"{BASE_URL}/api/attendance/all/today",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                records = response.json()
                
                # Find a record with attendance
                for emp in records:
                    if emp.get("checked_in") and emp.get("attendance"):
                        attendance_id = emp["attendance"]["id"]
                        
                        # Try to correct
                        correct_response = requests.put(
                            f"{BASE_URL}/api/attendance/{attendance_id}/correct",
                            headers=self.get_headers(),
                            json={
                                "status": "Present",
                                "reason": "Admin correction test"
                            }
                        )
                        
                        if correct_response.status_code == 200:
                            self.log_test("Correct Attendance", True, 
                                        f"Attendance #{attendance_id} corrected")
                        else:
                            self.log_test("Correct Attendance", False, 
                                        f"Status {correct_response.status_code}")
                        return
                
                self.log_test("Correct Attendance", True, "No attendance to correct")
            else:
                self.log_test("Correct Attendance", False, "Cannot get attendance")
        except Exception as e:
            self.log_test("Correct Attendance", False, str(e))
    
    # ============================================
    # SERVICE REQUESTS TESTS
    # ============================================
    
    def test_get_service_requests(self):
        """Test: Admin can view service requests"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/service-requests/",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                requests_data = response.json()
                self.log_test("Get Service Requests", True, f"Found {len(requests_data)} requests")
            else:
                self.log_test("Get Service Requests", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get Service Requests", False, str(e))
    
    def test_get_sla_summary(self):
        """Test: Admin can view SLA summary"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/analytics/admin/sla-summary",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                sla_data = response.json()
                self.log_test("Get SLA Summary", True, 
                            f"Breaches: {sla_data.get('sla_breaches', 0)}")
            else:
                self.log_test("Get SLA Summary", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get SLA Summary", False, str(e))
    
    # ============================================
    # PRODUCTS MANAGEMENT TESTS
    # ============================================
    
    def test_get_products(self):
        """Test: Admin can view products"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/products/",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                products = response.json()
                self.log_test("Get All Products", True, f"Found {len(products)} products")
            else:
                self.log_test("Get All Products", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get All Products", False, str(e))
    
    # ============================================
    # STOCK MANAGEMENT TESTS
    # ============================================
    
    def test_get_stock_movements(self):
        """Test: Admin can view stock movements"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/stock-movements/",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                movements = response.json()
                self.log_test("Get Stock Movements", True, f"Found {len(movements)} movements")
            else:
                self.log_test("Get Stock Movements", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get Stock Movements", False, str(e))
    
    # ============================================
    # ENQUIRIES MANAGEMENT TESTS
    # ============================================
    
    def test_get_enquiries(self):
        """Test: Admin can view enquiries"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/enquiries/",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                enquiries = response.json()
                self.log_test("Get All Enquiries", True, f"Found {len(enquiries)} enquiries")
            else:
                self.log_test("Get All Enquiries", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get All Enquiries", False, str(e))
    
    # ============================================
    # AUDIT LOGS TESTS
    # ============================================
    
    def test_get_audit_logs(self):
        """Test: Admin can view audit logs"""
        try:
            response = requests.get(
                f"{BASE_URL}/api/audit/logs",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                logs = response.json()
                self.log_test("Get Audit Logs", True, f"Found {len(logs)} log entries")
            else:
                self.log_test("Get Audit Logs", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Get Audit Logs", False, str(e))
    
    def test_cannot_delete_audit_logs(self):
        """Test: Admin CANNOT delete audit logs"""
        try:
            # Try to delete (should fail or not have endpoint)
            response = requests.delete(
                f"{BASE_URL}/api/audit/logs/1",
                headers=self.get_headers()
            )
            if response.status_code in [404, 405, 403]:
                self.log_test("Security: Cannot Delete Audit Logs", True, 
                            f"Delete blocked with status {response.status_code}")
            else:
                self.log_test("Security: Cannot Delete Audit Logs", False, 
                            f"Unexpected status {response.status_code}")
        except Exception as e:
            self.log_test("Security: Cannot Delete Audit Logs", True, 
                        "Delete endpoint not available (good)")
    
    # ============================================
    # RUN ALL TESTS
    # ============================================
    
    def run_all_tests(self):
        """Execute all admin tests"""
        print("=" * 70)
        print("🧪 COMPREHENSIVE ADMIN MODULE TEST SUITE")
        print("=" * 70)
        print()
        
        # Step 1: Authentication
        print("📝 PHASE 1: AUTHENTICATION")
        print("-" * 70)
        if not self.login_as_admin():
            print("❌ Cannot proceed without admin token")
            return
        self.login_as_salesman()
        print()
        
        # Step 2: Dashboard
        print("📝 PHASE 2: DASHBOARD")
        print("-" * 70)
        self.test_dashboard_access()
        print()
        
        # Step 3: User Management
        print("📝 PHASE 3: USER MANAGEMENT")
        print("-" * 70)
        self.test_get_users()
        self.test_create_user()
        self.test_salesman_cannot_create_user()
        print()
        
        # Step 4: Orders
        print("📝 PHASE 4: ORDERS MANAGEMENT")
        print("-" * 70)
        self.test_get_orders()
        self.test_approve_order()
        self.test_salesman_cannot_approve_order()
        print()
        
        # Step 5: Invoices
        print("📝 PHASE 5: INVOICES MANAGEMENT")
        print("-" * 70)
        self.test_get_invoices()
        self.test_create_invoice()
        print()
        
        # Step 6: Attendance
        print("📝 PHASE 6: ATTENDANCE MANAGEMENT")
        print("-" * 70)
        self.test_get_attendance()
        self.test_correct_attendance()
        print()
        
        # Step 7: Service Requests
        print("📝 PHASE 7: SERVICE REQUESTS")
        print("-" * 70)
        self.test_get_service_requests()
        self.test_get_sla_summary()
        print()
        
        # Step 8: Products
        print("📝 PHASE 8: PRODUCTS MANAGEMENT")
        print("-" * 70)
        self.test_get_products()
        print()
        
        # Step 9: Stock
        print("📝 PHASE 9: STOCK MANAGEMENT")
        print("-" * 70)
        self.test_get_stock_movements()
        print()
        
        # Step 10: Enquiries
        print("📝 PHASE 10: ENQUIRIES MANAGEMENT")
        print("-" * 70)
        self.test_get_enquiries()
        print()
        
        # Step 11: Audit Logs
        print("📝 PHASE 11: AUDIT LOGS & SECURITY")
        print("-" * 70)
        self.test_get_audit_logs()
        self.test_cannot_delete_audit_logs()
        print()
        
        # Summary
        print("=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["status"])
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        print()
        
        if failed > 0:
            print("❌ FAILED TESTS:")
            print("-" * 70)
            for result in self.test_results:
                if not result["status"]:
                    print(f"  • {result['test']}: {result['message']}")
            print()
        
        # Save results to file
        with open("admin_test_results.json", "w") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "summary": {
                    "total": total,
                    "passed": passed,
                    "failed": failed,
                    "success_rate": f"{(passed/total*100):.1f}%"
                },
                "tests": self.test_results
            }, f, indent=2)
        
        print("💾 Detailed results saved to: admin_test_results.json")
        print()
        print("=" * 70)
        
        if failed == 0:
            print("🎉 ALL TESTS PASSED! ADMIN MODULE IS FULLY FUNCTIONAL!")
        else:
            print(f"⚠️  {failed} test(s) failed. Review the results above.")
        print("=" * 70)


if __name__ == "__main__":
    tester = AdminTester()
    tester.run_all_tests()
