const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');


function withXcodeCloudScript(config) {
  // eslint-disable-next-line no-undef
  const script = fs.readFileSync(path.join(__dirname, '../scripts/ci_post_clone.sh'), 'utf8');
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const dir = path.join(config.modRequest.platformProjectRoot, 'ci_scripts');
      fs.mkdirSync(dir, { recursive: true });
      const scriptPath = path.join(dir, 'ci_post_clone.sh');
      fs.writeFileSync(scriptPath, script, { mode: 0o755 });
      return config;
    },
  ]);
}

module.exports = withXcodeCloudScript;
