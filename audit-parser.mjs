import fs from 'fs';

let outputStr = '';

function log(msg) {
  outputStr += msg + '\n';
}

// 1. Lint Report
try {
  const lintData = JSON.parse(fs.readFileSync('lint_report.json', 'utf-8'));
  let errCount = 0;
  let warnCount = 0;
  for (const file of lintData) {
    errCount += file.errorCount;
    warnCount += file.warningCount;
  }
  log(`\n=== ESLint Results ===`);
  log(`Total Errors: ${errCount}`);
  log(`Total Warnings: ${warnCount}`);
} catch (e) {
  log("Failed to parse lint_report.json");
}

// 2. Test Report
try {
  const testData = JSON.parse(fs.readFileSync('test_report.json', 'utf-8'));
  log(`\n=== Vitest Results ===`);
  log(`Status: ${testData.success ? 'Passed' : 'Failed'}`);
  log(`Total Passed: ${testData.numPassedTests}`);
  log(`Total Failed: ${testData.numFailedTests}`);
  
  if (testData.testResults) {
    const failedSuites = testData.testResults.filter(suite => suite.status === 'failed');
    log(`Failed Suites: ${failedSuites.map(s => s.name).join(', ')}`);
  }
} catch (e) {
  log("Failed to parse test_report.json");
}

// 3. Build Report
try {
  let buildData = fs.readFileSync('build_report.txt', 'utf16le');
  if (buildData.includes('\0')) {
     buildData = buildData.replace(/\0/g, ''); 
  }
  log(`\n=== Build Results ===`);
  const lines = buildData.split('\n');
  const errorLines = lines.filter(l => l.toLowerCase().includes('error'));
  if (errorLines.length > 0) {
    log(`Errors found:`);
    log(errorLines.slice(0, 15).join('\n'));
  } else {
    log(`Build output (last 10 lines):`);
    log(lines.slice(-10).join('\n'));
  }
} catch (e) {
  log("Failed to read build_report.txt");
}

fs.writeFileSync('parser_output_fixed.txt', outputStr, 'utf8');
