const fetch = require('node-fetch');

async function testAttendanceAPI() {
    const baseUrl = 'http://localhost:3000/api/v1';
    
    console.log('🧪 Testing Attendance API Integration...\n');
    
    // Test 1: Create attendance log with student code
    console.log('📝 Test 1: Creating attendance log for student...');
    try {
        const studentResponse = await fetch(`${baseUrl}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_type: 'student',
                code: 'STU-001', // Assuming this student exists
                match_confidence: 95.0
            })
        });
        
        const studentResult = await studentResponse.json();
        console.log(`Status: ${studentResponse.status}`);
        console.log('Response:', JSON.stringify(studentResult, null, 2));
        
        if (studentResponse.status === 201) {
            console.log('✅ Student attendance logged successfully!\n');
        } else if (studentResponse.status === 404) {
            console.log('⚠️  Student not found - this is expected if STU-001 doesn\'t exist\n');
        } else if (studentResponse.status === 409) {
            console.log('⚠️  Duplicate attendance - student already logged in recently\n');
        } else {
            console.log('❌ Unexpected response\n');
        }
    } catch (error) {
        console.log('❌ Error testing student attendance:', error.message, '\n');
    }
    
    // Test 2: Create attendance log with employee code
    console.log('📝 Test 2: Creating attendance log for employee...');
    try {
        const employeeResponse = await fetch(`${baseUrl}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_type: 'employee',
                code: 'EMP-001', // Assuming this employee exists
                match_confidence: 95.0
            })
        });
        
        const employeeResult = await employeeResponse.json();
        console.log(`Status: ${employeeResponse.status}`);
        console.log('Response:', JSON.stringify(employeeResult, null, 2));
        
        if (employeeResponse.status === 201) {
            console.log('✅ Employee attendance logged successfully!\n');
        } else if (employeeResponse.status === 404) {
            console.log('⚠️  Employee not found - this is expected if EMP-001 doesn\'t exist\n');
        } else if (employeeResponse.status === 409) {
            console.log('⚠️  Duplicate attendance - employee already logged in recently\n');
        } else {
            console.log('❌ Unexpected response\n');
        }
    } catch (error) {
        console.log('❌ Error testing employee attendance:', error.message, '\n');
    }
    
    // Test 3: Get all attendance logs
    console.log('📋 Test 3: Fetching all attendance logs...');
    try {
        const logsResponse = await fetch(`${baseUrl}/attendance`);
        const logsResult = await logsResponse.json();
        
        console.log(`Status: ${logsResponse.status}`);
        if (logsResponse.status === 200) {
            console.log(`✅ Found ${logsResult.data?.length || 0} attendance logs`);
            if (logsResult.data && logsResult.data.length > 0) {
                console.log('Latest log:', JSON.stringify(logsResult.data[0], null, 2));
            }
        } else {
            console.log('❌ Failed to fetch attendance logs');
            console.log('Response:', JSON.stringify(logsResult, null, 2));
        }
    } catch (error) {
        console.log('❌ Error fetching attendance logs:', error.message);
    }
    
    console.log('\n🏁 API Test Complete!');
}

// Run the test
testAttendanceAPI().catch(console.error);
