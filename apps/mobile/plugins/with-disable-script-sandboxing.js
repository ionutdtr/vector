const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Expo `prebuild` regenerates ios/ with ENABLE_USER_SCRIPT_SANDBOXING = YES,
 * which makes the "Bundle React Native code and images" build phase fail under
 * Xcode 15+ (the sandbox denies the ip.txt write into the .app bundle). This
 * plugin forces the setting off on every prebuild so the fix is durable.
 */
const withDisableScriptSandboxing = (config) =>
  withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const buildConfigs = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(buildConfigs)) {
      const entry = buildConfigs[key];
      // Skip the `<key>_comment` string entries; only real config objects have buildSettings.
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) continue;
      entry.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
    }
    return cfg;
  });

module.exports = withDisableScriptSandboxing;
