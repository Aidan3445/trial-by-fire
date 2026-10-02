const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# pod-deployment-target';

// Some pods still declare iOS 9.0, which newer Xcode rejects.
// Raise every pod target to at least the app's deployment target.
const SNIPPET = `
    ${MARKER}
    min_target = podfile_properties['ios.deploymentTarget'] || '15.1'
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current) < Gem::Version.new(min_target)
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_target
        end
      end
    end
`;

function withPodDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');
      if (!podfile.includes(MARKER)) {
        podfile = podfile.replace(/(post_install do \|installer\|\n)/, `$1${SNIPPET}`);
        fs.writeFileSync(podfilePath, podfile);
      }
      return config;
    },
  ]);
}

module.exports = withPodDeploymentTarget;
