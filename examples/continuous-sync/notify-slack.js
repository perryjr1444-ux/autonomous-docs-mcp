#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { report: './sync-report.json' };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    config[key] = args[i + 1];
  }

  return config;
}

function sendSlackNotification(webhookUrl, message) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const payload = JSON.stringify(message);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Slack API error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function formatSlackMessage(report) {
  const statusEmoji = {
    'synced': ':white_check_mark:',
    'outdated': ':warning:',
    'incomplete': ':x:'
  };

  const emoji = statusEmoji[report.status] || ':question:';
  const date = new Date(report.timestamp).toLocaleDateString();

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📚 Documentation Sync Report - ${date}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Status:* ${emoji} ${report.status.toUpperCase()}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Total Docs:*\n${report.summary.totalDocFiles}`
        },
        {
          type: 'mrkdwn',
          text: `*Up to Date:*\n${report.summary.upToDate}`
        },
        {
          type: 'mrkdwn',
          text: `*Outdated:*\n${report.summary.outdatedDocs}`
        },
        {
          type: 'mrkdwn',
          text: `*Missing:*\n${report.summary.missingDocs}`
        }
      ]
    }
  ];

  if (report.outdated.length > 0) {
    const outdatedList = report.outdated
      .slice(0, 5)
      .map(item => `• ${item.doc} (${item.daysBehind} days behind)`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Outdated Files:*\n${outdatedList}`
      }
    });

    if (report.outdated.length > 5) {
      blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `_...and ${report.outdated.length - 5} more_`
        }]
      });
    }
  }

  if (report.missing.length > 0) {
    const missingList = report.missing
      .slice(0, 5)
      .map(item => `• ${item.expectedDoc}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Missing Documentation:*\n${missingList}`
      }
    });
  }

  if (report.recommendations.length > 0) {
    const recText = report.recommendations
      .map(rec => `• ${rec.message}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Recommendations:*\n${recText}`
      }
    });
  }

  return { blocks };
}

async function main() {
  const config = parseArgs();
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('Error: SLACK_WEBHOOK_URL environment variable not set');
    process.exit(1);
  }

  if (!fs.existsSync(config.report)) {
    console.error(`Error: Report file not found: ${config.report}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(config.report, 'utf-8'));
  const message = formatSlackMessage(report);

  console.log('Sending Slack notification...');
  
  try {
    await sendSlackNotification(webhookUrl, message);
    console.log('✓ Slack notification sent successfully');
  } catch (error) {
    console.error('✗ Failed to send Slack notification:', error.message);
    process.exit(1);
  }
}

main();
