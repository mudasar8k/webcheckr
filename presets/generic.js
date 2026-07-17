/*
 * Generic Website preset - the always-on base.
 *
 * Every site gets these checks. Platform presets may ADD results on top, but
 * they never replace or modify generic rule behaviour.
 */
SiteQA.presets.generic = {
  id: 'generic',
  name: 'Generic Website',
  // Badge/report label: "Generic", "Generic + WebToolkit", "Generic + WordPress".
  shortName: 'Generic',
  base: true,
  matches: function () { return true; },
  // Order controls report/section ordering.
  checkKeys: ['basic', 'seo', 'social', 'links', 'buttons', 'downloads', 'accessibility', 'content', 'performance']
};

/*
 * Resolve which presets are active for a page.
 *
 * Returns:
 * {
 *   basePreset: 'generic',
 *   detectedPreset?: string,
 *   selectedPreset?: string,
 *   activePresets: string[],
 *   detectionConfidence?: 'high'|'medium'|'low',
 *   detectionReasons?: string[]
 * }
 */
SiteQA.resolvePresets = function (data, selectedPreset) {
  var detection = SiteQA.detectPlatform(data);
  var active = ['generic'];

  // A platform preset only becomes active if it is registered AND has checks
  // to contribute. Placeholder presets stay inactive until implemented.
  function activate(id) {
    var p = SiteQA.presets[id];
    if (!p || p.placeholder || typeof p.run !== 'function') return false;
    // Never trust detection alone for host-scoped presets.
    if (typeof p.matches === 'function' && !p.matches(data)) return false;
    if (active.indexOf(id) === -1) active.push(id);
    return true;
  }

  if (selectedPreset && selectedPreset !== 'generic') activate(selectedPreset);
  if (detection.platform) activate(detection.platform);

  // Host-scoped presets (exact hostname) always apply regardless of detection.
  Object.keys(SiteQA.presets).forEach(function (id) {
    var p = SiteQA.presets[id];
    if (p && p.hostScoped && typeof p.matches === 'function' && p.matches(data)) activate(id);
  });

  return {
    basePreset: 'generic',
    detectedPreset: detection.platform || undefined,
    selectedPreset: selectedPreset || undefined,
    activePresets: active,
    detectionConfidence: detection.confidence || undefined,
    detectionReasons: detection.reasons && detection.reasons.length ? detection.reasons : undefined,
    detectionExact: !!detection.exact
  };
};

/* Human label for the badge, e.g. "Generic + WebToolkit". */
SiteQA.presetLabel = function (activePresets) {
  return (activePresets || ['generic']).map(function (id) {
    var p = SiteQA.presets[id];
    return p ? (p.shortName || p.name) : id;
  }).join(' + ');
};
