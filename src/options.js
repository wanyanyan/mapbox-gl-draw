const xtend = require('xtend');
const Constants = require('./constants');

const defaultOptions = {
  defaultMode: Constants.modes.SIMPLE_SELECT,
  position: 'top-left',
  keybindings: true,
  clickBuffer: 2,
  boxSelect: true,
  displayControlsDefault: true,
  styles: require('./lib/theme'),
  controls: {}
};

const showControls = {
  point: true,
  line_string: true,
  polygon: true,
  trash: true
};

const hideControls = {
  point: false,
  line_string: false,
  polygon: false,
  trash: false
};

function addSources(styles, sourceBucket) {
  return styles.map(function(style){
    if (style.source) return style;
    return xtend(style, {
      id: style.id+"."+sourceBucket,
      source: (sourceBucket === 'hot')
        ? Constants.sources.HOT
        : Constants.sources.COLD
    });
  });
}

module.exports = function(options) {
  if(options===undefined){options={};}
  var withDefaults = xtend(options);

  if (!options.controls) {
    withDefaults.controls = {};
  }

  if (options.displayControlsDefault === false) {
    withDefaults.controls = xtend(hideControls, options.controls);
  } else {
    withDefaults.controls = xtend(showControls, options.controls);
  }

  withDefaults = xtend(defaultOptions, withDefaults);

  // Layers with a shared source should be adjacent for performance reasons
  withDefaults.styles = addSources(withDefaults.styles, 'cold').concat(addSources(withDefaults.styles, 'hot'));

  return withDefaults;
};
