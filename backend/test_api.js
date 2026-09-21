const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- 1. Health Check ---');
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('Health:', health.status, health.data);

  console.log('\n--- 2. Mark In ---');
  const markIn = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/mark-in',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { in_time: '09:32', notes: 'Lab experiments & literature review' }
  );
  console.log('Mark In result:', markIn.status, markIn.data);

  console.log('\n--- 3. Duplicate Mark In (Safeguard Test) ---');
  const dupMarkIn = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/mark-in',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { in_time: '09:45' }
  );
  console.log('Duplicate Mark In rejection (expected 400):', dupMarkIn.status, dupMarkIn.data);

  console.log('\n--- 4. Mark Out ---');
  const markOut = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/mark-out',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { out_time: '17:14' }
  );
  console.log('Mark Out result (expected 7h 42m = 462 min):', markOut.status, markOut.data);

  console.log('\n--- 5. Duplicate Mark Out (Safeguard Test) ---');
  const dupMarkOut = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/mark-out',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { out_time: '17:30' }
  );
  console.log('Duplicate Mark Out rejection (expected 400):', dupMarkOut.status, dupMarkOut.data);

  console.log('\n--- 6. Get Attendance List & Stats ---');
  const list = await request({ hostname: 'localhost', port: 5000, path: '/api/attendance', method: 'GET' });
  console.log('Attendance records count:', list.data.records.length, list.data.records[0]);

  const stats = await request({ hostname: 'localhost', port: 5000, path: '/api/attendance/stats', method: 'GET' });
  console.log('Stats:', stats.data);
}

runTests().catch(console.error);
