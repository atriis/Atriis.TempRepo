const report = require('multiple-cucumber-html-reporter');
const path = require('path');
const fs = require('fs');

const jsonFile = path.resolve('test-results/cucumber-report.json');

if (!fs.existsSync(jsonFile)) {
  console.error('No cucumber-report.json found. Run tests first.');
  process.exit(1);
}

report.generate({
  jsonDir: 'test-results/',
  reportPath: 'test-results/html-report/',
  metadata: {
    browser: { name: 'chromium', version: 'latest' },
    platform: { name: 'Windows', version: '11' },
  },
  customData: {
    title: 'Atriis Test Automation',
    data: [
      { label: 'Project', value: 'Atriis BDD Tests' },
      { label: 'Framework', value: 'Playwright + Cucumber' },
      { label: 'Generated', value: new Date().toLocaleString() },
    ],
  },
  reportName: 'Atriis Test Report',
  pageTitle: 'Atriis Test Report',
  displayDuration: true,
  displayReportTime: true,
  openReportInBrowser: true,
});

console.log('Report generated at test-results/html-report/index.html');
