/* Open Graph / Twitter social preview checks. */
SiteQA.register('social', function (data) {
  var out = [];
  var CAT = 'Social';
  var og = data.og || {};
  var tw = data.twitter || {};

  function requireTag(val, tag, id, title, severity) {
    if (val) {
      out.push(SiteQA.pass(CAT, id + '.present', title, tag + ' present.'));
      return true;
    }
    out.push(SiteQA.warn(CAT, id + '.missing', title, tag + ' is missing.', {
      severity: severity,
      recommendation: 'Add the ' + tag + ' meta tag for correct social previews.',
      elements: [{ location: '<head>', tagName: 'meta', attribute: tag }]
    }));
    return false;
  }

  requireTag(og.title, 'og:title', 'social.og.title', 'OG title', 'medium');
  requireTag(og.description, 'og:description', 'social.og.description', 'OG description', 'medium');
  var hasImg = requireTag(og.image, 'og:image', 'social.og.image', 'OG image', 'medium');

  if (og.url) out.push(SiteQA.pass(CAT, 'social.og.url', 'OG url', 'og:url present.'));
  if (og.type) out.push(SiteQA.pass(CAT, 'social.og.type', 'OG type', 'og:type = ' + og.type));

  if (hasImg) {
    out.push(SiteQA.info(CAT, 'social.og.image.url', 'OG image URL', og.image, {
      elements: [{ location: 'meta[property="og:image"]', url: og.image }]
    }));

    if (!SiteQA.isAbsoluteUrl(og.image)) {
      out.push(SiteQA.warn(CAT, 'social.og.image.relative', 'OG image absolute',
        'og:image is a relative URL, not an absolute one.', {
          severity: 'medium',
          recommendation: 'Use a full absolute HTTPS URL for og:image — crawlers cannot resolve relative paths.',
          elements: [{ location: 'meta[property="og:image"]', value: og.image }]
        }));
    } else if (!/^https:\/\//i.test(og.image)) {
      out.push(SiteQA.warn(CAT, 'social.og.image.insecure', 'OG image HTTPS',
        'og:image does not use HTTPS.', {
          severity: 'medium',
          recommendation: 'Serve the Open Graph image over HTTPS.',
          elements: [{ location: 'meta[property="og:image"]', url: og.image }]
        }));
    } else {
      out.push(SiteQA.pass(CAT, 'social.og.image.format', 'OG image URL format',
        'Absolute HTTPS URL.'));
    }
  }

  requireTag(tw.card, 'twitter:card', 'social.twitter.card', 'Twitter card', 'low');
  if (tw.title) out.push(SiteQA.pass(CAT, 'social.twitter.title', 'Twitter title', 'twitter:title present.'));
  if (tw.description) out.push(SiteQA.pass(CAT, 'social.twitter.description', 'Twitter description', 'twitter:description present.'));
  requireTag(tw.image, 'twitter:image', 'social.twitter.image', 'Twitter image', 'low');

  return out;
});
