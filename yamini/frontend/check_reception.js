// Temporary test to check if ReceptionNav is even being imported
import fs from 'fs';

const adminLayoutPath = './src/admin/layout/AdminLayout.jsx';
const content = fs.readFileSync(adminLayoutPath, 'utf8');

console.log('=== AdminLayout Analysis ===');
console.log('1. ReceptionNav import:', content.match(/import.*ReceptionNav.*from/)?.[0] || 'NOT FOUND');
console.log('2. Role check for RECEPTIONIST:', content.match(/userRole === 'RECEPTIONIST'[\s\S]{0,200}/)?.[0] || 'NOT FOUND');
console.log('3. ReceptionNav render:', content.match(/<ReceptionNav[\s\S]{0,150}\/>/)?.[0] || 'NOT FOUND');
